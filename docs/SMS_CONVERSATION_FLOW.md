# SMS Conversation Flow - PIN Management System

**Version:** 1.0  
**Date:** October 31, 2025  
**System:** SPR Vice City - Contractor PIN Delivery

---

## 🎯 **CONVERSATION FLOW OVERVIEW**

### **State Machine**
```
INITIAL → AWAITING_INFO → CONFIRMING → PIN_DELIVERED → COMPLETED
   ↓            ↓             ↓              ↓            ↓
Company     Unit+End      Confirm        Deliver       Archive
  Name                                     PIN
```

### **Success Path Timeline**
1. Contractor texts company name (10 seconds)
2. System requests unit info (instant)
3. Contractor provides unit + roof end (30 seconds)
4. System validates & confirms (instant)
5. Contractor confirms "yes" (10 seconds)
6. System delivers PIN + instructions (instant)
7. **Total:** ~50 seconds from start to PIN

---

## 📱 **DETAILED CONVERSATION SCRIPT**

### **PROPERTY CONTEXT**
- **Property Name:** Sandpiper Run
- **Location:** Coastal South Carolina
- **Buildings:** A, B, C, D (4 buildings)
- **Valid Units:** 164 total units
- **Access Points:** Each building has North and South roof access

### **STATE 1: INITIAL CONTACT**

#### **Contractor Action:**
```
FROM: +1-555-123-4567
TO: Your Twilio Number (Sandpiper Run)
MESSAGE: "ABC Roofing"
```

#### **System Response:**
```
Hello ABC Roofing! Thank you for contacting us.

To provide you with the correct access PIN, please tell me:

1. What unit number are you servicing?
2. Which end of the building (north or south)?

Example: "B2G South end"
```

#### **Database Actions:**
- Creates new conversation record
- Sets `conversation_state = 'awaiting_info'`
- Logs incoming message: "ABC Roofing"
- Logs outgoing response
- Stores `phone_number` and `company_name`

#### **Guardrails:**
- ✅ Company name validated (min 2 chars, must have vowel)
- ✅ Rejects gibberish (asdf, qwer, keyboard mashing)
- ✅ Rejects vulgar/offensive terms (asshat, profanity)
- ✅ Trims whitespace
- ✅ No conversation created for invalid names

---

### **STATE 2: AWAITING UNIT INFO**

#### **Happy Path - Valid Unit + Roof End**

**Contractor:**
```
"B2G South end"
```

**System Response:**
```
Perfect! Let me confirm:

• Date: Thursday, October 31, 2025
• Company: ABC Roofing
• Building: Building B
• Unit: B2G
• Roof End: South

Is this correct? (Reply "yes" or "Y" to receive the access PIN)
```

**Validation Process:**
1. Extract unit number via regex: `/([a-d]\d[a-z])/i`
2. Extract roof end via regex: `/\b(north|south)\b/i`
3. Query `valid_units` table for unit existence
4. Query `buildings` table for roof end match
5. Update conversation with building_id, unit_number, roof_end
6. Set `conversation_state = 'confirming'`

**Guardrails:**
- ✅ Case-insensitive matching
- ✅ Unit auto-capitalized to uppercase
- ✅ Accepts various formats:
  - "B2G South"
  - "b2g south end"
  - "Unit B2G on the south side"
  - "south end b2g"

---

#### **Error Path 1: Missing Information**

**Contractor:**
```
"B2G"
```
(Missing roof end)

**System Response:**
```
I need both the unit number (like B2G) and the roof end (north or south). Please provide both.

Example: "B2G South end"
```

**Guardrails:**
- ✅ Stays in `awaiting_info` state
- ✅ Logs failed attempt
- ✅ Provides helpful example
- ✅ Allows unlimited retries

---

#### **Error Path 2: Invalid Unit Number**

**Contractor:**
```
"X99 north end"
```

**System Response:**
```
Unfortunately, "X99" is not a valid Unit # here at Sandpiper Run. Please double-check the Unit # and try again.
```

**Database Check:**
```sql
SELECT * FROM valid_units WHERE unit_number = 'X99'
-- Returns NULL = Invalid unit
```

**Guardrails:**
- ✅ Validates against 164 valid units
- ✅ Provides format guidance
- ✅ Gives real examples
- ✅ Stays in `awaiting_info` state
- ✅ Educational - teaches correct format

---

#### **Important: North/South End Validation**

**CRITICAL CLARIFICATION:**
- **North/South is NOT tied to unit numbers**
- **It's purely for security verification**
- Contractors must know which end they need based on job location
- Buildings have both north and south roof access points
- System accepts any valid unit + any end (north or south)
- Building determined from first character of unit (A1A → Building A)

**Example:**
```
Contractor: "B2G north end"
System: Validates B2G exists ✓
System: Determines Building B from "B" ✓
System: Accepts "north" as valid end ✓
System: Proceeds to confirmation
```

**Guardrails:**
- ✅ Unit validated against valid_units table (164 units)
- ✅ Building determined from unit's first character
- ✅ North/South stored for security tracking
- ✅ No rejection based on north/south choice
- ✅ Contractor must know correct end for their job

---

#### **Error Path 4: Gibberish Input**

**Contractor:**
```
"I need access"
```

**System Response:**
```
I need both the unit number (like B2G) and the roof end (north or south). Please provide both.

Example: "B2G South end"
```

**Guardrails:**
- ✅ Regex fails gracefully
- ✅ Returns to standard prompt
- ✅ No error thrown
- ✅ Patient retry mechanism

---

### **STATE 3: CONFIRMING**

#### **Happy Path - Confirmation**

**Contractor:**
```
"yes"
```

**System Response:**
```
Here's your access information:

🔑 PIN: 1234
📍 Building: Building B
🏢 Unit: B2G

Access Instructions:
1. Use provided PIN to open lock box with key to roof/lock inside
2. Secure all doors when finished (5:00 PM work cutoff)
3. Return key to lockbox and close it

Thank you and have a safe workday!
```

**Database Actions:**
1. Query `active_pins` for building_id where `valid_until >= today`
2. Query `buildings` for access_instructions
3. Update conversation: `conversation_state = 'pin_delivered'`
4. Set `pin_delivered_at = NOW()`
5. Log outgoing PIN message
6. Update conversation: `conversation_state = 'completed'`

**Guardrails:**
- ✅ Accepts: "yes", "y", "Y", "correct", "confirm", "YES"
- ✅ Case-insensitive matching (except single "y" must be lowercase)
- ✅ Includes emojis for visual clarity
- ✅ Work cutoff reminder (5 PM)
- ✅ Simplified 3-step access instructions
- ✅ Same-day access confirmation via date display

---

#### **Alternative Path - Rejection**

**Contractor:**
```
"no"
```

**System Response:**
```
Let's start over. Please provide the unit number and roof end (north or south).

Example: "B2G South end"
```

**Database Actions:**
1. Update conversation: `conversation_state = 'awaiting_info'`
2. Clear fields: `building_id = NULL`, `unit_number = NULL`, `roof_end = NULL`
3. Log rejection

**Guardrails:**
- ✅ Accepts: "no", "wrong", "incorrect", "nope"
- ✅ Resets to unit input state
- ✅ Preserves company_name and phone_number
- ✅ Allows fresh start without creating new conversation

---

#### **Error Path - No Active PIN**

**Contractor:**
```
"yes"
```

**System Response:**
```
I apologize, but there's no active PIN available for this building at the moment. Please contact the property manager directly.
```

**Database Query:**
```sql
SELECT * FROM active_pins 
WHERE building_id = 'xxx' 
  AND valid_until >= CURRENT_DATE
-- Returns NULL = No active PIN
```

**Guardrails:**
- ✅ Graceful failure
- ✅ Sets `conversation_state = 'pin_delivered'` (to prevent retry loop)
- ✅ Directs to property manager
- ⚠️ **TODO:** Add property manager contact info to message

---

### **STATE 4: PIN DELIVERED**

**No Further Actions:**
- Conversation marked as `completed`
- All messages logged in `conversation_messages`
- Viewable in Admin → "View Conversations"
- Contractor can start new conversation by texting company name again

---

## 🛡️ **GUARDRAILS & VALIDATION**

### **Input Validation**

#### **Unit Number Extraction**
```typescript
const unitMatch = message.match(/([a-d]\d[a-z])/i);
```

**Accepts:**
- `b2g` → B2G ✅
- `B2G` → B2G ✅
- `unit b2g` → B2G ✅
- `B 2 G` → Fails (spaces not allowed) ❌

**Improvement Needed:**
```typescript
// More flexible regex:
const unitMatch = message.match(/([a-d]\s*\d\s*[a-z])/i);
// Accepts: "B 2 G", "b2 g", etc.
```

---

#### **Roof End Extraction**
```typescript
const roofEndMatch = message.match(/\b(north|south)\b/i);
```

**Accepts:**
- `north` ✅
- `south` ✅
- `North end` ✅
- `the south side` ✅
- `n` ❌ (too ambiguous)

**Current Limitation:** Doesn't accept abbreviations

**Improvement Option:**
```typescript
// Accept N/S abbreviations:
const roofEndMatch = message.match(/\b(n|north|s|south)\b/i);
// Then normalize:
const roofEnd = match === 'n' ? 'north' : match === 's' ? 'south' : match;
```

---

### **Database Validation Layers**

#### **Layer 1: Valid Units Table**
```sql
SELECT * FROM valid_units WHERE unit_number = 'B2G'
```
- **Purpose:** Ensure unit exists in property
- **Result:** Rejects non-existent units immediately
- **Error Message:** Educational (explains format)

#### **Layer 2: Buildings Array Match**
```typescript
const units = roofEnd === 'north' 
  ? building.north_end_units 
  : building.south_end_units;
  
if (units.includes(unitNumber)) {
  return building;
}
```
- **Purpose:** Ensure unit is on correct roof end
- **Result:** Rejects wrong roof end
- **Error Message:** Hints at mistake without revealing answer

#### **Layer 3: Active PIN Check**
```sql
SELECT * FROM active_pins 
WHERE building_id = ? 
  AND valid_until >= CURRENT_DATE
```
- **Purpose:** Ensure PIN is available
- **Result:** Graceful failure if no PIN set
- **Error Message:** Directs to property manager

---

### **State Management**

#### **Conversation States**
```typescript
type ConversationState = 
  | 'initial'         // Just created, no messages yet
  | 'awaiting_info'   // Waiting for unit + roof end
  | 'confirming'      // Waiting for yes/no confirmation
  | 'pin_delivered'   // PIN sent, awaiting acknowledgment
  | 'completed';      // Conversation finished
```

#### **State Transitions**
```
initial → awaiting_info
  ✅ When: Company name received
  ✅ Action: Ask for unit info

awaiting_info → confirming
  ✅ When: Valid unit + roof end received
  ✅ Action: Show confirmation prompt

awaiting_info → awaiting_info
  ✅ When: Invalid input
  ✅ Action: Re-prompt with helpful error

confirming → pin_delivered
  ✅ When: "yes" received
  ✅ Action: Send PIN + instructions

confirming → awaiting_info
  ✅ When: "no" received
  ✅ Action: Reset and re-prompt

pin_delivered → completed
  ✅ When: PIN message sent
  ✅ Action: Archive conversation
```

---

### **Concurrent Conversation Handling**

#### **Current Behavior**
```sql
SELECT * FROM contractor_conversations
WHERE phone_number = ?
  AND conversation_state != 'completed'
ORDER BY created_at DESC
LIMIT 1
```

**Result:**
- ✅ Only ONE active conversation per phone number
- ✅ Previous incomplete conversations ignored
- ✅ New message continues latest active conversation

#### **Edge Case: Abandoned Conversation**
**Scenario:**
1. Contractor starts conversation at 9 AM
2. Gets interrupted before finishing
3. Texts again at 2 PM

**Current Behavior:**
- ✅ Continues the 9 AM conversation
- ✅ State is preserved
- ✅ Picks up where left off

**Potential Issue:**
- ❌ If state is wrong, contractor is confused
- ❌ No way to force restart except completing old conversation

**Improvement Needed:**
```typescript
// Add timeout logic:
const CONVERSATION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

if (existingConv && isExpired(existingConv.updated_at, CONVERSATION_TIMEOUT)) {
  // Mark old conversation as expired
  await markExpired(existingConv.id);
  // Start fresh
  return handleInitialContact(supabase, context);
}
```

---

## 🎨 **MESSAGE FORMATTING**

### **Current Formatting**

#### **Bullets & Emojis**
```
• Company: ABC Roofing          ✅ Good
📍 Building: Building B         ✅ Good
🔑 PIN: 1234                    ✅ Good
```

#### **Numbered Lists**
```
1. Enter through west entrance
2. Take service elevator to roof
3. Use PIN at roof access door
```

**SMS Compatibility:**
- ✅ Plain text works universally
- ✅ Emojis render on all modern phones
- ✅ Formatting preserved

---

### **Message Length**

#### **Current Messages**

**Current Message (PIN Delivery):**
```
Character count: ~270 characters
SMS segments: 2 (160 chars each)
Cost: 2x SMS rate
```

**Optimization Result:**
- ✅ Simplified from 6 steps to 3 steps
- ✅ Reduced from 3 SMS segments to 2
- ✅ 33% cost savings
- ✅ More readable on small screens
- ✅ Faster delivery

---

## 🔧 **SCRIPT IMPROVEMENTS**

### **1. Add Company Name Validation** ✅ IMPLEMENTED

**Feature:**
```typescript
// Rejects:
- Gibberish: "asdf", "qwerty", "xxxxxx"
- Vulgar: "asshat air", profanity
- Too short: Single character
- No vowels: "xyz" 
- Keyboard mashing patterns
```

**Response:**
```
"Please provide a valid company name to request access."
```

**Benefit:**
- ✅ Prevents abuse
- ✅ Maintains professional system
- ✅ No fake/joke requests logged

---

### **2. Add Property Name to Messages** ✅ IMPLEMENTED

**Update:**
```
"Unfortunately, 'X99' is not a valid Unit # here at Sandpiper Run."
```

**Benefit:**
- ✅ Professional branding
- ✅ Clear context for contractors
- ✅ Confirms correct property

---

### **3. Add Date to Confirmation** ✅ IMPLEMENTED

**Update:**
```
• Date: Thursday, October 31, 2025
• Company: ABC Roofing
...
```

**Benefit:**
- ✅ Prevents advance scheduling
- ✅ Confirms same-day access request
- ✅ Security verification

---

### **4. Accept 'Y' for Yes** ✅ IMPLEMENTED

**Update:**
```typescript
if (message === 'y' || message.includes('yes') ...)
```

**Benefit:**
- ✅ Faster contractor response
- ✅ Mobile-friendly (less typing)
- ✅ Common text abbreviation

---

### **5. Simplified Access Instructions** ✅ IMPLEMENTED

**Old:** 6+ steps with building-specific details  
**New:** 3 universal steps

```
1. Use provided PIN to open lock box with key to roof/lock inside
2. Secure all doors when finished (5:00 PM work cutoff)
3. Return key to lockbox and close it
```

**Benefit:**
- ✅ Easier to follow
- ✅ Shorter SMS message (cost savings)
- ✅ Universal for all buildings

---

### **6. Add "Start Over" Keyword** (PLANNED)

**New Feature:**
```typescript
if (message.toLowerCase().includes('start over') || 
    message.toLowerCase().includes('restart')) {
  // Reset conversation regardless of state
  await resetConversation(conversationId);
  return handleInitialContact(supabase, context);
}
```

**Benefit:**
- ✅ Emergency escape hatch
- ✅ User control
- ✅ Reduces support calls

---

### **7. Add Help Command** (PLANNED)

**New Feature:**
```typescript
if (message.toLowerCase() === 'help') {
  return getHelpMessage(conversationState);
}

function getHelpMessage(state: string): string {
  switch (state) {
    case 'awaiting_info':
      return "I need your unit number and roof end.\nExample: B2G South\n\nNeed to start over? Reply 'restart'";
    case 'confirming':
      return "Reply 'yes' to receive PIN, or 'no' to re-enter unit info.";
    default:
      return "Text your company name to request a building access PIN.";
  }
}
```

**Benefit:**
- ✅ Self-service support
- ✅ Context-aware help
- ✅ Reduces confusion

---

### **8. Add Property Manager Contact** (PLANNED)

**Update PIN Failure Message:**
```
I apologize, but there's no active PIN available for this building at the moment.

Please contact the property manager:
📞 Phone: (555) 123-4567
📧 Email: rob@ursllc.com

Or try again later - PINs are updated monthly.
```

**Benefit:**
- ✅ Provides next steps
- ✅ Professional
- ✅ Reduces frustration

---

### **9. Add Work Hours Validation** (PLANNED)

**New Feature:**
```typescript
const currentHour = new Date().getHours();
const WORK_CUTOFF = 17; // 5 PM

if (currentHour >= WORK_CUTOFF) {
  response += "\n\n⚠️ NOTICE: Work cutoff time (5:00 PM) has passed. If starting work now, please notify property management.";
}
```

**Benefit:**
- ✅ Enforces policy
- ✅ Automated compliance
- ✅ Reduces after-hours issues

---

### **10. Add Weekend Warning** (PLANNED)

**New Feature:**
```typescript
const dayOfWeek = new Date().getDay();
const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

if (isWeekend) {
  response += "\n\n⚠️ WEEKEND WORK: Please ensure property manager has approved weekend access.";
}
```

**Benefit:**
- ✅ Policy enforcement
- ✅ Automated reminders
- ✅ Covers edge cases

---

## 🚨 **ERROR SCENARIOS & RECOVERY**

### **Scenario 1: Contractor Typo**

**Problem:**
```
Contractor: "BG2 south"  (transposed digits)
```

**Current Behavior:**
```
"BG2 is not a valid unit number..."
```

**Improvement:**
```typescript
// Fuzzy matching for common typos
function findSimilarUnit(input: string): string | null {
  // Check for transposed characters
  if (input.match(/^[a-d][a-z]\d$/i)) {
    const corrected = input[0] + input[2] + input[1];
    // Check if corrected version is valid
    return validateUnit(corrected) ? corrected : null;
  }
  return null;
}

// Suggested response:
"BG2 is not valid. Did you mean B2G?"
```

**Benefit:**
- ✅ Helpful error correction
- ✅ Faster resolution
- ✅ Better UX

---

### **Scenario 2: Multiple Contractors Same Phone**

**Problem:**
```
9:00 AM: John texts "ABC Roofing"
9:30 AM: Mike (different person, same company phone) texts "XYZ Plumbing"
```

**Current Behavior:**
- ❌ Mike continues John's conversation
- ❌ Confusion ensues

**Solution Needed:**
```typescript
// Option 1: Detect company name mismatch
if (existingConv.company_name !== newCompanyName) {
  // Auto-complete old conversation
  await markCompleted(existingConv.id);
  // Start new conversation
  return handleInitialContact(supabase, context);
}

// Option 2: Add confirmation
if (existingConv.company_name !== newCompanyName) {
  return `I have an active conversation for ${existingConv.company_name}. Reply 'continue' to resume, or 'new' to start fresh for ${newCompanyName}.`;
}
```

---

### **Scenario 3: SMS Gateway Delay**

**Problem:**
```
Contractor sends: "B2G south"
System validates, sends confirmation
30 seconds pass...
Contractor impatient, sends: "B2G south" again
```

**Current Behavior:**
- ✅ Already in 'confirming' state
- ✅ Duplicate message goes to wrong handler
- ❌ Potential confusion

**Solution:**
```typescript
// Add idempotency check
if (context.conversation.conversation_state === 'confirming') {
  const lastMessage = await getLastOutgoingMessage(conversationId);
  if (lastMessage.includes('Is this correct?')) {
    // Resend confirmation
    return lastMessage;
  }
}
```

---

## 📊 **ANALYTICS & MONITORING**

### **Metrics to Track**

#### **Conversation Success Rate**
```sql
SELECT 
  COUNT(*) FILTER (WHERE conversation_state = 'completed') * 100.0 / COUNT(*) as success_rate,
  COUNT(*) FILTER (WHERE conversation_state = 'completed') as successful,
  COUNT(*) as total
FROM contractor_conversations
WHERE created_at > NOW() - INTERVAL '30 days';
```

#### **Average Time to PIN**
```sql
SELECT 
  AVG(EXTRACT(EPOCH FROM (pin_delivered_at - created_at))) as avg_seconds
FROM contractor_conversations
WHERE pin_delivered_at IS NOT NULL;
```

#### **Common Errors**
```sql
-- Track validation failures in conversation_messages
SELECT 
  message_content,
  COUNT(*) as error_count
FROM conversation_messages
WHERE message_type = 'outgoing'
  AND message_content LIKE '%not a valid%'
GROUP BY message_content
ORDER BY error_count DESC;
```

---

## ✅ **FINAL RECOMMENDATIONS**

### **High Priority**
1. ✅ Add "start over" keyword
2. ✅ Add "help" command
3. ✅ Add property manager contact to error messages
4. ✅ Implement conversation timeout (30 min)
5. ✅ Add fuzzy unit matching for typos

### **Medium Priority**
6. ✅ Add work hours validation
7. ✅ Add weekend warning
8. ✅ Improve unit regex for spaces
9. ✅ Add N/S abbreviation support
10. ✅ Split long PIN message into 2 messages

### **Low Priority**
11. ✅ Add analytics tracking
12. ✅ Add admin notification for failed PINs
13. ✅ Add contractor satisfaction survey (optional)
14. ✅ Multi-language support (future)

---

## 🎯 **NEXT STEPS**

1. **Review this script with user** - Get approval on messaging
2. **Implement improvements** - Add recommended features
3. **Create test scenarios** - Cover all paths
4. **Deploy webhook** - Make it live
5. **Monitor & iterate** - Track metrics, improve over time
