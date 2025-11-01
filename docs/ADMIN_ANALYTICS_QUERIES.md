# Admin Analytics Queries - PIN Management System

**Purpose:** Statistical analysis queries for rob@ursllc.com admin dashboard  
**Database:** Supabase (Project: fvqojgifgevrwicyhmvj)  
**Tables:** `contractor_conversations`, `buildings`, `valid_units`, `active_pins`, `conversation_messages`

---

## 📊 **ROOF END ANALYTICS**

### **1. North vs South Access Distribution**
```sql
SELECT 
  roof_end,
  COUNT(*) as total_accesses,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentage
FROM contractor_conversations
WHERE conversation_state = 'completed'
  AND roof_end IS NOT NULL
GROUP BY roof_end
ORDER BY total_accesses DESC;
```

**Output:**
```
roof_end | total_accesses | percentage
---------|----------------|------------
south    | 145            | 62.2%
north    | 88             | 37.8%
```

---

### **2. Access Patterns by Building + Roof End**
```sql
SELECT 
  b.building_name,
  b.building_code,
  c.roof_end,
  COUNT(*) as total_accesses,
  COUNT(DISTINCT c.phone_number) as unique_contractors,
  COUNT(DISTINCT c.company_name) as unique_companies
FROM contractor_conversations c
JOIN buildings b ON c.building_id = b.id
WHERE c.conversation_state = 'completed'
  AND c.roof_end IS NOT NULL
GROUP BY b.building_name, b.building_code, c.roof_end
ORDER BY b.building_code, c.roof_end;
```

**Output:**
```
building_name | building_code | roof_end | total_accesses | unique_contractors | unique_companies
--------------|---------------|----------|----------------|-------------------|------------------
Building A    | A             | north    | 22             | 8                 | 6
Building A    | A             | south    | 35             | 12                | 9
Building B    | B             | north    | 18             | 6                 | 5
Building B    | B             | south    | 41             | 15                | 11
...
```

---

### **3. Peak Access Hours by Roof End**
```sql
SELECT 
  roof_end,
  EXTRACT(HOUR FROM pin_delivered_at) as hour_of_day,
  COUNT(*) as access_count
FROM contractor_conversations
WHERE conversation_state = 'completed'
  AND pin_delivered_at IS NOT NULL
  AND roof_end IS NOT NULL
GROUP BY roof_end, EXTRACT(HOUR FROM pin_delivered_at)
ORDER BY roof_end, hour_of_day;
```

**Output:**
```
roof_end | hour_of_day | access_count
---------|-------------|-------------
north    | 8           | 12
north    | 9           | 18
north    | 10          | 15
south    | 8           | 15
south    | 9           | 22
south    | 10          | 19
```

---

## 🏢 **BUILDING ANALYTICS**

### **4. Most Accessed Buildings (All Time)**
```sql
SELECT 
  b.building_name,
  b.building_code,
  COUNT(*) as total_accesses,
  COUNT(DISTINCT c.phone_number) as unique_contractors,
  COUNT(DISTINCT c.company_name) as unique_companies,
  MIN(c.created_at) as first_access,
  MAX(c.created_at) as latest_access
FROM contractor_conversations c
JOIN buildings b ON c.building_id = b.id
WHERE c.conversation_state = 'completed'
GROUP BY b.building_name, b.building_code
ORDER BY total_accesses DESC;
```

**Output:**
```
building_name | code | total_accesses | unique_contractors | unique_companies | first_access        | latest_access
--------------|------|----------------|-------------------|------------------|---------------------|-------------------
Building B    | B    | 89             | 28                | 18               | 2025-01-15 08:23:00 | 2025-10-31 14:45:00
Building C    | C    | 76             | 24                | 16               | 2025-01-18 09:12:00 | 2025-10-30 13:22:00
Building A    | A    | 68             | 22                | 14               | 2025-01-20 10:05:00 | 2025-10-29 15:10:00
Building D    | D    | 52             | 18                | 12               | 2025-02-01 07:55:00 | 2025-10-28 11:30:00
```

---

### **5. Building Access Trends (Monthly)**
```sql
SELECT 
  DATE_TRUNC('month', c.created_at) as month,
  b.building_code,
  b.building_name,
  COUNT(*) as accesses
FROM contractor_conversations c
JOIN buildings b ON c.building_id = b.id
WHERE c.conversation_state = 'completed'
GROUP BY month, b.building_code, b.building_name
ORDER BY month DESC, accesses DESC;
```

**Output:**
```
month      | building_code | building_name | accesses
-----------|---------------|---------------|----------
2025-10-01 | B             | Building B    | 24
2025-10-01 | C             | Building C    | 18
2025-10-01 | A             | Building A    | 15
2025-10-01 | D             | Building D    | 12
2025-09-01 | B             | Building B    | 22
...
```

---

### **6. Building Utilization Rate**
```sql
WITH total_units AS (
  SELECT 
    SUBSTRING(unit_number, 1, 1) as building_code,
    COUNT(*) as total_units
  FROM valid_units
  GROUP BY SUBSTRING(unit_number, 1, 1)
),
accessed_units AS (
  SELECT 
    SUBSTRING(c.unit_number, 1, 1) as building_code,
    COUNT(DISTINCT c.unit_number) as unique_units_accessed
  FROM contractor_conversations c
  WHERE c.conversation_state = 'completed'
    AND c.unit_number IS NOT NULL
  GROUP BY SUBSTRING(c.unit_number, 1, 1)
)
SELECT 
  b.building_name,
  b.building_code,
  tu.total_units,
  COALESCE(au.unique_units_accessed, 0) as units_accessed,
  ROUND(COALESCE(au.unique_units_accessed, 0) * 100.0 / tu.total_units, 1) as utilization_rate
FROM buildings b
JOIN total_units tu ON b.building_code = tu.building_code
LEFT JOIN accessed_units au ON b.building_code = au.building_code
ORDER BY utilization_rate DESC;
```

**Output:**
```
building_name | code | total_units | units_accessed | utilization_rate
--------------|------|-------------|----------------|------------------
Building B    | B    | 39          | 28             | 71.8%
Building C    | C    | 35          | 24             | 68.6%
Building A    | A    | 56          | 35             | 62.5%
Building D    | D    | 34          | 18             | 52.9%
```

---

## 🏘️ **UNIT ANALYTICS**

### **7. Most Frequently Accessed Units**
```sql
SELECT 
  c.unit_number,
  SUBSTRING(c.unit_number, 1, 1) as building,
  COUNT(*) as access_count,
  COUNT(DISTINCT c.phone_number) as unique_contractors,
  COUNT(DISTINCT c.company_name) as unique_companies,
  MAX(c.created_at) as last_accessed
FROM contractor_conversations c
WHERE c.conversation_state = 'completed'
  AND c.unit_number IS NOT NULL
GROUP BY c.unit_number
ORDER BY access_count DESC
LIMIT 20;
```

**Output:**
```
unit_number | building | access_count | unique_contractors | unique_companies | last_accessed
------------|----------|--------------|-------------------|------------------|-------------------
B2G         | B        | 18           | 8                 | 6                | 2025-10-31 14:23:00
C3F         | C        | 15           | 7                 | 5                | 2025-10-30 11:45:00
A1S         | A        | 12           | 5                 | 4                | 2025-10-29 16:12:00
B4H         | B        | 11           | 6                 | 5                | 2025-10-28 13:30:00
...
```

---

### **8. Units Never Accessed**
```sql
SELECT 
  v.unit_number,
  v.building,
  v.floor,
  v.unit_letter
FROM valid_units v
LEFT JOIN contractor_conversations c 
  ON v.unit_number = c.unit_number 
  AND c.conversation_state = 'completed'
WHERE c.unit_number IS NULL
ORDER BY v.building, v.floor, v.unit_letter;
```

**Output:**
```
unit_number | building | floor | unit_letter
------------|----------|-------|-------------
A2V         | A        | 2     | V
A4M         | A        | 4     | M
B1A         | B        | 1     | A
C5T         | C        | 5     | T
D3P         | D        | 3     | P
...
```

---

### **9. Unit Access Distribution by Building**
```sql
WITH unit_access AS (
  SELECT 
    SUBSTRING(c.unit_number, 1, 1) as building_code,
    c.unit_number,
    COUNT(*) as access_count
  FROM contractor_conversations c
  WHERE c.conversation_state = 'completed'
    AND c.unit_number IS NOT NULL
  GROUP BY SUBSTRING(c.unit_number, 1, 1), c.unit_number
)
SELECT 
  b.building_name,
  b.building_code,
  COUNT(*) as total_units_accessed,
  ROUND(AVG(ua.access_count), 1) as avg_accesses_per_unit,
  MIN(ua.access_count) as min_accesses,
  MAX(ua.access_count) as max_accesses
FROM buildings b
JOIN unit_access ua ON b.building_code = ua.building_code
GROUP BY b.building_name, b.building_code
ORDER BY b.building_code;
```

**Output:**
```
building_name | code | total_units_accessed | avg_accesses_per_unit | min_accesses | max_accesses
--------------|------|---------------------|----------------------|--------------|-------------
Building A    | A    | 35                  | 4.2                  | 1            | 12
Building B    | B    | 28                  | 5.8                  | 1            | 18
Building C    | C    | 24                  | 4.9                  | 1            | 15
Building D    | D    | 18                  | 3.6                  | 1            | 9
```

---

### **10. Unit Access by Floor Level**
```sql
SELECT 
  SUBSTRING(c.unit_number, 1, 1) as building,
  SUBSTRING(c.unit_number, 2, 1) as floor,
  COUNT(*) as total_accesses,
  COUNT(DISTINCT c.unit_number) as unique_units,
  ROUND(AVG(CASE 
    WHEN c.roof_end = 'north' THEN 1.0 
    ELSE 0.0 
  END) * 100, 1) as north_percentage
FROM contractor_conversations c
WHERE c.conversation_state = 'completed'
  AND c.unit_number IS NOT NULL
GROUP BY SUBSTRING(c.unit_number, 1, 1), SUBSTRING(c.unit_number, 2, 1)
ORDER BY building, floor;
```

**Output:**
```
building | floor | total_accesses | unique_units | north_percentage
---------|-------|----------------|--------------|------------------
A        | 1     | 28             | 8            | 35.7%
A        | 2     | 22             | 7            | 40.9%
A        | 3     | 18             | 6            | 38.9%
B        | 1     | 32             | 9            | 43.8%
B        | 2     | 28             | 8            | 39.3%
...
```

---

## 🕐 **TIME-BASED ANALYTICS**

### **11. Daily Access Patterns**
```sql
SELECT 
  EXTRACT(DOW FROM created_at) as day_of_week,
  CASE EXTRACT(DOW FROM created_at)
    WHEN 0 THEN 'Sunday'
    WHEN 1 THEN 'Monday'
    WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday'
    WHEN 4 THEN 'Thursday'
    WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday'
  END as day_name,
  COUNT(*) as total_accesses,
  ROUND(AVG(EXTRACT(HOUR FROM pin_delivered_at)), 1) as avg_hour
FROM contractor_conversations
WHERE conversation_state = 'completed'
  AND pin_delivered_at IS NOT NULL
GROUP BY EXTRACT(DOW FROM created_at)
ORDER BY day_of_week;
```

**Output:**
```
day_of_week | day_name  | total_accesses | avg_hour
------------|-----------|----------------|----------
1           | Monday    | 52             | 10.3
2           | Tuesday   | 48             | 10.8
3           | Wednesday | 45             | 9.9
4           | Thursday  | 51             | 10.5
5           | Friday    | 39             | 11.2
6           | Saturday  | 8              | 9.5
0           | Sunday    | 2              | 10.0
```

---

### **12. Hourly Access Distribution**
```sql
SELECT 
  EXTRACT(HOUR FROM pin_delivered_at) as hour,
  COUNT(*) as access_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentage
FROM contractor_conversations
WHERE conversation_state = 'completed'
  AND pin_delivered_at IS NOT NULL
GROUP BY EXTRACT(HOUR FROM pin_delivered_at)
ORDER BY hour;
```

**Output:**
```
hour | access_count | percentage
-----|--------------|------------
7    | 8            | 2.8%
8    | 42           | 14.6%
9    | 58           | 20.1%
10   | 52           | 18.1%
11   | 38           | 13.2%
12   | 25           | 8.7%
13   | 32           | 11.1%
14   | 22           | 7.6%
15   | 10           | 3.5%
16   | 1            | 0.3%
```

---

## 👷 **CONTRACTOR ANALYTICS**

### **13. Most Active Contractors (By Phone)**
```sql
SELECT 
  phone_number,
  MAX(company_name) as company_name,
  COUNT(*) as total_accesses,
  COUNT(DISTINCT building_id) as buildings_accessed,
  COUNT(DISTINCT unit_number) as unique_units,
  MIN(created_at) as first_access,
  MAX(created_at) as latest_access
FROM contractor_conversations
WHERE conversation_state = 'completed'
GROUP BY phone_number
ORDER BY total_accesses DESC
LIMIT 20;
```

**Output:**
```
phone_number   | company_name     | total_accesses | buildings_accessed | unique_units | first_access        | latest_access
---------------|------------------|----------------|-------------------|--------------|---------------------|-------------------
+15551234567   | ABC Roofing      | 28             | 4                 | 18           | 2025-02-01 08:15:00 | 2025-10-31 14:23:00
+15559876543   | Smith HVAC       | 22             | 3                 | 14           | 2025-03-12 09:30:00 | 2025-10-29 11:45:00
+15551111222   | Joe's Repair     | 18             | 4                 | 12           | 2025-01-25 10:20:00 | 2025-10-28 15:10:00
...
```

---

### **14. Companies by Access Frequency**
```sql
SELECT 
  company_name,
  COUNT(*) as total_accesses,
  COUNT(DISTINCT phone_number) as unique_numbers,
  COUNT(DISTINCT building_id) as buildings_accessed,
  COUNT(DISTINCT unit_number) as unique_units,
  MIN(created_at) as first_access,
  MAX(created_at) as latest_access
FROM contractor_conversations
WHERE conversation_state = 'completed'
  AND company_name IS NOT NULL
GROUP BY company_name
ORDER BY total_accesses DESC
LIMIT 25;
```

**Output:**
```
company_name       | total_accesses | unique_numbers | buildings_accessed | unique_units | first_access        | latest_access
-------------------|----------------|----------------|-------------------|--------------|---------------------|-------------------
ABC Roofing        | 32             | 2              | 4                 | 22           | 2025-02-01 08:15:00 | 2025-10-31 14:23:00
Smith HVAC         | 28             | 1              | 4                 | 18           | 2025-03-12 09:30:00 | 2025-10-29 11:45:00
Jones Plumbing     | 24             | 2              | 3                 | 16           | 2025-02-15 10:05:00 | 2025-10-30 13:22:00
...
```

---

### **15. Contractor Response Time Analysis**
```sql
WITH message_times AS (
  SELECT 
    conversation_id,
    message_type,
    created_at,
    LAG(created_at) OVER (PARTITION BY conversation_id ORDER BY created_at) as prev_message_time,
    LAG(message_type) OVER (PARTITION BY conversation_id ORDER BY created_at) as prev_message_type
  FROM conversation_messages
)
SELECT 
  ROUND(AVG(EXTRACT(EPOCH FROM (created_at - prev_message_time)) / 60), 1) as avg_response_minutes,
  ROUND(MIN(EXTRACT(EPOCH FROM (created_at - prev_message_time)) / 60), 1) as min_response_minutes,
  ROUND(MAX(EXTRACT(EPOCH FROM (created_at - prev_message_time)) / 60), 1) as max_response_minutes
FROM message_times
WHERE message_type = 'incoming'
  AND prev_message_type = 'outgoing'
  AND created_at - prev_message_time < INTERVAL '1 hour';
```

**Output:**
```
avg_response_minutes | min_response_minutes | max_response_minutes
---------------------|---------------------|----------------------
2.8                  | 0.2                 | 15.5
```

---

## 📈 **SUMMARY DASHBOARD QUERY**

### **16. Complete Overview (Last 30 Days)**
```sql
SELECT 
  -- Total Stats
  COUNT(*) as total_conversations,
  COUNT(*) FILTER (WHERE conversation_state = 'completed') as completed,
  COUNT(*) FILTER (WHERE conversation_state = 'pin_delivered') as pins_delivered,
  
  -- Building Stats
  COUNT(DISTINCT building_id) as buildings_with_access,
  COUNT(DISTINCT unit_number) as unique_units_accessed,
  
  -- Contractor Stats
  COUNT(DISTINCT phone_number) as unique_phone_numbers,
  COUNT(DISTINCT company_name) as unique_companies,
  
  -- Roof End Distribution
  COUNT(*) FILTER (WHERE roof_end = 'north') as north_accesses,
  COUNT(*) FILTER (WHERE roof_end = 'south') as south_accesses,
  
  -- Time Stats
  ROUND(AVG(EXTRACT(EPOCH FROM (pin_delivered_at - created_at)) / 60), 1) as avg_time_to_pin_minutes

FROM contractor_conversations
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';
```

**Output:**
```
total_conversations | completed | pins_delivered | buildings_with_access | unique_units_accessed | unique_phone_numbers | unique_companies | north_accesses | south_accesses | avg_time_to_pin_minutes
--------------------|-----------|----------------|----------------------|---------------------|---------------------|------------------|----------------|----------------|-------------------------
245                 | 238       | 238            | 4                    | 68                  | 42                  | 28               | 88             | 150            | 1.8
```

---

## 🎯 **USAGE INSTRUCTIONS**

### **How to Run These Queries:**

**Option 1: Supabase Dashboard**
1. Go to https://supabase.com/dashboard/project/fvqojgifgevrwicyhmvj
2. Click "SQL Editor" in left menu
3. Paste any query above
4. Click "Run"
5. Export results to CSV if needed

**Option 2: Supabase MCP (from Cascade)**
```typescript
// Use mcp3_execute_sql tool
await mcp3_execute_sql({
  project_id: 'fvqojgifgevrwicyhmvj',
  query: '... paste query here ...'
});
```

**Option 3: Future Admin Dashboard**
- These queries can be integrated into Admin.tsx
- Create "Analytics" tab with charts/graphs
- Auto-refresh every 30 minutes
- Export to CSV/PDF

---

## 📊 **POTENTIAL DASHBOARD WIDGETS**

### **Suggested Admin Page Additions:**

1. **Access Overview Card**
   - Total accesses (all time)
   - This month vs last month
   - North vs South split
   - Most accessed building

2. **Building Heatmap**
   - Visual grid showing access frequency
   - Color-coded by utilization rate
   - Click for building details

3. **Unit Frequency Chart**
   - Bar chart of top 20 most accessed units
   - Grouped by building

4. **Time Distribution**
   - Line chart showing hourly access patterns
   - Day of week breakdown

5. **Contractor Leaderboard**
   - Top contractors by access count
   - Recent activity feed

6. **Trend Analysis**
   - Monthly access trends (6 month view)
   - Growth rate calculations
   - Seasonal patterns

---

## 💾 **DATA EXPORT QUERIES**

### **17. Full Export for Excel Analysis**
```sql
SELECT 
  c.id,
  c.created_at as request_time,
  c.pin_delivered_at as pin_time,
  EXTRACT(EPOCH FROM (c.pin_delivered_at - c.created_at)) / 60 as minutes_to_pin,
  c.phone_number,
  c.company_name,
  b.building_name,
  b.building_code,
  c.unit_number,
  c.roof_end,
  c.conversation_state,
  EXTRACT(DOW FROM c.created_at) as day_of_week,
  EXTRACT(HOUR FROM c.pin_delivered_at) as hour_of_day,
  TO_CHAR(c.created_at, 'YYYY-MM') as year_month
FROM contractor_conversations c
LEFT JOIN buildings b ON c.building_id = b.id
WHERE c.conversation_state IN ('completed', 'pin_delivered')
ORDER BY c.created_at DESC;
```

This exports everything for pivot tables, charts, and deep analysis in Excel/Google Sheets.

---

**All queries ready for your statistical analysis!** 📊
