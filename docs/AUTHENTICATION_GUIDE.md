# JusMonitor - Authentication Guide

## 🔐 Overview

JusMonitor uses **Supabase Authentication** with a complete authentication system including email/password, OAuth, magic links, password recovery, and email verification.

## 📋 Table of Contents

1. [Authentication Flow](#authentication-flow)
2. [Components](#components)
3. [Hooks & Context](#hooks--context)
4. [Protected Routes](#protected-routes)
5. [User Roles](#user-roles)
6. [Password Recovery](#password-recovery)
7. [Email Verification](#email-verification)
8. [Session Management](#session-management)
9. [Security](#security)
10. [Testing](#testing)

## 🔄 Authentication Flow

### Sign Up Flow
```
1. User visits /auth
2. Selects user type (User or Lawyer)
3. Fills registration form
4. Account created in Supabase Auth
5. Profile created in profiles table
6. Credits plan initialized
7. Email verification sent (optional)
8. Redirected to /dashboard/consultas
```

### Login Flow
```
1. User visits /auth
2. Enters email and password
3. Supabase validates credentials
4. Session created and stored in localStorage
5. User profile loaded from database
6. Redirected to /dashboard/consultas
```

### Password Recovery Flow
```
1. User clicks "Esqueceu a senha?"
2. Enters email in dialog
3. Recovery email sent with secure token
4. User clicks link in email
5. Redirected to /reset-password with token
6. Enters new password
7. Password updated in Supabase
8. Redirected to /auth to login
```

### OAuth Flow (Google)
```
1. User clicks "Continuar com Google"
2. Redirected to Google OAuth
3. User authorizes application
4. Redirected back with auth token
5. Profile auto-created if new user
6. Redirected to /dashboard/consultas
```

## 🧩 Components

### Auth Page (`/auth`)
Main authentication page with tabs for email and OAuth login.

**Features:**
- Email/password login and signup
- User type selection (User/Lawyer)
- Google OAuth button
- Magic link authentication
- Password recovery dialog
- Form validation
- Loading states
- Error handling

**Usage:**
```typescript
// Automatically rendered at /auth route
// No props needed
```

### PasswordRecovery Component
Dialog component for requesting password reset.

**Features:**
- Email input with validation
- Loading state
- Success/error toasts
- Integrated into Auth page

**Usage:**
```typescript
import { PasswordRecovery } from '@/components/auth/PasswordRecovery'

<PasswordRecovery />
```

### ResetPassword Component
Full page for setting new password after recovery.

**Features:**
- Password strength validation
- Confirm password matching
- Show/hide password toggle
- Token validation
- Auto-redirect after success

**Usage:**
```typescript
// Automatically rendered at /reset-password route
// Requires access_token and type=recovery in URL
```

### EmailVerification Component
Handles email verification tokens.

**Features:**
- Automatic token verification
- Loading state
- Success/error states
- Auto-redirect to dashboard
- Retry functionality

**Usage:**
```typescript
// Automatically rendered at /verify-email route
// Requires token and type=signup in URL
```

### LogoutButton Component
Reusable logout button with optional confirmation.

**Props:**
```typescript
interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  showIcon?: boolean
  showConfirmDialog?: boolean
}
```

**Usage:**
```typescript
import { LogoutButton } from '@/components/auth/LogoutButton'

// Simple logout
<LogoutButton />

// Customized
<LogoutButton
  variant="destructive"
  size="lg"
  showIcon={true}
  showConfirmDialog={true}
/>

// Without confirmation
<LogoutButton showConfirmDialog={false} />

// In dropdown menu
<DropdownMenuItem asChild>
  <LogoutButton
    variant="ghost"
    size="sm"
    className="w-full justify-start"
    showConfirmDialog={false}
  />
</DropdownMenuItem>
```

## 🪝 Hooks & Context

### useAuth Hook
Main hook for accessing authentication state.

**Returns:**
```typescript
{
  user: User | null              // Supabase user object
  session: Session | null        // Current session
  profile: Profile | null        // User profile from database
  loading: boolean               // Loading state
  isAuthenticated: boolean       // Is user logged in
  isAdmin: boolean              // Is user admin
  isLawyer: boolean             // Is user lawyer
  isUser: boolean               // Is user regular user
  signOut: () => Promise<void>  // Logout function
}
```

**Usage:**
```typescript
import { useAuth } from '@/contexts/AuthContext'

function MyComponent() {
  const { user, profile, isAuthenticated, isAdmin, signOut } = useAuth()

  if (!isAuthenticated) {
    return <div>Please login</div>
  }

  return (
    <div>
      <p>Welcome, {profile?.full_name}!</p>
      <p>Email: {user?.email}</p>
      <p>Role: {profile?.user_type}</p>
      {isAdmin && <p>You are an admin!</p>}
      <button onClick={signOut}>Logout</button>
    </div>
  )
}
```

### AuthContext Provider
Wraps the entire app to provide auth state.

**Already configured in:**
```typescript
// src/main.tsx
<AuthProvider>
  <App />
</AuthProvider>
```

## 🛡️ Protected Routes

### ProtectedRoute Component
Wraps routes that require authentication.

**Features:**
- Checks authentication state
- Shows loading spinner while checking
- Redirects to /auth if not authenticated
- Allows access if authenticated

**Usage:**
```typescript
import { ProtectedRoute } from '@/components/ProtectedRoute'

<Route path="/dashboard" element={
  <ProtectedRoute>
    <DashboardLayout />
  </ProtectedRoute>
} />
```

### AdminRoute Component
Wraps routes that require admin access.

**Features:**
- Checks if user is admin
- Shows loading spinner while checking
- Redirects to /dashboard/consultas if not admin
- Allows access if admin

**Usage:**
```typescript
import { AdminRoute } from '@/components/AdminRoute'

<Route path="/admin" element={
  <ProtectedRoute>
    <AdminRoute>
      <AdminPanel />
    </AdminRoute>
  </ProtectedRoute>
} />
```

## 👥 User Roles

### Available Roles
```typescript
type UserType = 'user' | 'lawyer' | 'admin'
```

### Role Permissions

**User (`user`):**
- Basic access to platform
- Can search processes
- Can monitor processes
- Limited features

**Lawyer (`lawyer`):**
- All user permissions
- OAB number required
- Professional features
- Enhanced monitoring

**Admin (`admin`):**
- All permissions
- Access to admin panel
- User management
- System configuration
- API management
- Logs and analytics

### Checking Roles
```typescript
const { isAdmin, isLawyer, isUser, profile } = useAuth()

if (isAdmin) {
  // Show admin features
}

if (isLawyer) {
  // Show lawyer features
}

// Or check directly
if (profile?.user_type === 'admin') {
  // Admin-specific code
}
```

## 🔑 Password Recovery

### Implementation
Password recovery is implemented using Supabase's built-in password reset flow.

### Flow Details
1. User clicks "Esqueceu a senha?" on login page
2. Dialog opens with email input
3. User enters email and submits
4. Supabase sends recovery email with secure token
5. Email contains link to `/reset-password?access_token=xxx&type=recovery`
6. User clicks link and is redirected to reset password page
7. User enters new password (with confirmation)
8. Password is updated in Supabase
9. User is redirected to login page

### Email Configuration
Recovery emails are sent by Supabase. Configure templates in:
```
Supabase Console → Authentication → Email Templates → Reset Password
```

### Security
- Tokens expire after 1 hour
- Tokens are single-use
- Passwords must be at least 6 characters
- Passwords are hashed with bcrypt

## ✉️ Email Verification

### Implementation
Email verification is optional but recommended for production.

### Flow Details
1. User signs up with email/password
2. Supabase sends verification email
3. Email contains link to `/verify-email?token=xxx&type=signup`
4. User clicks link
5. Token is verified automatically
6. User is redirected to dashboard
7. Account is marked as verified

### Configuration
Enable email verification in:
```
Supabase Console → Authentication → Settings → Email Auth
→ Enable email confirmations
```

### Handling Unverified Users
```typescript
const { user } = useAuth()

if (user && !user.email_confirmed_at) {
  // Show verification reminder
  return <div>Please verify your email</div>
}
```

## 🔐 Session Management

### Session Storage
Sessions are stored in `localStorage` by default.

**Configuration:**
```typescript
// src/integrations/supabase/client.ts
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
})
```

### Session Lifecycle
- **Creation:** When user logs in
- **Storage:** Saved to localStorage
- **Refresh:** Automatically refreshed before expiry
- **Expiry:** Default 1 hour (refreshed automatically)
- **Destruction:** When user logs out

### Session Monitoring
```typescript
// AuthContext automatically monitors session changes
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (event === 'SIGNED_IN') {
        // User signed in
      } else if (event === 'SIGNED_OUT') {
        // User signed out
      } else if (event === 'TOKEN_REFRESHED') {
        // Token was refreshed
      }
    }
  )

  return () => subscription.unsubscribe()
}, [])
```

## 🔒 Security

### Best Practices Implemented

1. **Password Security:**
   - Minimum 6 characters required
   - Hashed with bcrypt
   - Never stored in plain text
   - Password strength hints provided

2. **Session Security:**
   - JWT tokens with automatic refresh
   - Secure HTTP-only cookies (server-side)
   - Token expiration handling
   - Automatic logout on token expiry

3. **Row Level Security (RLS):**
   - All tables have RLS enabled
   - Users can only access their own data
   - Admin users have elevated permissions
   - Policies enforced at database level

4. **Email Verification:**
   - Prevents fake account creation
   - Secure verification tokens
   - Single-use tokens
   - Time-limited tokens

5. **OAuth Security:**
   - Secure redirect URLs
   - State parameter validation
   - PKCE flow for mobile apps
   - Token exchange on server

6. **CORS Protection:**
   - Configured in Supabase
   - Only allowed origins can access API
   - Prevents unauthorized access

### Security Checklist

- ✅ Passwords hashed with bcrypt
- ✅ JWT tokens with expiration
- ✅ Automatic token refresh
- ✅ Row Level Security enabled
- ✅ Email verification available
- ✅ OAuth with secure redirects
- ✅ CORS protection
- ✅ HTTPS only in production
- ✅ Secure session storage
- ✅ Input validation
- ✅ Error handling without leaking info

## 🧪 Testing

### Manual Testing Checklist

#### Sign Up
- [ ] Sign up with valid email/password
- [ ] Sign up with invalid email (should fail)
- [ ] Sign up with weak password (should fail)
- [ ] Sign up with existing email (should fail)
- [ ] Sign up as User type
- [ ] Sign up as Lawyer type (with OAB)
- [ ] Verify email verification sent
- [ ] Verify profile created in database
- [ ] Verify credits plan initialized

#### Login
- [ ] Login with valid credentials
- [ ] Login with invalid email (should fail)
- [ ] Login with wrong password (should fail)
- [ ] Login with unverified email (optional check)
- [ ] Verify redirect to dashboard
- [ ] Verify session persists on page reload
- [ ] Verify user data loaded correctly

#### Google OAuth
- [ ] Click "Continuar com Google"
- [ ] Authorize in Google
- [ ] Verify redirect back to app
- [ ] Verify profile created for new user
- [ ] Verify login for existing user
- [ ] Verify session persists

#### Magic Links
- [ ] Request magic link with valid email
- [ ] Check email received
- [ ] Click link in email
- [ ] Verify automatic login
- [ ] Verify redirect to dashboard

#### Password Recovery
- [ ] Click "Esqueceu a senha?"
- [ ] Enter valid email
- [ ] Check recovery email received
- [ ] Click link in email
- [ ] Verify redirect to reset page
- [ ] Enter new password
- [ ] Verify password updated
- [ ] Login with new password

#### Email Verification
- [ ] Sign up new account
- [ ] Check verification email
- [ ] Click verification link
- [ ] Verify account activated
- [ ] Verify redirect to dashboard

#### Logout
- [ ] Click logout button
- [ ] Verify confirmation dialog (if enabled)
- [ ] Confirm logout
- [ ] Verify redirect to /auth
- [ ] Verify session cleared
- [ ] Verify cannot access protected routes

#### Protected Routes
- [ ] Try accessing /dashboard without login
- [ ] Verify redirect to /auth
- [ ] Login and access /dashboard
- [ ] Verify access granted
- [ ] Try accessing /admin as non-admin
- [ ] Verify redirect to /dashboard/consultas

#### Session Persistence
- [ ] Login to account
- [ ] Refresh page
- [ ] Verify still logged in
- [ ] Close and reopen browser
- [ ] Verify still logged in
- [ ] Wait for token expiry
- [ ] Verify automatic refresh

### Automated Testing

```typescript
// Example test with Vitest
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Auth from '@/pages/Auth'

describe('Authentication', () => {
  it('should show login form by default', () => {
    render(<Auth />)
    expect(screen.getByText('Entrar')).toBeInTheDocument()
  })

  it('should switch to signup form', async () => {
    render(<Auth />)
    const user = userEvent.setup()
    
    await user.click(screen.getByText('Cadastre-se'))
    
    expect(screen.getByText('Criar Conta')).toBeInTheDocument()
  })

  it('should validate email format', async () => {
    render(<Auth />)
    const user = userEvent.setup()
    
    const emailInput = screen.getByPlaceholderText('seu@email.com')
    await user.type(emailInput, 'invalid-email')
    
    // Should show validation error
  })
})
```

## 🆘 Troubleshooting

### Common Issues

**"Invalid login credentials"**
- ✅ Check email is correct
- ✅ Check password is correct
- ✅ Verify account exists
- ✅ Check if email is verified (if required)

**"Email not confirmed"**
- ✅ Check spam folder for verification email
- ✅ Request new verification email
- ✅ Check email settings in Supabase Console

**Session not persisting**
- ✅ Check browser localStorage is enabled
- ✅ Verify Supabase URL and keys are correct
- ✅ Clear browser cache and try again
- ✅ Check for JavaScript errors in console

**OAuth not working**
- ✅ Verify OAuth provider is enabled in Supabase
- ✅ Check redirect URLs are configured correctly
- ✅ Ensure API keys are correct
- ✅ Check for CORS errors

**Password reset not working**
- ✅ Check email is correct
- ✅ Check spam folder
- ✅ Verify email templates are configured
- ✅ Check token hasn't expired (1 hour limit)

**Cannot access admin routes**
- ✅ Verify user_type is 'admin' in profiles table
- ✅ Check AdminRoute component is working
- ✅ Verify RLS policies allow admin access

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [React Context API](https://react.dev/reference/react/useContext)
- [JWT Tokens](https://jwt.io/introduction)
- [OAuth 2.0](https://oauth.net/2/)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**Last Updated:** 2025-01-02  
**Version:** 3.0  
**Maintainer:** JusMonitor Team