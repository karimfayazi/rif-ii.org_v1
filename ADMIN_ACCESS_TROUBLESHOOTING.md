# Admin Access Troubleshooting Guide

## Issue: "Add Pictures" button not showing or access denied

### Step 1: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for log messages showing:
   - `Pictures Page - Access Status:`
   - `Add Pictures Page - Access Status:`
4. Check what values you see for:
   - `isAdmin`: Should be `true`
   - `accessLevel`: Should be `'Admin'`
   - `userId`: Should be your username or email

### Step 2: Verify Database Access
Run this SQL query to check your user's access level:

```sql
SELECT 
    [username],
    [email],
    [access_level]
FROM [_rifiiorg_db].[dbo].[tbl_user_access]
WHERE [username] = 'YOUR_USERNAME' OR [email] = 'YOUR_EMAIL';
```

**Important:** The `access_level` must be exactly `'Admin'` (case-sensitive, capital A).

### Step 3: Update User Access (if needed)
If your user doesn't have Admin access, update it:

```sql
UPDATE [_rifiiorg_db].[dbo].[tbl_user_access]
SET [access_level] = 'Admin'
WHERE [username] = 'YOUR_USERNAME' OR [email] = 'YOUR_EMAIL';
```

### Step 4: Check API Response
Test the access API directly:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Refresh the page
4. Look for request to `/api/auth/access?userId=...`
5. Check the response - it should show:
   ```json
   {
     "success": true,
     "accessLevel": "Admin",
     "isAdmin": true
   }
   ```

### Step 5: Verify User ID
The system looks for your user ID in this order:
1. `user.id` from useAuth hook
2. `user.username` from useAuth hook
3. `getUserId()` from cookie
4. Falls back to "1" if none found

Check what user ID is being used in the console logs.

### Common Issues:

1. **User ID mismatch**: The userId being checked doesn't match your database username/email
   - Solution: Ensure your login sets the correct user ID in the cookie

2. **Access level not exactly "Admin"**: Database has "admin" (lowercase) or "ADMIN" (uppercase)
   - Solution: Update to exactly "Admin" (capital A, rest lowercase)

3. **User not found in database**: Your user doesn't exist in `tbl_user_access` table
   - Solution: Add your user to the table with `access_level = 'Admin'`

4. **Cookie/auth not set**: The user ID isn't being retrieved from authentication
   - Solution: Check your login process sets the auth cookie correctly

### Debug Mode
The pages now show debug information when access is denied. Look for the yellow box showing:
- User ID
- Access Level
- Is Admin status
- Any errors

This will help identify the exact issue.

