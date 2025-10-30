import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface Building {
  id: string;
  building_name: string;
  building_code: string;
  north_end_units: string[];
  south_end_units: string[];
  access_instructions: string;
}

interface Conversation {
  id: string;
  phone_number: string;
  company_name: string | null;
  building_id: string | null;
  unit_number: string | null;
  roof_end: 'north' | 'south' | null;
  conversation_state: 'initial' | 'awaiting_info' | 'confirming' | 'pin_delivered' | 'completed';
}

interface ConversationContext {
  phoneNumber: string;
  messageContent: string;
  conversation?: Conversation;
  buildings: Building[];
}

export class ConversationHandler {
  static async processIncomingMessage(
    supabase: SupabaseClient,
    phoneNumber: string,
    messageContent: string
  ): Promise<string> {
    const buildings = await this.fetchBuildings(supabase);

    const { data: existingConv } = await supabase
      .from('contractor_conversations')
      .select('*')
      .eq('phone_number', phoneNumber)
      .neq('conversation_state', 'completed')
      .order('created_at', { ascending: false })
      .maybeSingle();

    const context: ConversationContext = {
      phoneNumber,
      messageContent,
      conversation: existingConv || undefined,
      buildings,
    };

    if (!existingConv) {
      return await this.handleInitialContact(supabase, context);
    }

    switch (existingConv.conversation_state) {
      case 'initial':
      case 'awaiting_info':
        return await this.handleUnitInfoResponse(supabase, context);
      case 'confirming':
        return await this.handleConfirmationResponse(supabase, context);
      default:
        return "I'm sorry, there seems to be an issue with our conversation. Please start over by texting your company name.";
    }
  }

  private static async fetchBuildings(supabase: SupabaseClient): Promise<Building[]> {
    const { data, error } = await supabase
      .from('buildings')
      .select('*')
      .order('building_code');

    if (error) throw error;
    return (data || []) as Building[];
  }

  private static async handleInitialContact(
    supabase: SupabaseClient,
    context: ConversationContext
  ): Promise<string> {
    const companyName = context.messageContent.trim();

    const { data: newConv, error } = await supabase
      .from('contractor_conversations')
      .insert({
        phone_number: context.phoneNumber,
        company_name: companyName,
        conversation_state: 'awaiting_info',
      })
      .select()
      .single();

    if (error) throw error;

    await this.logMessage(supabase, newConv.id, 'incoming', context.messageContent);

    const response = `Hello ${companyName}! Thank you for contacting us.\n\nTo provide you with the correct access PIN, please tell me:\n\n1. What unit number are you servicing?\n2. Which end of the building (north or south)?\n\nExample: "B2G South end"`;

    await this.logMessage(supabase, newConv.id, 'outgoing', response);

    return response;
  }

  private static async handleUnitInfoResponse(
    supabase: SupabaseClient,
    context: ConversationContext
  ): Promise<string> {
    if (!context.conversation) return "Error: Conversation not found";

    const message = context.messageContent.toLowerCase();

    const unitMatch = message.match(/([a-d]\d[a-z])/i);
    const roofEndMatch = message.match(/\b(north|south)\b/i);

    if (!unitMatch || !roofEndMatch) {
      const response = "I need both the unit number (like B2G) and the roof end (north or south). Please provide both.\n\nExample: \"B2G South end\"";
      await this.logMessage(supabase, context.conversation.id, 'incoming', context.messageContent);
      await this.logMessage(supabase, context.conversation.id, 'outgoing', response);
      return response;
    }

    const unitNumber = unitMatch[0].toUpperCase();
    const roofEnd = roofEndMatch[0].toLowerCase() as 'north' | 'south';

    const building = this.findBuildingByUnit(context.buildings, unitNumber, roofEnd);

    if (!building) {
      const response = `I couldn't find unit ${unitNumber} on the ${roofEnd} end. Please check the unit number and try again.`;
      await this.logMessage(supabase, context.conversation.id, 'incoming', context.messageContent);
      await this.logMessage(supabase, context.conversation.id, 'outgoing', response);
      return response;
    }

    await supabase
      .from('contractor_conversations')
      .update({
        building_id: building.id,
        unit_number: unitNumber,
        roof_end: roofEnd,
        conversation_state: 'confirming',
        updated_at: new Date().toISOString(),
      })
      .eq('id', context.conversation.id);

    const response = `Perfect! Let me confirm:\n\n• Company: ${context.conversation.company_name}\n• Building: ${building.building_name}\n• Unit: ${unitNumber}\n• Roof End: ${roofEnd.charAt(0).toUpperCase() + roofEnd.slice(1)}\n\nIs this correct? (Reply "yes" to receive the access PIN)`;

    await this.logMessage(supabase, context.conversation.id, 'incoming', context.messageContent);
    await this.logMessage(supabase, context.conversation.id, 'outgoing', response);

    return response;
  }

  private static async handleConfirmationResponse(
    supabase: SupabaseClient,
    context: ConversationContext
  ): Promise<string> {
    if (!context.conversation || !context.conversation.building_id) {
      return "Error: Missing conversation data";
    }

    const message = context.messageContent.toLowerCase();

    if (message.includes('yes') || message.includes('correct') || message.includes('confirm')) {
      const { data: pin } = await supabase
        .from('active_pins')
        .select('*')
        .eq('building_id', context.conversation.building_id)
        .gte('valid_until', new Date().toISOString().split('T')[0])
        .maybeSingle();

      if (!pin) {
        const response = "I apologize, but there's no active PIN available for this building at the moment. Please contact the property manager directly.";
        await this.logMessage(supabase, context.conversation.id, 'incoming', context.messageContent);
        await this.logMessage(supabase, context.conversation.id, 'outgoing', response);
        return response;
      }

      const { data: building } = await supabase
        .from('buildings')
        .select('*')
        .eq('id', context.conversation.building_id)
        .single();

      await supabase
        .from('contractor_conversations')
        .update({
          conversation_state: 'pin_delivered',
          pin_delivered_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', context.conversation.id);

      const response = `Here's your access information:\n\n🔑 PIN: ${pin.pin_code}\n📍 Building: ${building?.building_name}\n🏢 Unit: ${context.conversation.unit_number}\n\nAccess Instructions:\n${building?.access_instructions}\n\n⚠️ Important Reminders:\n• Work cutoff time: 5:00 PM\n• Please close and secure all doors\n• Return key to lockbox\n\nThank you and have a safe workday!`;

      await this.logMessage(supabase, context.conversation.id, 'incoming', context.messageContent);
      await this.logMessage(supabase, context.conversation.id, 'outgoing', response);

      await supabase
        .from('contractor_conversations')
        .update({
          conversation_state: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', context.conversation.id);

      return response;
    } else {
      const response = "Let's start over. Please provide the unit number and roof end (north or south).\n\nExample: \"B2G South end\"";

      await supabase
        .from('contractor_conversations')
        .update({
          conversation_state: 'awaiting_info',
          building_id: null,
          unit_number: null,
          roof_end: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', context.conversation.id);

      await this.logMessage(supabase, context.conversation.id, 'incoming', context.messageContent);
      await this.logMessage(supabase, context.conversation.id, 'outgoing', response);

      return response;
    }
  }

  private static findBuildingByUnit(
    buildings: Building[],
    unitNumber: string,
    roofEnd: 'north' | 'south'
  ): Building | null {
    for (const building of buildings) {
      const units = roofEnd === 'north' ? building.north_end_units : building.south_end_units;
      if (units.includes(unitNumber)) {
        return building;
      }
    }
    return null;
  }

  private static async logMessage(
    supabase: SupabaseClient,
    conversationId: string,
    messageType: 'incoming' | 'outgoing',
    messageContent: string
  ): Promise<void> {
    await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        message_type: messageType,
        message_content: messageContent,
      });
  }
}
