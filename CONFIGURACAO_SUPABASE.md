# 🔧 Configuração do Supabase - JusMonitor

## ✅ O Que Foi Feito

1. **Criado arquivo `.env`** com as configurações do seu projeto Supabase
2. **Atualizado `.gitignore`** para não versionar o arquivo `.env`
3. **Criado `.env.example`** para documentação

## 🚀 Como Usar

### 1. Reiniciar o Servidor

Após criar o arquivo `.env`, você DEVE reiniciar o servidor:

```bash
# Pare o servidor (Ctrl+C)
# Inicie novamente
npm run dev
```

### 2. Verificar se Funcionou

1. Abra o console do navegador (F12)
2. Vá para http://localhost:8080/auth
3. Tente criar um novo usuário
4. Verifique se aparece no Supabase Dashboard

### 3. Confirmar no Supabase

Acesse: https://supabase.com/dashboard/project/blopdveolbwqajzklnzu/auth/users

Os usuários devem aparecer agora!

## 📝 Informações do Projeto

- **Project ID:** blopdveolbwqajzklnzu
- **Project URL:** https://blopdveolbwqajzklnzu.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/blopdveolbwqajzklnzu

## ⚠️ Importante

- **NUNCA** commite o arquivo `.env` no Git
- **SEMPRE** reinicie o servidor após alterar o `.env`
- **MANTENHA** as chaves seguras

## 🔍 Troubleshooting

Se ainda não funcionar:

1. **Verifique se o arquivo `.env` está na raiz do projeto** (mesmo nível do `package.json`)
2. **Confirme que reiniciou o servidor**
3. **Limpe o cache do navegador** (Ctrl+Shift+R)
4. **Verifique o console** para erros

## 🎯 Próximos Passos

1. ✅ Reinicie o servidor
2. ✅ Teste criar um novo usuário
3. ✅ Verifique no Supabase Dashboard
4. ✅ Confirme que os usuários aparecem

---

**Status:** ✅ Configurado  
**Última Atualização:** 2025-01-02