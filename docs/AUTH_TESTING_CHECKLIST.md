# Authentication Testing Checklist

## 🧪 Complete Testing Guide

Use this checklist to verify all authentication features are working correctly.

## 📋 Pre-Testing Setup

- [ ] `.env` file configured with Supabase credentials
- [ ] Supabase project is running
- [ ] Database migrations applied
- [ ] Email templates configured in Supabase
- [ ] Redirect URLs configured in Supabase
- [ ] Development server running (`npm run dev`)

## 🔐 Authentication Tests

### Sign Up Flow

**Email/Password Signup:**
- [ ] Navigate to `/auth`
- [ ] Click "Cadastre-se" to switch to signup
- [ ] Select "Usuário" user type
- [ ] Fill in all required fields:
  - [ ] Full name
  - [ ] Valid email
  - [ ] Password (6+ characters)
- [ ] Click "Criar Conta"
- [ ] Verify success toast appears
- [ ] Verify redirect to `/dashboard/consultas`
- [ ] Verify user appears in Supabase Auth dashboard
- [ ] Verify profile created in `profiles` table
- [ ] Verify credits plan created in `credits_plans` table

**Lawyer Signup:**
- [ ] Navigate to `/auth`
- [ ] Click "Cadastre-se"
- [ ] Select "Advogado" user type
- [ ] Fill in all fields including OAB number
- [ ] Click "Criar Conta"
- [ ] Verify success and redirect
- [ ] Verify `user_type` is "lawyer" in database
- [ ] Verify `oab_number` is saved

**Validation Tests:**
- [ ] Try signup with invalid email → Should show error
- [ ] Try signup with password < 6 chars → Should show error
- [ ] Try signup with existing email → Should show error
- [ ] Try signup with empty fields → Should show error
- [ ] Verify all error messages are user-friendly

### Login Flow

**Email/Password Login:**
- [ ] Navigate to `/auth`
- [ ] Enter valid email and password
- [ ] Click "Entrar"
- [ ] Verify success toast appears
- [ ] Verify redirect to `/dashboard/consultas`
- [ ] Verify user data loaded in header
- [ ] Verify session persists on page refresh

**Login Errors:**
- [ ] Try login with wrong password → Should show error
- [ ] Try login with non-existent email → Should show error
- [ ] Try login with invalid email format → Should show error
- [ ] Verify error messages don't leak security info

### Google OAuth

**OAuth Flow:**
- [ ] Navigate to `/auth`
- [ ] Click "Google" tab
- [ ] Click "Continuar com Google"
- [ ] Verify redirect to Google
- [ ] Authorize application
- [ ] Verify redirect back to app
- [ ] Verify automatic login
- [ ] Verify profile created for new user
- [ ] Verify redirect to dashboard

**OAuth Edge Cases:**
- [ ] Try OAuth with existing email → Should link accounts
- [ ] Cancel OAuth flow → Should return to auth page
- [ ] Try OAuth with blocked popup → Should show error

### Magic Links

**Magic Link Flow:**
- [ ] Navigate to `/auth`
- [ ] Click "Google" tab
- [ ] Enter email in magic link field
- [ ] Click "Receber código por email"
- [ ] Verify success toast
- [ ] Check email inbox
- [ ] Click link in email
- [ ] Verify automatic login
- [ ] Verify redirect to dashboard

**Magic Link Errors:**
- [ ] Try with invalid email → Should show error
- [ ] Try with empty email → Should show error
- [ ] Wait for link to expire → Should show error

### Password Recovery

**Recovery Flow:**
- [ ] Navigate to `/auth`
- [ ] Click "Esqueceu a senha?"
- [ ] Enter email in dialog
- [ ] Click "Enviar Link de Recuperação"
- [ ] Verify success toast
- [ ] Check email inbox
- [ ] Click reset link in email
- [ ] Verify redirect to `/reset-password`
- [ ] Enter new password
- [ ] Confirm new password
- [ ] Click "Alterar Senha"
- [ ] Verify success toast
- [ ] Verify redirect to `/auth`
- [ ] Login with new password
- [ ] Verify login successful

**Recovery Errors:**
- [ ] Try with invalid email → Should show error
- [ ] Try with non-existent email → Should still show success (security)
- [ ] Enter mismatched passwords → Should show error
- [ ] Enter weak password → Should show error
- [ ] Try expired token → Should show error
- [ ] Try used token → Should show error

### Email Verification

**Verification Flow:**
- [ ] Sign up new account
- [ ] Check email inbox
- [ ] Click verification link
- [ ] Verify redirect to `/verify-email`
- [ ] Verify loading state shown
- [ ] Verify success message
- [ ] Verify auto-redirect to dashboard
- [ ] Check `email_confirmed_at` in Supabase Auth

**Verification Errors:**
- [ ] Try invalid token → Should show error
- [ ] Try expired token → Should show error
- [ ] Try already-used token → Should show error

### Logout

**Logout Flow:**
- [ ] Login to account
- [ ] Click user avatar in header
- [ ] Click "Sair" in dropdown
- [ ] Verify confirmation dialog appears
- [ ] Click "Cancelar" → Should close dialog
- [ ] Click "Sair" again
- [ ] Click "Sair" in dialog
- [ ] Verify success toast
- [ ] Verify redirect to `/auth`
- [ ] Verify session cleared
- [ ] Try accessing `/dashboard` → Should redirect to `/auth`

**Logout Button Variants:**
- [ ] Test logout from dropdown menu
- [ ] Test logout without confirmation
- [ ] Test logout with different button styles
- [ ] Verify all variants work correctly

## 🛡️ Protected Routes

### Route Protection
- [ ] Logout completely
- [ ] Try accessing `/dashboard/consultas` → Should redirect to `/auth`
- [ ] Try accessing `/dashboard/monitoramentos` → Should redirect to `/auth`
- [ ] Try accessing `/dashboard/senhas` → Should redirect to `/auth`
- [ ] Try accessing `/dashboard/planos` → Should redirect to `/auth`
- [ ] Try accessing `/dashboard/perfil` → Should redirect to `/auth`
- [ ] Try accessing `/dashboard/configuracoes` → Should redirect to `/auth`
- [ ] Login and try same routes → Should allow access

### Admin Routes
- [ ] Login as regular user
- [ ] Try accessing `/dashboard/admin` → Should redirect to `/dashboard/consultas`
- [ ] Logout
- [ ] Login as admin user
- [ ] Try accessing `/dashboard/admin` → Should allow access
- [ ] Verify admin menu item appears in dropdown

## 👤 User Roles

### Role Detection
- [ ] Login as regular user
- [ ] Verify `isUser` is true
- [ ] Verify `isLawyer` is false
- [ ] Verify `isAdmin` is false
- [ ] Verify no admin menu item

**Lawyer Role:**
- [ ] Login as lawyer
- [ ] Verify `isLawyer` is true
- [ ] Verify `isUser` is false
- [ ] Verify `isAdmin` is false
- [ ] Verify OAB number displayed if applicable

**Admin Role:**
- [ ] Login as admin
- [ ] Verify `isAdmin` is true
- [ ] Verify admin menu item appears
- [ ] Verify can access admin routes
- [ ] Verify admin features visible

## 🔄 Session Management

### Session Persistence
- [ ] Login to account
- [ ] Refresh page → Should stay logged in
- [ ] Close browser tab
- [ ] Reopen browser → Should stay logged in
- [ ] Clear localStorage → Should logout
- [ ] Login again → Should work

### Token Refresh
- [ ] Login to account
- [ ] Wait for token to expire (1 hour)
- [ ] Perform an action
- [ ] Verify token auto-refreshed
- [ ] Verify no logout occurred
- [ ] Verify action completed successfully

### Multiple Tabs
- [ ] Login in Tab 1
- [ ] Open Tab 2 → Should be logged in
- [ ] Logout in Tab 1
- [ ] Check Tab 2 → Should be logged out
- [ ] Login in Tab 2
- [ ] Check Tab 1 → Should be logged in

## 🎨 UI/UX Tests

### Loading States
- [ ] Verify loading spinner during login
- [ ] Verify loading spinner during signup
- [ ] Verify loading spinner during logout
- [ ] Verify loading spinner during password reset
- [ ] Verify loading text changes appropriately
- [ ] Verify buttons disabled during loading

### Error Messages
- [ ] Verify error toasts appear
- [ ] Verify error messages are clear
- [ ] Verify error messages are user-friendly
- [ ] Verify no technical jargon in errors
- [ ] Verify errors don't leak security info

### Success Messages
- [ ] Verify success toasts appear
- [ ] Verify success messages are encouraging
- [ ] Verify success messages are clear
- [ ] Verify appropriate icons used

### Form Validation
- [ ] Verify real-time email validation
- [ ] Verify password strength indicator (if applicable)
- [ ] Verify required field indicators
- [ ] Verify validation messages are helpful

### Responsive Design
- [ ] Test on mobile (< 640px)
- [ ] Test on tablet (640px - 1024px)
- [ ] Test on desktop (> 1024px)
- [ ] Verify all elements accessible
- [ ] Verify no horizontal scroll
- [ ] Verify touch targets are large enough

## 🔒 Security Tests

### Password Security
- [ ] Verify passwords are not visible by default
- [ ] Verify show/hide password toggle works
- [ ] Verify passwords are not logged to console
- [ ] Verify passwords are not in URL
- [ ] Verify password requirements enforced

### Session Security
- [ ] Verify JWT tokens are not exposed
- [ ] Verify tokens stored securely
- [ ] Verify tokens expire appropriately
- [ ] Verify old tokens are invalidated

### XSS Protection
- [ ] Try entering `<script>alert('xss')</script>` in forms
- [ ] Verify script doesn't execute
- [ ] Verify input is sanitized

### CSRF Protection
- [ ] Verify CSRF tokens used (Supabase handles this)
- [ ] Verify requests from other origins blocked

## 📱 Browser Compatibility

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] Chrome Mobile
- [ ] Safari Mobile
- [ ] Firefox Mobile

### Browser Features
- [ ] Test with cookies disabled → Should show error
- [ ] Test with JavaScript disabled → Should show error
- [ ] Test with localStorage disabled → Should show error

## ⚡ Performance Tests

### Load Times
- [ ] Auth page loads < 2 seconds
- [ ] Login completes < 3 seconds
- [ ] Signup completes < 3 seconds
- [ ] Password reset < 2 seconds
- [ ] Logout completes < 1 second

### Network Conditions
- [ ] Test on slow 3G
- [ ] Test on fast 3G
- [ ] Test on 4G
- [ ] Test on WiFi
- [ ] Verify appropriate loading states

## 🐛 Edge Cases

### Network Errors
- [ ] Disconnect internet during login → Should show error
- [ ] Reconnect and retry → Should work
- [ ] Test with intermittent connection

### Concurrent Actions
- [ ] Try logging in twice simultaneously
- [ ] Try logging out twice simultaneously
- [ ] Verify no race conditions

### Invalid States
- [ ] Try accessing reset password without token
- [ ] Try accessing verify email without token
- [ ] Try using expired tokens
- [ ] Verify appropriate error handling

## 📊 Database Verification

### After Signup
- [ ] User exists in `auth.users`
- [ ] Profile exists in `public.profiles`
- [ ] Credits plan exists in `public.credits_plans`
- [ ] All fields populated correctly
- [ ] Timestamps are correct

### After Login
- [ ] Session exists in `auth.sessions`
- [ ] Last sign in updated
- [ ] Session token valid

### After Logout
- [ ] Session removed from `auth.sessions`
- [ ] Refresh token invalidated

## ✅ Final Checklist

- [ ] All authentication flows tested
- [ ] All error cases handled
- [ ] All success cases work
- [ ] UI/UX is polished
- [ ] Security measures verified
- [ ] Performance is acceptable
- [ ] Browser compatibility confirmed
- [ ] Mobile experience tested
- [ ] Database state correct
- [ ] Documentation updated

## 📝 Test Results

**Date Tested:** _______________  
**Tested By:** _______________  
**Environment:** _______________  
**Pass Rate:** _____ / _____  

**Issues Found:**
1. _______________
2. _______________
3. _______________

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________

---

**Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Failed