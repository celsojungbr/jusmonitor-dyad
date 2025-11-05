# ✅ Checklist - Corrigir Registro

## 1️⃣ Desabilitar Confirmação de Email

```
□ Acessar: https://supabase.com/dashboard/project/blopdveolbwqajzklnzu/auth/providers
□ Clicar em "Email"
□ Desabilitar "Confirm email"
□ Clicar em "Save"
```

## 2️⃣ Confirmar Usuários Existentes (Opcional)

```
□ Acessar: https://supabase.com/dashboard/project/blopdveolbwqajzklnzu/auth/users
□ Encontrar usuário
□ Clicar em "..." → "Confirm email"
```

**OU via SQL:**

```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
```

## 3️⃣ Testar

```
□ Abrir console (F12)
□ Ir para http://localhost:8080/auth
□ Criar novo usuário
□ Ver logs no console
□ Verificar se redireciona para dashboard
```

## 4️⃣ Verificar

```
□ Usuário aparece no Supabase Dashboard
□ Perfil foi criado
□ Consigo fazer login
```

---

## ✅ Pronto!

Se todos os itens estão marcados, o registro está funcionando! 🎉

---

**Tempo:** 2-3 minutos  
**Última atualização:** 2025-01-02