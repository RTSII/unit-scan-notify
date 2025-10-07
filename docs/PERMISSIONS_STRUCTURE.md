# 🔐 SPR Vice City - Permissions & Access Control Structure

**Date:** October 6, 2025  
**Status:** System Design Documentation

---

## 👥 User Roles

### 1. **Admin** (You - Rob)
- **Role:** `admin`
- **Count:** 1 (forever)
- **Access:** Full system access

### 2. **Regular Users** (Team Members)
- **Role:** `user`
- **Count:** 2-3 (Boss, Board President)
- **Access:** Create, view, and export violations

---

## 📊 Access Control Matrix

| Feature | Admin | Regular User |
|---------|-------|--------------|
| **View ALL Violations** | ✅ Yes | ✅ Yes |
| **Create Violations** | ✅ Yes | ✅ Yes |
| **View Own Violations** | ✅ Yes | ✅ Yes |
| **View Others' Violations** | ✅ Yes | ✅ Yes |
| **Export Violations** | ✅ Yes | ✅ Yes |
| **Delete Violations** | ✅ Yes | ❌ No |
| **Edit Violations** | ✅ Yes | ❌ No |
| **Admin Dashboard** | ✅ Yes | ❌ No |
| **Invite Users** | ✅ Yes | ❌ No |
| **View Statistics** | ✅ Yes | ❌ No |

---

## 📱 Page-Level Permissions

### **Index.tsx** (Dashboard)
**Access:** All authenticated users

**Features:**
- Navigation menu (Siri Orb)
- User avatar
- Sign out
- Admin button (only visible to admin role)

---

### **Books.tsx** (Violation Library)
**Access:** All authenticated users

**Behavior:**
- ✅ **Displays ALL violations from ALL users**
- ✅ Shows user attribution (who created each form)
- ✅ Search and filter work across all forms
- ✅ 3D carousel shows all team's violations
- ✅ "This Week" and "This Month" sections include all users' forms

**Important Notes:**
- **NOT filtered by user_id** - this is intentional
- All team members can see all violations
- Promotes team visibility and collaboration
- User who created each form is displayed via profile join

**Code Implementation:**
```typescript
// Books.tsx - fetchSavedForms()
const { data, error } = await supabase
  .from('violation_forms_new')
  .select(`
    *,
    profiles!violation_forms_new_user_id_fkey (
      email,
      full_name,
      role
    ),
    violation_photos (...)
  `)
  // NO .eq('user_id', user.id) filter here!
  .order('created_at', { ascending: false });
```

---

### **Capture.tsx** → **DetailsLive.tsx**
**Access:** All authenticated users

**Behavior:**
- Any user can capture violations
- Forms saved with their user_id
- Visible to all users in Books.tsx

---

### **DetailsPrevious.tsx**
**Access:** All authenticated users

**Behavior:**
- Any user can upload photos and create violations
- Forms saved with their user_id
- Visible to all users in Books.tsx

---

### **Export.tsx**
**Access:** All authenticated users

**Behavior:**
- ✅ **Shows ALL violations from ALL users**
- Any user can export any violation
- Email and print functionality available to all
- Filtered by current user: `.eq('user_id', user.id)`

**Important Note:**
- Currently filtered to show only user's own forms
- Can be changed to show all forms if desired

---

### **Admin.tsx** (Admin Dashboard)
**Access:** ⚠️ **ADMIN ONLY**

**Route Protection:**
```typescript
// Admin.tsx
if (user?.role !== 'admin') {
  return <Navigate to="/" replace />;
}
```

**Features (Admin Only):**
- ✅ View all violations with photos
- ✅ **Delete violations** (trash icon)
- ✅ **Edit violations** (select box on morphing popover)
- ✅ Team statistics
- ✅ User activity tracking
- ✅ Invite management
- ✅ User profile display

**Behavior:**
- Fetches ALL violations from ALL users
- Shows photo thumbnails
- Expandable morphing popover cards with:
  - Select box (for bulk operations)
  - Trash icon (delete individual form)
  - Full form details

---

## 🔒 Database Security (RLS Policies)

### Current Implementation

**violation_forms_new table:**
- Users can INSERT their own forms
- Users can SELECT all forms (team visibility)
- Users can UPDATE their own forms
- Only admin can DELETE forms

**violation_photos table:**
- Users can INSERT photos for their violations
- Users can SELECT all photos (team visibility)
- Only admin can DELETE photos

### Recommended RLS Policies

```sql
-- Allow all authenticated users to view all forms
CREATE POLICY "Users can view all violation forms"
ON violation_forms_new FOR SELECT
TO authenticated
USING (true);

-- Allow users to create their own forms
CREATE POLICY "Users can create their own forms"
ON violation_forms_new FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own forms
CREATE POLICY "Users can update their own forms"
ON violation_forms_new FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Only admin can delete forms
CREATE POLICY "Only admin can delete forms"
ON violation_forms_new FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

---

## 🎯 Design Philosophy

### Team Collaboration
- **Transparency:** All team members see all violations
- **Accountability:** User attribution on every form
- **Efficiency:** No need to ask "who documented this?"

### Admin Control
- **Maintenance:** Only admin can delete/edit forms
- **Quality Control:** Admin reviews all submissions
- **Data Integrity:** Prevents accidental deletions by users

### User Experience
- **Simple:** Users don't need to think about permissions
- **Intuitive:** If you can see it, you can export it
- **Consistent:** Same view for everyone (except admin features)

---

## 📋 Permission Checklist

### For Regular Users:
- [x] Can create violations (live capture)
- [x] Can create violations (gallery photos)
- [x] Can view ALL violations in Books
- [x] Can search/filter all violations
- [x] Can export violations
- [x] Cannot access Admin dashboard
- [x] Cannot delete violations
- [x] Cannot edit others' violations

### For Admin:
- [x] All regular user permissions
- [x] Can access Admin dashboard
- [x] Can delete any violation
- [x] Can edit any violation
- [x] Can view team statistics
- [x] Can manage invites
- [x] Can view user activity

---

## 🔄 Future Considerations

### If Team Grows:
- Consider adding "Team Lead" role
- May need department-based filtering
- Could add "private" flag for sensitive violations

### If Privacy Needed:
- Add `.eq('user_id', user.id)` filter to Books.tsx
- Update documentation
- Inform team of change

### If Editing Needed:
- Add edit button to Books.tsx for form creator
- Implement edit modal/page
- Add "last_edited_by" tracking

---

## 📝 Code Comments

All relevant files have been updated with comments explaining the permission structure:

**Books.tsx:**
```typescript
// IMPORTANT: Fetches ALL forms from ALL users (not filtered by user_id)
// This allows all team members to view all violation forms
```

**Admin.tsx:**
```typescript
// Admin-only page - role check enforced
// Only admin can delete/edit violations
```

---

## 🚨 Important Notes

1. **Books.tsx is NOT filtered by user** - This is intentional and correct
2. **Admin.tsx is the ONLY place to delete forms** - Protected by role check
3. **All users see all forms** - Promotes team visibility
4. **User attribution is always shown** - Via profiles join
5. **Only one admin forever** - You (Rob)

---

**Last Updated:** October 6, 2025 - 11:30 PM  
**Maintained By:** Rob (Admin)  
**Status:** Production Design
