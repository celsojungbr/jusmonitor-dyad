# Quick Start - Authentication

## 🚀 5-Minute Setup

### 1. Environment Variables
Create `.env` file:
```env
VITE_SUPABASE_URL=https://blopdveolbwqajzklnzu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
```

### 2. Test Authentication
```bash
npm run dev
```

Visit `http://localhost:8080/auth` and:
1. Create an account
2. Login
3. Access dashboard

## 📝 Common Use Cases

### Check if User is Logged In
```typescript
import { useAuth } from '@/contexts/AuthContext'

function MyComponent() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!isAuthenticated) return <div>Please login</div>

  return <div>Welcome!</div>
}
```

### Get User Information
```typescript
const { user, profile } = useAuth()

console.log(user?.email)           // Email from Supabase Auth
console.log(profile?.full_name)    // Name from profiles table
console.log(profile?.user_type)    // 'user' | 'lawyer' | 'admin'
```

### Check User Role
```typescript
const { isAdmin, isLawyer, isUser } = useAuth()

if (isAdmin) {
  // Show admin features
}
```

### Protect a Route
```typescript
import { ProtectedRoute } from '@/components/ProtectedRoute'

<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

### Add Logout Button
```typescript
import { LogoutButton } from '@/components/auth/LogoutButton'

// Simple
<LogoutButton />

// Customized
<LogoutButton 
  variant="destructive" 
  showConfirmDialog={true} 
/>
```

### Manual Login/Signup
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

// Sign out
await AuthService.signOut()
```

## 🔧 Customization

### Change Redirect After Login
```typescript
// In src/pages/Auth.tsx
navigate("/your-custom-route")
```

### Add Custom User Fields
1. Add column to `profiles` table in Supabase
2. Update `Profile` type in `src/shared/types/database.types.ts`
3. Update signup form in `src/pages/Auth.tsx`

### Customize Email Templates
Go to: `Supabase Console → Authentication → Email Templates`

## 🐛 Troubleshooting

**Can't login?**
- Check `.env` file has correct Supabase URL and key
- Verify email/password are correct
- Check browser console for errors

**Session not persisting?**
- Check localStorage is enabled in browser
- Clear browser cache and try again

**OAuth not working?**
- Enable provider in Supabase Console
- Configure redirect URLs

## 📚 Full Documentation
See `docs/AUTHENTICATION_GUIDE.md` for complete details.

## 🆘 Need Help?
- Check `README_AUTH.md` for overview
- Review `AI_RULES.md` for development guidelines
- See example components in `src/components/auth/`