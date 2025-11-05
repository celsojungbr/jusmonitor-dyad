# Teste Rápido - Google Login

## 🚀 Passos para Testar

### 1. Verifique a Configuração

```bash
# Certifique-se que o servidor está rodando
npm run dev
```

### 2. Acesse a Página de Login

Abra o navegador em: **http://localhost:8080/auth**

### 3. Teste o Login com Google

1. ✅ Clique na aba **"Google"**
2. ✅ Clique no botão **"Continuar com Google"**
3. ✅ Selecione sua conta Google
4. ✅ Autorize o aplicativo (primeira vez)
5. ✅ Aguarde o redirecionamento

### 4. Verifique o Resultado

**Você deve ser redirecionado para:**
- URL: `http://localhost:8080/dashboard/consultas`
- Ver seu nome no header
- Ver o menu de navegação

### 5. Verifique no Banco de Dados

**No Supabase Dashboard:**

1. **Authentication → Users**
   ```
   ✅ Seu email aparece na lista
   ✅ Provider: google
   ✅ Confirmed: true
   ```

2. **Table Editor → profiles**
   ```sql
   SELECT * FROM profiles WHERE id = 'seu-user-id';
   ```
   Deve retornar:
   ```
   ✅ id: seu-user-id
   ✅ full_name: Seu Nome do Google
   ✅ user_type: user
   ✅ cpf_cnpj: (vazio)
   ```

3. **Table Editor → credits_plans**
   ```sql
   SELECT * FROM credits_plans WHERE user_id = 'seu-user-id';
   ```
   Deve retornar:
   ```
   ✅ user_id: seu-user-id
   ✅ plan_type: prepaid
   ✅ credits_balance: 0
   ✅ credit_cost: 0.50
   ```

## ✅ Checklist de Sucesso

- [ ] Login com Google funcionou
- [ ] Redirecionado para o dashboard
- [ ] Nome aparece no header
- [ ] Perfil criado no banco
- [ ] Plano de créditos criado
- [ ] Pode navegar pelo dashboard

## 🐛 Se Algo Deu Errado

### Erro: "redirect_uri_mismatch"

**Solução Rápida:**
1. Copie a URL que aparece no erro
2. Vá para Google Cloud Console → Credentials
3. Adicione essa URL nos "Authorized redirect URIs"
4. Salve e tente novamente

### Erro: "Invalid client"

**Solução Rápida:**
1. Verifique o Client ID no Supabase
2. Verifique o Client Secret no Supabase
3. Certifique-se que copiou corretamente do Google Cloud Console

### Perfil não foi criado

**Solução Rápida:**
1. Abra o console do navegador (F12)
2. Veja se há erros
3. Execute o SQL do trigger novamente
4. Tente fazer login novamente

### Não redireciona após login

**Solução Rápida:**
1. Verifique se a rota `/auth/callback` existe
2. Verifique o console do navegador para erros
3. Limpe o cache do navegador
4. Tente novamente

## 📊 Logs Úteis

### No Console do Navegador

Você deve ver:
```
✅ OAuth callback iniciado
✅ Sessão encontrada
✅ Perfil verificado/criado
✅ Redirecionando para dashboard
```

### No Supabase Logs

1. Vá para: Dashboard → Logs → Auth Logs
2. Procure por:
   ```
   ✅ SIGNED_IN event
   ✅ User ID
   ✅ Provider: google
   ```

## 🎯 Próximos Passos

Após o primeiro login bem-sucedido:

1. **Complete seu perfil**
   - Vá para: Dashboard → Perfil
   - Adicione CPF/CNPJ
   - Adicione telefone (opcional)

2. **Explore o dashboard**
   - Consultas
   - Monitoramentos
   - Senhas
   - Planos

3. **Teste outras funcionalidades**
   - Fazer uma consulta
   - Criar um monitoramento
   - Ver transações de créditos

## 📞 Suporte

Se precisar de ajuda:

1. Verifique os logs do console (F12)
2. Verifique os logs do Supabase
3. Consulte: `docs/GOOGLE_OAUTH_SETUP.md`
4. Consulte: `docs/AUTHENTICATION_GUIDE.md`

---

**Tempo estimado**: 2-3 minutos  
**Dificuldade**: Fácil  
**Status**: ✅ Pronto para testar