import { SupabaseClient } from '@supabase/supabase-js';

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

    const { data: existingConv } = await (supabase as any)
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

    switch ((existingConv as any).conversation_state) {
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
    const { data, error } = await (supabase as any)
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

    // Validate company name - reject gibberish and obvious fakes
    if (!this.isValidCompanyName(companyName)) {
      const response = "Please provide a valid company name to request access.";
      // Don't create conversation for invalid names
      return response;
    }

    const { data: newConv, error } = await (supabase as any)
      .from('contractor_conversations')
      .insert({
        phone_number: context.phoneNumber,
        company_name: companyName,
        conversation_state: 'awaiting_info',
      })
      .select()
      .single();

    if (error) throw error;

    await this.logMessage(supabase, (newConv as any).id, 'incoming', context.messageContent);

    const response = `Hello ${companyName}! Thank you for contacting us.\n\nTo provide you with the correct access PIN, please tell me:\n\n1. What unit number are you servicing?\n2. Which end of the building (north or south)?\n\nExample: "B2G South end"`;

    await this.logMessage(supabase, (newConv as any).id, 'outgoing', response);

    return response;
  }

  private static isValidCompanyName(name: string): boolean {
    // Reject if too short
    if (name.length < 2) return false;

    // Reject obvious gibberish (no vowels or all same character)
    const hasVowel = /[aeiou]/i.test(name);
    const allSameChar = /^(.)\1+$/.test(name.replace(/\s/g, ''));
    if (!hasVowel || allSameChar) return false;

    // Reject vulgar/offensive terms (basic filter)
    const vulgarPatterns = [
      /ass\s*hat/i, /fuck/i, /shit/i, /bitch/i, /damn/i,
      /piss/i, /crap/i, /hell/i, /dick/i, /cock/i
    ];
    if (vulgarPatterns.some(pattern => pattern.test(name))) return false;

    // Reject keyboard mashing patterns
    const gibberishPatterns = [
      /asdf/i, /qwer/i, /zxcv/i, /hjkl/i,
      /[a-z]{8,}/i // 8+ consonants in a row unlikely
    ];
    if (gibberishPatterns.some(pattern => pattern.test(name))) return false;

    return true;
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

    // First, validate unit exists in valid_units table
    const { data: validUnit } = await (supabase as any)
      .from('valid_units')
      .select('*')
      .eq('unit_number', unitNumber)
      .maybeSingle();

    if (!validUnit) {
      const response = `Unfortunately, "${unitNumber}" is not a valid Unit # here at Sandpiper Run. Please double-check the Unit # and try again.`;
      await this.logMessage(supabase, context.conversation.id, 'incoming', context.messageContent);
      await this.logMessage(supabase, context.conversation.id, 'outgoing', response);
      return response;
    }

    // Determine building from unit number (first character)
    const buildingCode = unitNumber[0];
    const building = context.buildings.find(b => b.building_code === buildingCode);

    if (!building) {
      const response = `Unable to determine building for unit ${unitNumber}. Please contact property management.`;
      await this.logMessage(supabase, context.conversation.id, 'incoming', context.messageContent);
      await this.logMessage(supabase, context.conversation.id, 'outgoing', response);
      return response;
    }

    await (supabase as any)
      .from('contractor_conversations')
      .update({
        building_id: building.id,
        unit_number: unitNumber,
        roof_end: roofEnd,
        conversation_state: 'confirming',
        updated_at: new Date().toISOString(),
      })
      .eq('id', context.conversation.id);

    // Get today's date for confirmation
    const today = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const response = `Perfect! Let me confirm:\n\n• Date: ${today}\n• Company: ${context.conversation.company_name}\n• Building: ${building.building_name}\n• Unit: ${unitNumber}\n• Roof End: ${roofEnd.charAt(0).toUpperCase() + roofEnd.slice(1)}\n\nIs this correct? (Reply "yes" or "Y" to receive the access PIN)`;

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

    // Accept: yes, y, correct, confirm
    if (message.includes('yes') || message === 'y' || message.includes('correct') || message.includes('confirm')) {
      // Check work hours: Monday-Friday 8am-5pm only
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
      const hour = now.getHours();

      // Reject weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        const response = "⚠️ SERVICE HOURS NOTICE\n\nContractor work is only permitted Monday-Friday, 8:00 AM - 5:00 PM.\n\nFor emergency service needs, please call:\n📞 [EMERGENCY NUMBER - TO BE PROVIDED]\n\nRegular service requests will be processed on the next business day.";
        await this.logMessage(supabase, context.conversation.id, 'incoming', context.messageContent);
        await this.logMessage(supabase, context.conversation.id, 'outgoing', response);
        return response;
      }

      // Reject outside 8am-5pm
      if (hour < 8 || hour >= 17) {
        const response = "⚠️ SERVICE HOURS NOTICE\n\nContractor work is only permitted Monday-Friday, 8:00 AM - 5:00 PM.\n\nCurrent time is outside permitted work hours.\n\nFor emergency service needs, please call:\n📞 [EMERGENCY NUMBER - TO BE PROVIDED]\n\nRegular service requests will be processed during business hours.";
        await this.logMessage(supabase, context.conversation.id, 'incoming', context.messageContent);
        await this.logMessage(supabase, context.conversation.id, 'outgoing', response);
        return response;
      }
      const { data: pin } = await (supabase as any)
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

      const { data: building } = await (supabase as any)
        .from('buildings')
        .select('*')
        .eq('id', context.conversation.building_id)
        .single();

      await (supabase as any)
        .from('contractor_conversations')
        .update({
          conversation_state: 'pin_delivered',
          pin_delivered_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', context.conversation.id);

      const response = `Here's your access information:

🔑 PIN: ${(pin as any).pin_code}
📍 Building: ${(building as any)?.building_name}
🏢 Unit: ${context.conversation.unit_number}

Access Instructions:
1. Use provided PIN to open lock box with key to roof/lock inside
2. Secure all doors when finished (5:00 PM work cutoff)
3. Return key to lockbox and close it

⚠️ WORK HOURS: Monday-Friday, 8:00 AM - 5:00 PM ONLY

Thank you and have a safe workday!`;

      await this.logMessage(supabase, context.conversation.id, 'incoming', context.messageContent);
      await this.logMessage(supabase, context.conversation.id, 'outgoing', response);

      await (supabase as any)
        .from('contractor_conversations')
        .update({
          conversation_state: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', context.conversation.id);

      return response;
    } else {
      const response = "Let's start over. Please provide the unit number and roof end (north or south).\n\nExample: \"B2G South end\"";

      await (supabase as any)
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

  private static async logMessage(
    supabase: SupabaseClient,
    conversationId: string,
    messageType: 'incoming' | 'outgoing',
    messageContent: string
  ): Promise<void> {
    await (supabase as any)
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        message_type: messageType,
        message_content: messageContent,
      });
  }
}
