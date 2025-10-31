# PIN Management System - TODO Checklist

## ✅ **COMPLETED (Current State)**

### Database Infrastructure
- [x] Buildings table with north/south unit arrays
- [x] Active PINs table with monthly validity
- [x] Contractor conversations table with state machine
- [x] Conversation messages table for full history
- [x] Valid units table (164 units loaded!)
- [x] RLS policies for admin-only PIN management
- [x] Foreign keys and cascade deletes configured

### Frontend Components  
- [x] PinManagementDialog - Update monthly PINs (Admin.tsx)
- [x] ConversationsDialog - View all contractor conversations
- [x] ConversationDetailsDialog - Full conversation history with PIN display
- [x] Valid unit validation in DetailsPrevious.tsx
- [x] Valid unit validation in DetailsLive.tsx (Capture flow)

### Business Logic
- [x] ConversationHandler class with state machine
- [x] Unit validation against valid_units table
- [x] Roof end validation (north/south)
- [x] PIN lookup and delivery logic
- [x] Message logging system
- [x] Error handling and user-friendly prompts

---

## 🚨 **CRITICAL - MISSING SMS INTEGRATION**

### 1. Supabase Edge Function - Incoming SMS Webhook
**File:** `supabase/functions/sms-webhook/index.ts`

**Requirements:**
- [ ] Create Edge Function to receive Twilio webhook
- [ ] Parse incoming SMS (phone number, message body)
- [ ] Call `ConversationHandler.processIncomingMessage()`
- [ ] Return TwiML response with reply message
- [ ] Handle errors gracefully
- [ ] Log all webhooks for debugging

**Sample Code Structure:**
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ConversationHandler } from '../../../src/utils/conversation-handler.ts'

serve(async (req) => {
  const formData = await req.formData()
  const from = formData.get('From')
  const body = formData.get('Body')
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  const response = await ConversationHandler.processIncomingMessage(
    supabase,
    from,
    body
  )
  
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${response}</Message></Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  )
})
```

**Steps:**
- [ ] Create `supabase/functions/sms-webhook/index.ts`
- [ ] Deploy Edge Function to Supabase
- [ ] Get webhook URL from Supabase
- [ ] Configure in Twilio phone number settings

---

### 2. Supabase Edge Function - Outgoing SMS
**File:** `supabase/functions/send-sms/index.ts`

**Requirements:**
- [ ] Create Edge Function to send outgoing SMS via Twilio API
- [ ] Accept phone number and message body
- [ ] Use Twilio credentials from environment variables
- [ ] Return success/failure status
- [ ] Log all outgoing messages

**Sample Code Structure:**
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { to, message } = await req.json()
  
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
  const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER')
  
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: fromNumber,
        Body: message,
      }),
    }
  )
  
  return new Response(JSON.stringify({ success: response.ok }))
})
```

**Steps:**
- [ ] Create `supabase/functions/send-sms/index.ts`
- [ ] Deploy Edge Function
- [ ] Add Twilio secrets to Supabase dashboard:
  - [ ] `TWILIO_ACCOUNT_SID`
  - [ ] `TWILIO_AUTH_TOKEN`
  - [ ] `TWILIO_PHONE_NUMBER`

---

### 3. Twilio Account Setup
**Requirements:**
- [ ] Sign up for Twilio account (or use existing)
- [ ] Purchase phone number for SMS
- [ ] Configure webhook URL in Twilio console:
  - [ ] Messaging > Phone Numbers > [Your Number]
  - [ ] A Message Comes In → Webhook → [Supabase Edge Function URL]
  - [ ] HTTP POST
- [ ] Get Account SID and Auth Token
- [ ] Test with sample SMS

---

## 📊 **DATA POPULATION REQUIREMENTS**

### 4. Buildings Data - North/South Unit Arrays
**Status:** ⚠️ **NEEDS VERIFICATION**

**Requirements:**
- [ ] Verify Building A has north_end_units array populated
- [ ] Verify Building A has south_end_units array populated
- [ ] Verify Building B has north_end_units array populated
- [ ] Verify Building B has south_end_units array populated
- [ ] Verify Building C has north_end_units array populated
- [ ] Verify Building C has south_end_units array populated
- [ ] Verify Building D has north_end_units array populated
- [ ] Verify Building D has south_end_units array populated

**Query to Check:**
```sql
SELECT 
  building_code,
  building_name,
  array_length(north_end_units, 1) as north_count,
  array_length(south_end_units, 1) as south_count
FROM buildings
ORDER BY building_code;
```

**Migration Needed If Empty:**
```sql
-- Example for Building A
UPDATE buildings
SET 
  north_end_units = ARRAY['A1A','A1B','A1C',...],
  south_end_units = ARRAY['A1P','A1Q','A1R',...]
WHERE building_code = 'A';
```

---

### 5. Initial Buildings Setup
**Requirements:**
- [ ] Verify 4 buildings exist in database
- [ ] Verify access_instructions field populated for each building
- [ ] Example access instructions:
  - "Enter through main gate. Access code on file. Elevator to [floor]. Unit is on [side]."

**If Missing, Create Migration:**
```sql
INSERT INTO buildings (building_name, building_code, access_instructions) VALUES
('Building A', 'A', 'Enter main gate, use keypad code 1234, elevator to unit floor.'),
('Building B', 'B', 'South entrance, code 5678, stairs or elevator available.'),
('Building C', 'C', 'North gate access, code 9012, follow signs to units.'),
('Building D', 'D', 'West entrance, code 3456, elevator required for upper floors.')
ON CONFLICT (building_code) DO NOTHING;
```

---

## 🧪 **TESTING REQUIREMENTS**

### 6. SMS Conversation Testing Workflow
**Requirements:**
- [ ] Create test checklist for full conversation flow
- [ ] Test initial contact (company name)
- [ ] Test unit + roof end input
- [ ] Test invalid unit number rejection
- [ ] Test correct vs incorrect roof end
- [ ] Test confirmation flow
- [ ] Test PIN delivery
- [ ] Test conversation completion
- [ ] Test error handling
- [ ] Test multiple concurrent conversations

**Test Cases Document:**
- [ ] Create `docs/PIN_MANAGEMENT_TESTING.md`
- [ ] Document happy path scenarios
- [ ] Document error scenarios
- [ ] Document edge cases
- [ ] Create test data scripts

---

### 7. Unit Validation Testing
**Requirements:**
- [ ] Test valid unit in DetailsPrevious.tsx (green checkmark)
- [ ] Test invalid unit in DetailsPrevious.tsx (red X)
- [ ] Test valid unit in DetailsLive.tsx (green checkmark)
- [ ] Test invalid unit in DetailsLive.tsx (red X)
- [ ] Test SMS flow with valid unit
- [ ] Test SMS flow with invalid unit
- [ ] Test SMS flow with wrong roof end

---

## 📱 **MOBILE UI ENHANCEMENTS**

### 8. Admin Page Integration
**Requirements:**
- [x] "Update PINs" button in Admin.tsx
- [x] "View Conversations" button in Admin.tsx  
- [ ] Add real-time conversation count badge
- [ ] Add "Active PINs" summary card
- [ ] Add "Recent Conversations" preview (last 5)

**Code Location:** `src/pages/Admin.tsx`

---

### 9. Todo Checkoff Functionality
**Status:** ❓ **NEEDS CLARIFICATION FROM USER**

**Questions:**
- Where should todo checkoff functionality appear?
- Is this for:
  - [ ] Admin tracking which contractors received PINs?
  - [ ] Admin marking conversations as "acknowledged"?
  - [ ] Contractor checklist within conversation?
  - [ ] Building maintenance tasks?

**Awaiting user input on requirements.**

---

## 📚 **DOCUMENTATION UPDATES**

### 10. System Documentation
**Requirements:**
- [ ] Create `docs/PIN_MANAGEMENT_SYSTEM.md` with:
  - [ ] Architecture overview
  - [ ] Database schema diagram
  - [ ] Conversation flow diagram
  - [ ] SMS webhook setup guide
  - [ ] Twilio configuration guide
  - [ ] Admin user guide
  - [ ] Troubleshooting guide

- [ ] Update `README.md` with PIN Management section
- [ ] Update `docs/WORKFLOW_REVIEW.md` with new features
- [ ] Update `docs/CHANGELOG.md` with version bump

---

### 11. Database Schema Documentation
**Requirements:**
- [ ] Update `docs/DATABASE_MANAGEMENT.md`
- [ ] Document buildings table structure
- [ ] Document active_pins table structure
- [ ] Document contractor_conversations table
- [ ] Document conversation_messages table
- [ ] Document valid_units table usage
- [ ] Add ERD diagram for PIN management tables

---

## 🔒 **SECURITY & COMPLIANCE**

### 12. Security Review
**Requirements:**
- [ ] Verify RLS policies on all PIN tables
- [ ] Test non-admin users cannot access PINs
- [ ] Verify Twilio webhook authentication
- [ ] Add rate limiting to SMS webhook
- [ ] Add SMS message sanitization
- [ ] Review and sanitize all user inputs
- [ ] Add logging for all PIN accesses
- [ ] Add audit trail for PIN updates

**Code Locations:**
- RLS Policies: `supabase/migrations/20251030044515_create_pin_management_schema.sql`
- Webhook Auth: `supabase/functions/sms-webhook/index.ts` (to be created)

---

## 🎯 **PRIORITY ORDER**

### **Phase 1: SMS Integration (CRITICAL)**
1. Create `sms-webhook` Edge Function
2. Create `send-sms` Edge Function  
3. Set up Twilio account and phone number
4. Deploy functions and configure webhooks
5. Test end-to-end SMS flow

### **Phase 2: Data Population**
6. Verify/populate buildings north/south unit arrays
7. Verify access instructions for all buildings
8. Create test data scripts

### **Phase 3: Testing**
9. Create comprehensive test plan
10. Execute test cases
11. Fix bugs and iterate

### **Phase 4: Documentation & Polish**
12. Write system documentation
13. Update project docs
14. Security review
15. Final testing on production

---

## 📞 **CONTACT & SUPPORT**

**User:** Rob (@rob@ursllc.com - Admin)
**Project:** SPR Vice City - PIN Management Integration
**Database:** Supabase (Project ID: fvqojgifgevrwicyhmvj)

---

## 🔄 **CHANGELOG**

**Oct 31, 2025:**
- ✅ Valid units table created and populated (164 units)
- ✅ Unit validation integrated into conversation handler
- ✅ Frontend validation in DetailsPrevious and DetailsLive
- ✅ Auto-capitalization implemented project-wide
- ⚠️ SMS webhook integration pending
- ⚠️ Buildings data population pending verification
