# Work Hours Policy - Sandpiper Run

**Effective:** October 31, 2025  
**Property:** Sandpiper Run, Coastal South Carolina

---

## ⏰ **PERMITTED WORK HOURS**

### **Non-Emergency Service Work**
- **Days:** Monday - Friday ONLY
- **Hours:** 8:00 AM - 5:00 PM
- **Time Zone:** Eastern Time (ET)

### **Restrictions**
- ❌ **NO weekend work** (Saturday/Sunday)
- ❌ **NO work before 8:00 AM**
- ❌ **NO work after 5:00 PM**

---

## 🚨 **EMERGENCY SERVICES**

### **After-Hours Emergency Number**
```
📞 [EMERGENCY NUMBER - TO BE PROVIDED BY ROB]
```

**⚠️ ACTION REQUIRED:** Rob needs to provide the after-hours emergency contact number for the system.

### **When to Call Emergency Number**
- Roof leaks requiring immediate attention
- HVAC failures in extreme weather
- Electrical emergencies
- Plumbing emergencies (flooding, sewage)
- Security/safety issues

### **What Qualifies as NON-Emergency**
- Routine maintenance
- Scheduled repairs
- Inspections
- Non-urgent HVAC service
- General contractor work

---

## 📱 **SMS SYSTEM ENFORCEMENT**

### **Automated Checks**

The PIN Management SMS system automatically enforces work hours:

**1. Weekend Requests (Saturday/Sunday)**
```
Contractor: "yes" (to confirm PIN request)
System: ⚠️ SERVICE HOURS NOTICE

Contractor work is only permitted Monday-Friday, 8:00 AM - 5:00 PM.

For emergency service needs, please call:
📞 [EMERGENCY NUMBER - TO BE PROVIDED]

Regular service requests will be processed on the next business day.
```

**2. Outside 8am-5pm (Weekdays)**
```
Contractor: "yes" (at 6:00 PM or 7:00 AM)
System: ⚠️ SERVICE HOURS NOTICE

Contractor work is only permitted Monday-Friday, 8:00 AM - 5:00 PM.

Current time is outside permitted work hours.

For emergency service needs, please call:
📞 [EMERGENCY NUMBER - TO BE PROVIDED]

Regular service requests will be processed during business hours.
```

**3. Within Permitted Hours**
```
Contractor: "yes" (at 10:00 AM on Tuesday)
System: 🔑 PIN: 1234
...
⚠️ WORK HOURS: Monday-Friday, 8:00 AM - 5:00 PM ONLY
```

---

## 🔧 **IMPLEMENTATION DETAILS**

### **Code Location**
`src/utils/conversation-handler.ts` - Line 222-241

### **Validation Logic**
```typescript
const now = new Date();
const dayOfWeek = now.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
const hour = now.getHours();

// Reject weekends
if (dayOfWeek === 0 || dayOfWeek === 6) {
  // Send weekend rejection message
}

// Reject outside 8am-5pm
if (hour < 8 || hour >= 17) {
  // Send after-hours rejection message
}
```

### **What Happens to Rejected Requests**
- ✅ Message logged in `conversation_messages` table
- ✅ Conversation state preserved (can retry during business hours)
- ✅ Contractor directed to emergency number
- ✅ No PIN delivered
- ❌ Conversation NOT marked as completed

---

## 📊 **ANALYTICS IMPACT**

### **Tracked Data**
The system logs ALL requests, including rejected ones:
- Weekend access attempts
- After-hours access attempts
- Time of request
- Day of week
- Company making request

### **Analytics Queries**
```sql
-- Weekend access attempts
SELECT 
  COUNT(*) as weekend_attempts,
  company_name,
  phone_number
FROM contractor_conversations c
JOIN conversation_messages m ON c.id = m.conversation_id
WHERE EXTRACT(DOW FROM m.created_at) IN (0, 6)
  AND m.message_content LIKE '%SERVICE HOURS NOTICE%'
GROUP BY company_name, phone_number
ORDER BY weekend_attempts DESC;

-- After-hours attempts
SELECT 
  EXTRACT(HOUR FROM m.created_at) as hour,
  COUNT(*) as attempts
FROM contractor_conversations c
JOIN conversation_messages m ON c.id = m.conversation_id
WHERE m.message_content LIKE '%SERVICE HOURS NOTICE%'
  AND EXTRACT(DOW FROM m.created_at) BETWEEN 1 AND 5
GROUP BY hour
ORDER BY hour;
```

---

## 🏢 **EXCEPTIONS & OVERRIDES**

### **Emergency Access**
For genuine emergencies:
1. Contractor calls emergency number
2. Property management approves access
3. Property management can manually provide PIN via phone
4. Emergency access logged separately (not via SMS system)

### **Scheduled After-Hours Work**
For pre-approved after-hours maintenance:
1. Property management notified in advance
2. Temporary PIN can be provided directly
3. Not processed through SMS system
4. Special documentation required

---

## 📋 **POLICY ENFORCEMENT**

### **Responsibilities**

**Rob (Property Manager):**
- ✅ Set monthly PINs (via Admin panel)
- ✅ Monitor work hours compliance
- ✅ Provide emergency number to system
- ✅ Handle emergency access requests
- ✅ Review analytics for policy violations

**Contractors:**
- ✅ Request access only during M-F 8am-5pm
- ✅ Call emergency number for urgent needs
- ✅ Respect work hour restrictions
- ✅ Complete work by 5:00 PM cutoff

**Automated System:**
- ✅ Enforce work hours automatically
- ✅ Reject weekend/after-hours requests
- ✅ Provide emergency contact information
- ✅ Log all access attempts
- ✅ Include work hours reminder in all PINs

---

## 🔄 **POLICY UPDATES**

### **Current Status**
- ✅ Work hours validation: IMPLEMENTED
- ⚠️ Emergency number: PENDING (Rob to provide)
- ✅ Weekend rejection: ACTIVE
- ✅ After-hours rejection: ACTIVE
- ✅ Work hours reminder in PIN: ACTIVE

### **To Complete**
1. **Rob provides emergency number**
2. Update `conversation-handler.ts` line 229 and 237
3. Replace `[EMERGENCY NUMBER - TO BE PROVIDED]` with actual number
4. Test emergency number display in rejection messages
5. Update this documentation with final number

### **Future Enhancements**
- [ ] Holiday calendar (reject work on federal holidays)
- [ ] Severe weather exceptions
- [ ] Override codes for approved after-hours work
- [ ] Email notifications to Rob for rejected requests
- [ ] Monthly report of policy violation attempts

---

## 📞 **CONTACT INFORMATION**

**Property Manager:** Rob  
**Email:** rob@ursllc.com  
**Emergency Number:** [TO BE PROVIDED]  

**Last Updated:** October 31, 2025, 8:00 PM EST  
**Updated By:** AI Assistant (Cascade) per Rob's directive
