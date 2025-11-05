# AI Rules - JusMonitor V3

## 🎯 Project Overview

JusMonitor is a legal process monitoring platform built with React, TypeScript, and Supabase. It allows lawyers and legal professionals to search, monitor, and manage judicial processes in Brazil using AI-powered automation.

## 🛠️ Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **State Management**: React Query (@tanstack/react-query) for server state
- **Routing**: React Router v6
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Authentication**: Supabase Auth with custom AuthContext

## 📁 Architecture

This project follows a **Feature-Based Architecture**:

```
src/
├── features/           # Feature modules (consultas, processos, monitoramentos, etc.)
│   └── [feature]/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       ├── types/
│       └── index.ts
├── shared/            # Shared utilities, types, services
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── types/
│   └── utils/
├── pages/            # Page components (routes)
├── components/       # Global components (Header, ProtectedRoute, etc.)
└── integrations/     # External integrations (Supabase)
```

## 🚨 Critical Rules

### 1. **Component Library Usage**

✅ **ALWAYS USE shadcn/ui components** - They are already installed and configured:
- Button, Input, Card, Dialog, Tabs, Select, etc.
- Import from `@/components/ui/[component]`
- **DO NOT** install or use other UI libraries (MUI, Ant Design, Chakra, etc.)

✅ **Icons**: Use `lucide-react` only
- Already installed and widely used in the codebase
- **DO NOT** install react-icons, heroicons, or other icon libraries

### 2. **Styling**

✅ **ALWAYS use Tailwind CSS** for styling:
- Use utility classes extensively
- Follow existing patterns in the codebase
- Use `cn()` utility from `@/lib/utils` for conditional classes

❌ **NEVER use**:
- Inline styles (except for dynamic values)
- CSS modules
- Styled-components
- Emotion
- Any CSS-in-JS library

### 3. **State Management**

✅ **Server State**: Use React Query (@tanstack/react-query)
- Already configured in `src/main.tsx`
- Use `useQuery` for fetching data
- Use `useMutation` for mutations
- Example: `src/hooks/usePricing.ts`

✅ **Client State**: Use React hooks (useState, useReducer, useContext)
- For local component state: `useState`
- For complex state: `useReducer`
- For global state: Context API (see `AuthContext.tsx`)

❌ **NEVER install**:
- Redux, Zustand, Jotai, Recoil, or any other state management library

### 4. **Forms**

✅ **ALWAYS use React Hook Form + Zod**:
- React Hook Form for form state management
- Zod for schema validation
- Use shadcn/ui Form components
- Example: `src/components/admin/plans/PlanDialog.tsx`

❌ **NEVER use**:
- Formik
- Final Form
- Uncontrolled forms without React Hook Form

### 5. **API Calls**

✅ **Backend (Edge Functions)**: Use Supabase Edge Functions
- Located in `supabase/functions/`
- Use Deno runtime
- Call via `supabase.functions.invoke()`

✅ **Frontend Service Layer**: Use service classes
- Located in `src/features/[feature]/services/`
- Use `ApiClient` from `@/shared/services/apiClient`
- Example: `src/features/consultas/services/consultaService.ts`

❌ **NEVER**:
- Use axios (use native fetch or Supabase client)
- Make direct API calls from components
- Skip the service layer

### 6. **Database Access**

✅ **ALWAYS use Supabase client**:
- Import from `@/integrations/supabase/client`
- Use TypeScript types from `@/integrations/supabase/types`
- Follow RLS (Row Level Security) policies

✅ **Edge Functions**: Use service role key for admin operations
- Regular operations: Use user's auth token
- Admin operations: Use `SUPABASE_SERVICE_ROLE_KEY`

### 7. **Routing**

✅ **Use React Router v6**:
- Routes defined in `src/App.tsx`
- Use `<Link>` for navigation
- Use `useNavigate()` for programmatic navigation
- Protected routes: Use `<ProtectedRoute>` wrapper
- Admin routes: Use `<AdminRoute>` wrapper

### 8. **TypeScript**

✅ **Type Safety**:
- Use TypeScript for ALL files
- Define types in `types/` folders within features
- Use shared types from `src/shared/types/`
- Use Supabase generated types from `src/integrations/supabase/types.ts`

❌ **NEVER**:
- Use `any` type (use `unknown` if needed)
- Skip type definitions
- Use `@ts-ignore` without a very good reason

### 9. **File Organization**

✅ **Feature-Based Structure**:
- Each feature is self-contained in `src/features/[feature]/`
- Features export via barrel exports (`index.ts`)
- Shared code goes in `src/shared/`
- Pages are thin wrappers that compose features

✅ **Naming Conventions**:
- Components: PascalCase (e.g., `ConsultaForm.tsx`)
- Services: camelCase with Service suffix (e.g., `consultaService.ts`)
- Hooks: camelCase with use prefix (e.g., `useProcessoDetalhes.ts`)
- Types: PascalCase (e.g., `ConsultaProcessualData`)
- Files: Match the export name

### 10. **Authentication & Authorization**

✅ **Use AuthContext**:
- Import from `@/contexts/AuthContext`
- Use `useAuth()` hook for user state
- Check `isAuthenticated`, `isAdmin`, `isLawyer`, `isUser`

✅ **Protected Routes**:
- Wrap with `<ProtectedRoute>` for authenticated users
- Wrap with `<AdminRoute>` for admin-only pages

### 11. **Error Handling**

✅ **User-Facing Errors**:
- Use `useToast()` from `@/hooks/use-toast`
- Show clear, actionable error messages
- Example: "Créditos insuficientes. Adicione créditos para continuar."

✅ **Edge Functions**:
- Return proper HTTP status codes
- Return JSON with `{ error: string }` format
- Log errors with `console.error()`

### 12. **Code Quality**

✅ **Best Practices**:
- Keep components small and focused (< 200 lines)
- Extract reusable logic into hooks
- Use meaningful variable names
- Add comments for complex logic
- Follow existing patterns in the codebase

❌ **NEVER**:
- Duplicate code (DRY principle)
- Leave console.logs in production code
- Commit commented-out code
- Use magic numbers (use constants)

## 📚 Key Libraries Reference

### Already Installed (DO NOT REINSTALL)

```json
{
  "@supabase/supabase-js": "^2.78.0",
  "@tanstack/react-query": "^5.83.0",
  "react-hook-form": "^7.61.1",
  "zod": "^3.25.76",
  "lucide-react": "^0.462.0",
  "react-router-dom": "^6.30.1",
  "tailwindcss": "^3.4.17",
  "date-fns": "^3.6.0"
}
```

### shadcn/ui Components Available

All shadcn/ui components are installed. Import from `@/components/ui/`:
- accordion, alert, alert-dialog, avatar, badge, breadcrumb, button
- calendar, card, carousel, chart, checkbox, collapsible, command
- context-menu, dialog, drawer, dropdown-menu, form, hover-card
- input, input-otp, label, menubar, navigation-menu, pagination
- popover, progress, radio-group, resizable, scroll-area, select
- separator, sheet, sidebar, skeleton, slider, sonner, switch
- table, tabs, textarea, toast, toaster, toggle, toggle-group, tooltip

## 🔧 Common Patterns

### 1. Creating a New Feature

```typescript
// src/features/my-feature/
// ├── components/
// │   └── MyFeatureComponent.tsx
// ├── hooks/
// │   └── useMyFeature.ts
// ├── services/
// │   └── myFeatureService.ts
// ├── types/
// │   └── myFeature.types.ts
// └── index.ts (barrel export)
```

### 2. Creating a Service

```typescript
// src/features/my-feature/services/myFeatureService.ts
import { ApiClient } from '@/shared/services/apiClient'

export class MyFeatureService {
  static async doSomething(param: string) {
    const userId = await ApiClient.getCurrentUserId()
    
    return ApiClient.callEdgeFunction('my-edge-function', {
      userId,
      param
    })
  }
}
```

### 3. Creating a Hook

```typescript
// src/features/my-feature/hooks/useMyFeature.ts
import { useQuery } from '@tanstack/react-query'
import { MyFeatureService } from '../services/myFeatureService'

export function useMyFeature(param: string) {
  return useQuery({
    queryKey: ['my-feature', param],
    queryFn: () => MyFeatureService.doSomething(param),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

### 4. Creating a Form

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const formSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
})

export function MyForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '' },
  })

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    console.log(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Enviar</Button>
      </form>
    </Form>
  )
}
```

## 🚀 Edge Functions

### Structure

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, param } = await req.json()

    // Your logic here

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

## 📖 Documentation

- **API Documentation**: See `docs/API_ANALYSIS_AND_PLAN.md`
- **Database Setup**: See `SETUP_DATABASE.md`
- **Implementation Status**: See `IMPLEMENTATION_STATUS.md`
- **Feature Architecture**: See `docs/Feature_Based_Architecture.md`

## ⚠️ Common Mistakes to Avoid

1. ❌ Installing new UI libraries when shadcn/ui has the component
2. ❌ Using CSS modules or styled-components instead of Tailwind
3. ❌ Making API calls directly from components instead of using services
4. ❌ Not using TypeScript types properly
5. ❌ Creating global state when local state would suffice
6. ❌ Not following the feature-based architecture
7. ❌ Forgetting to handle loading and error states
8. ❌ Not using React Query for server state
9. ❌ Hardcoding values instead of using environment variables
10. ❌ Not checking authentication/authorization before operations

## ✅ Checklist for New Features

- [ ] Create feature folder in `src/features/[feature]/`
- [ ] Define types in `types/[feature].types.ts`
- [ ] Create service class in `services/[feature]Service.ts`
- [ ] Create custom hooks if needed in `hooks/`
- [ ] Create components in `components/`
- [ ] Export via barrel export in `index.ts`
- [ ] Add route in `src/App.tsx` if needed
- [ ] Create Edge Function if backend logic is needed
- [ ] Add proper error handling and loading states
- [ ] Use TypeScript strictly (no `any`)
- [ ] Follow existing patterns and naming conventions
- [ ] Test with real data before committing

---

**Last Updated**: 2025-01-02  
**Version**: 3.0  
**Maintainer**: JusMonitor Team