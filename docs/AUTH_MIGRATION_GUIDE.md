# Authentication Migration Guide

## 🔄 Upgrading to New Auth System

If you're upgrading from an older version or implementing authentication for the first time, follow this guide.

## ✅ What's New

### New Components
- `<PasswordRecovery />` - Password reset dialog
- `<ResetPassword />` - Password reset page
- `<EmailVerification />` - Email verification handler
- `<LogoutButton />` - Reusable logout component

### New Routes
- `/reset-password` - Password reset page
- `/verify-email` - Email verification page

### New Hooks
- `useNotificationPreferences()` - Manage user notification settings

### Enhanced Features
- Password recovery flow
- Email verification handling
- Logout with confirmation dialog
- Better error handling
- Improved loading states

## 📦 Installation

### 1. Install Dependencies
```bash
npm install @supabase/auth-ui-react @supabase/auth-ui-shared
```

### 2. Update Routes
Add new routes to `src/App.tsx`:

```typescript
import { ResetPassword } from "@/components/auth/ResetPassword"
import { EmailVerification } from "@/components/auth/EmailVerification"

// Add these routes
<Route path="/reset-password" element={<ResetPassword />} />
<Route path="/verify-email" element={<EmailVerification />} />
```

### 3. Update Auth Page
Replace the "Forgot Password" button in `src/pages/Auth.tsx`:

```typescript
import { PasswordRecovery } from "@/components/auth/PasswordRecovery"

// Replace old button with:
<PasswordRecovery />
```

### 4. Update Logout Implementation
Replace manual logout with `LogoutButton`:

**Before:**
```typescript
const handleLogout = async () => {
  await signOut()
  navigate("/auth")
}

<button onClick={handleLogout}>Logout</button>
```

**After:**
```typescript
import { LogoutButton } from "@/components/auth/LogoutButton"

<LogoutButton />
```

### 5. Add Notification Preferences (Optional)
If you want notification settings in your app:

```typescript
import { useNotificationPreferences } from "@/shared/hooks/useNotificationPreferences"

function SettingsPage() {
  const { preferences, updatePreference } = useNotificationPreferences()
  
  return (
    <Switch
      checked={preferences?.email_notifications}
      onCheckedChange={(checked) => 
        updatePreference('email_notifications', checked)
      }
    />
  )
}
```

## 🔧 Configuration

### Supabase Email Templates

Configure email templates in Supabase Console:

**Password Recovery:**
```
Subject: Reset your password
Body: Click here to reset your password: {{ .ConfirmationURL }}
```

**Email Verification:**
```
Subject: Verify your email
Body: Click here to verify your email: {{ .ConfirmationURL }}
```

### Redirect URLs

Add these URLs to Supabase Console → Authentication → URL Configuration:

```
http://localhost:8080/reset-password
http://localhost:8080/verify-email
https://yourdomain.com/reset-password
https://yourdomain.com/verify-email
```

## 🔄 Breaking Changes

### None!
This update is fully backward compatible. Existing authentication will continue to work.

### Optional Improvements

**1. Replace manual logout:**
```typescript
// Old way (still works)
const { signOut } = useAuth()
await signOut()

// New way (recommended)
import { LogoutButton } from "@/components/auth/LogoutButton"
<LogoutButton />
```

**2. Add password recovery:**
```typescript
// Old way (placeholder)
<Button onClick={() => alert("Coming soon")}>
  Forgot Password?
</Button>

// New way
import { PasswordRecovery } from "@/components/auth/PasswordRecovery"
<PasswordRecovery />
```

## 📝 Migration Checklist

- [ ] Install new dependencies
- [ ] Add new routes to App.tsx
- [ ] Update Auth page with PasswordRecovery
- [ ] Replace logout buttons with LogoutButton
- [ ] Configure email templates in Supabase
- [ ] Add redirect URLs in Supabase
- [ ] Test password recovery flow
- [ ] Test email verification flow
- [ ] Test logout with confirmation
- [ ] Update documentation

## 🧪 Testing After Migration

### 1. Password Recovery
- [ ] Click "Forgot Password" on login page
- [ ] Enter email and submit
- [ ] Check email received
- [ ] Click link in email
- [ ] Reset password successfully
- [ ] Login with new password

### 2. Email Verification
- [ ] Sign up new account
- [ ] Check verification email
- [ ] Click verification link
- [ ] Verify redirect to dashboard
- [ ] Confirm account is verified

### 3. Logout
- [ ] Click logout button
- [ ] Verify confirmation dialog appears
- [ ] Confirm logout
- [ ] Verify redirect to /auth
- [ ] Verify cannot access protected routes

### 4. Existing Features
- [ ] Login still works
- [ ] Signup still works
- [ ] Google OAuth still works
- [ ] Magic links still work
- [ ] Protected routes still work
- [ ] Session persistence still works

## 🆘 Troubleshooting

### "Module not found: @supabase/auth-ui-react"
```bash
npm install @supabase/auth-ui-react @supabase/auth-ui-shared
```

### "Cannot find module '@/components/auth/LogoutButton'"
Make sure you've copied all new files from the update.

### Password reset email not received
1. Check Supabase email settings
2. Verify email templates are configured
3. Check spam folder
4. Verify SMTP settings in Supabase

### Email verification not working
1. Enable email verification in Supabase Console
2. Configure verification email template
3. Add redirect URL to Supabase settings

### Logout button not showing
1. Import LogoutButton component
2. Check component is in correct location
3. Verify no TypeScript errors

## 📚 Additional Resources

- [Full Authentication Guide](./AUTHENTICATION_GUIDE.md)
- [Quick Start Guide](./QUICK_START_AUTH.md)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)

## 🎉 Benefits of Upgrading

✅ **Better UX**
- Confirmation dialogs prevent accidental logout
- Clear error messages
- Loading states for all actions

✅ **More Features**
- Password recovery
- Email verification
- Notification preferences

✅ **Better Code**
- Reusable components
- Consistent patterns
- Better error handling

✅ **Production Ready**
- Security best practices
- Comprehensive testing
- Full documentation

---

**Need Help?** Check the [Authentication Guide](./AUTHENTICATION_GUIDE.md) or [Quick Start](./QUICK_START_AUTH.md).