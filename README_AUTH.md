# JusMonitor - Authentication Setup

## 🔐 Authentication Features

This project uses **Supabase Authentication** with the following features:

### ✅ Implemented Features

1. **Email/Password Authentication**
   - Sign up with email and password
   - Login with email and password
   - Email verification flow
   - Password strength validation

2. **OAuth Providers**
   - Google Sign-In
   - Automatic profile creation

3. **Magic Links**
   - Passwordless authentication via email
   - One-time password (OTP) flow

4. **Password Recovery**
   - Forgot password flow
   - Secure password reset via email
   - Password update functionality

5. **Session Management**
   - Persistent sessions across page reloads
   - Automatic token refresh
   - Secure session storage

6. **Protected Routes**
   - Route protection for authenticated users
   - Admin-only route protection
   - Automatic redirects

7. **User Profile**
   - Profile page with user data
   - Avatar support
   - Role-based access (user, lawyer, admin)

## 📁 File Structure

```
src/
├── components/
│   └── auth/
│       ├── PasswordRecovery.tsx    # Password recovery dialog
│       ├── ResetPassword.tsx       # Password reset page
│       ├── EmailVerification.tsx   # Email verification handler
│       ├── LogoutButton.tsx        # Logout button component
│       └── index.ts                # Barrel export
├── contexts/
│   └── AuthContext.tsx             # Auth state management
├── integrations/
│   └── supabase/
│       ├── client.ts               # Supabase client config
│       └── types.ts                # Database types
├── pages/
│   ├── Auth.tsx                    # Login/Signup page
│   └── dashboard/
│       ├── ProfilePage.tsx         # User profile page
│       └── SettingsPage.tsx        # User settings
└── shared/
    └── services/
        └── authService.ts          # Auth service layer
```

## 🚀 Usage

### 1. Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://blopdveolbwqajzklnzu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
```

### 2. Using Auth in Components

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
      <button onClick={signOut}>Logout</button>
    </div>
  )
}
```

### 3. Protecting Routes

```typescript
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminRoute } from '@/components/AdminRoute'

// Protected route (requires authentication)
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />

// Admin-only route
<Route path="/admin" element={
  <ProtectedRoute>
    <AdminRoute>
      <AdminPanel />
    </AdminRoute>
  </ProtectedRoute>
} />
```

### 4. Using Auth Service

```typescript
import { AuthService } from '@/shared/services/authService'

// Sign up
await AuthService.signUp({
  email: 'user@example.com',
  password: 'password123',
  fullName: 'John Doe',
  cpfCnpj: '12345678900',
  userType: 'user'
})

// Sign in
await AuthService.signIn({
  email: 'user@example.com',
  password: 'password123'
})

// Password recovery
await AuthService.resetPassword('user@example.com')

// Update password
await AuthService.updatePassword('newPassword123')

// Sign out
await AuthService.signOut()
```

### 5. Using Logout Button

```typescript
import { LogoutButton } from '@/components/auth/LogoutButton'

// Simple logout button
<LogoutButton />

// Customized logout button
<LogoutButton
  variant="destructive"
  size="lg"
  showIcon={true}
  showConfirmDialog={true}
/>

// Without confirmation dialog
<LogoutButton showConfirmDialog={false} />
```

## 🔒 Security Features

1. **Row Level Security (RLS)**
   - All database tables have RLS enabled
   - Users can only access their own data
   - Admin users have elevated permissions

2. **Secure Password Storage**
   - Passwords are hashed using bcrypt
   - Never stored in plain text
   - Minimum 6 characters required

3. **Session Security**
   - JWT tokens with automatic refresh
   - Secure HTTP-only cookies
   - Token expiration handling

4. **Email Verification**
   - Required for new accounts
   - Prevents fake account creation
   - Secure verification tokens

## 📱 User Flows

### Sign Up Flow
1. User fills registration form
2. Account created in Supabase Auth
3. Profile created in `profiles` table
4. Credits plan initialized
5. Verification email sent
6. User verifies email
7. Redirected to dashboard

### Login Flow
1. User enters credentials
2. Supabase validates credentials
3. Session created and stored
4. User profile loaded
5. Redirected to dashboard

### Password Recovery Flow
1. User clicks "Forgot Password"
2. Enters email address
3. Recovery email sent
4. User clicks link in email
5. Redirected to reset password page
6. Enters new password
7. Password updated
8. Redirected to login

### Logout Flow
1. User clicks logout button
2. Confirmation dialog shown (optional)
3. Session cleared from storage
4. User redirected to login page

## 🎨 UI Components

All auth components use **shadcn/ui** for consistent styling:
- Forms with validation
- Loading states
- Error messages
- Success notifications
- Responsive design

## 🧪 Testing

To test authentication:

1. **Sign Up**: Go to `/auth` and create an account
2. **Login**: Use your credentials to log in
3. **Password Recovery**: Click "Forgot Password" and follow the flow
4. **Logout**: Click your avatar and select "Logout"
5. **Protected Routes**: Try accessing `/dashboard` without logging in

## 📝 Notes

- Email verification is required for production
- Google OAuth requires configuration in Supabase Console
- Magic links expire after 1 hour
- Sessions are automatically refreshed
- All auth state is managed via React Context

## 🆘 Troubleshooting

### "Invalid login credentials"
- Check if email is verified
- Verify password is correct
- Check if account exists

### "Email not confirmed"
- Check spam folder for verification email
- Request new verification email
- Contact support if issue persists

### Session not persisting
- Check browser localStorage
- Verify Supabase URL and keys
- Clear browser cache and try again

### OAuth not working
- Verify OAuth provider is enabled in Supabase
- Check redirect URLs are configured
- Ensure API keys are correct

## 🔗 Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [React Context API](https://react.dev/reference/react/useContext)
- [shadcn/ui Components](https://ui.shadcn.com/)