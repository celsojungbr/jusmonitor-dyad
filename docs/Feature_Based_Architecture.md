# Arquitetura Feature-Based Completa - Com Admin Dashboard

## Estrutura Completa do Projeto

```
ESTRUTURA FEATURE-BASED INCLUINDO ADMIN:

📁 src/
├── 📁 features/
│   ├── 📁 consultas/ (Feature: Consultar Processos)
│   │   ├── 📁 components/
│   │   │   ├── ConsultaForm.tsx
│   │   │   ├── ResultadosList.tsx
│   │   │   ├── FiltrosConsulta.tsx
│   │   │   └── ConsultaPage.tsx
│   │   ├── 📁 hooks/
│   │   │   ├── useConsultaSearch.ts
│   │   │   └── useResultados.ts
│   │   ├── 📁 services/
│   │   │   └── consultaService.ts
│   │   ├── 📁 types/
│   │   │   └── consulta.types.ts
│   │   └── index.ts
│   │
│   ├── 📁 processos/ (Feature: Detalhes do Processo)
│   │   ├── 📁 components/
│   │   │   ├── CapaProcessual.tsx
│   │   │   ├── Movimentacoes.tsx
│   │   │   ├── Envolvidos.tsx
│   │   │   ├── Anexos.tsx
│   │   │   ├── ChatIA.tsx
│   │   │   ├── TabsProcesso.tsx
│   │   │   └── ProcessoPage.tsx
│   │   ├── 📁 hooks/
│   │   │   ├── useProcessoDetails.ts
│   │   │   ├── useMovimentacoes.ts
│   │   │   └── useAnexos.ts
│   │   ├── 📁 services/
│   │   │   └── processoService.ts
│   │   ├── 📁 types/
│   │   │   └── processo.types.ts
│   │   └── index.ts
│   │
│   ├── 📁 monitoramentos/ (Feature: Monitorar Processos)
│   │   ├── 📁 components/
│   │   │   ├── MonitoramentosList.tsx
│   │   │   ├── NovoMonitoramento.tsx
│   │   │   ├── MonitoramentoCard.tsx
│   │   │   └── MonitoramentosPage.tsx
│   │   ├── 📁 hooks/
│   │   │   ├── useMonitoramentos.ts
│   │   │   └── useMonitoramentoForm.ts
│   │   ├── 📁 services/
│   │   │   └── monitoramentoService.ts
│   │   ├── 📁 types/
│   │   │   └── monitoramento.types.ts
│   │   └── index.ts
│   │
│   ├── 📁 senhas/ (Feature: Gerenciar Segredos de Justiça)
│   │   ├── 📁 components/
│   │   │   ├── SenhasLista.tsx
│   │   │   ├── NovaCredencial.tsx
│   │   │   ├── CredencialCard.tsx
│   │   │   └── SenhasPage.tsx
│   │   ├── 📁 hooks/
│   │   │   ├── useSenhas.ts
│   │   │   └── useSenhaForm.ts
│   │   ├── 📁 services/
│   │   │   └── senhaService.ts
│   │   ├── 📁 types/
│   │   │   └── senha.types.ts
│   │   └── index.ts
│   │
│   ├── 📁 planos/ (Feature: Gerenciar Planos e Créditos)
│   │   ├── 📁 components/
│   │   │   ├── PlanosComparacao.tsx
│   │   │   ├── SaldoCreditos.tsx
│   │   │   ├── HistoricoConsumo.tsx
│   │   │   ├── AdicionarCreditos.tsx
│   │   │   ├── TabelaPrecos.tsx
│   │   │   └── PlanosPage.tsx
│   │   ├── 📁 hooks/
│   │   │   ├── usePlanos.ts
│   │   │   ├── useCreditos.ts
│   │   │   └── usePlanoPricing.ts
│   │   ├── 📁 services/
│   │   │   └── planosService.ts
│   │   ├── 📁 types/
│   │   │   └── planos.types.ts
│   │   └── index.ts
│   │
│   ├── 📁 perfil/ (Feature: Perfil do Usuário)
│   │   ├── 📁 components/
│   │   │   ├── ProfileMenu.tsx
│   │   │   ├── ProfileForm.tsx
│   │   │   ├── ConfiguracoesForm.tsx
│   │   │   ├── ProfileAvatar.tsx
│   │   │   └── ProfilePage.tsx
│   │   ├── 📁 hooks/
│   │   │   ├── useProfile.ts
│   │   │   └── useProfileForm.ts
│   │   ├── 📁 services/
│   │   │   └── profileService.ts
│   │   ├── 📁 types/
│   │   │   └── profile.types.ts
│   │   └── index.ts
│   │
│   └── 📁 admin/ (Feature: Dashboard Administrativo)
│       ├── 📁 pages/
│       │   ├── 📁 dashboard/
│       │   │   ├── 📁 components/
│       │   │   │   ├── StatsCards.tsx
│       │   │   │   ├── ChartsOverview.tsx
│       │   │   │   ├── UltimasOperacoes.tsx
│       │   │   │   ├── TopUsuarios.tsx
│       │   │   │   └── AlertasRecentes.tsx
│       │   │   ├── 📁 hooks/
│       │   │   │   └── useDashboardStats.ts
│       │   │   └── DashboardPage.tsx
│       │   │
│       │   ├── 📁 usuarios/
│       │   │   ├── 📁 components/
│       │   │   │   ├── UsuariosTable.tsx
│       │   │   │   ├── FiltrosUsuarios.tsx
│       │   │   │   ├── EditarUsuarioModal.tsx
│       │   │   │   ├── CriarUsuarioModal.tsx
│       │   │   │   └── UsuariosPage.tsx
│       │   │   ├── 📁 hooks/
│       │   │   │   ├── useUsuarios.ts
│       │   │   │   └── useUsuarioForm.ts
│       │   │   └── services/
│       │   │       └── usuariosService.ts
│       │   │
│       │   ├── 📁 planos/
│       │   │   ├── 📁 components/
│       │   │   │   ├── PricingConfig.tsx
│       │   │   │   ├── OperacoesTabela.tsx
│       │   │   │   ├── HistoricoMudancas.tsx
│       │   │   │   └── PlanosAdminPage.tsx
│       │   │   ├── 📁 hooks/
│       │   │   │   └── usePricingConfig.ts
│       │   │   └── services/
│       │   │       └── pricingService.ts
│       │   │
│       │   ├── 📁 apis/ (PÁGINA CRÍTICA)
│       │   │   ├── 📁 components/
│       │   │   │   ├── ApisListaStatus.tsx
│       │   │   │   ├── ApisConfigCard.tsx
│       │   │   │   ├── ConfigJudit.tsx
│       │   │   │   ├── ConfigEscavador.tsx
│       │   │   │   ├── EdgeFunctionsManager.tsx
│       │   │   │   ├── EdgeFunctionRow.tsx
│       │   │   │   ├── StatusConexao.tsx
│       │   │   │   ├── LogsIntegracao.tsx
│       │   │   │   ├── TesteIntegracao.tsx
│       │   │   │   └── ApisPage.tsx
│       │   │   ├── 📁 hooks/
│       │   │   │   ├── useApisConfig.ts
│       │   │   │   ├── useEdgeFunctions.ts
│       │   │   │   └── useApiHealth.ts
│       │   │   ├── 📁 services/
│       │   │   │   ├── apisService.ts
│       │   │   │   └── edgeFunctionsService.ts
│       │   │   └── 📁 types/
│       │   │       └── apis.types.ts
│       │   │
│       │   ├── 📁 operacoes/
│       │   │   ├── 📁 components/
│       │   │   │   ├── OperacoesLog.tsx
│       │   │   │   ├── FiltrosOperacoes.tsx
│       │   │   │   ├── EstatsOperacoes.tsx
│       │   │   │   ├── AlertasPerformance.tsx
│       │   │   │   └── OperacoesPage.tsx
│       │   │   ├── 📁 hooks/
│       │   │   │   ├── useOperacoes.ts
│       │   │   │   └── useOperacoesFilters.ts
│       │   │   └── services/
│       │   │       └── operacoesService.ts
│       │   │
│       │   ├── 📁 relatorios/
│       │   │   ├── 📁 components/
│       │   │   │   ├── RelatoriosPredefinidos.tsx
│       │   │   │   ├── GeradorCustomizado.tsx
│       │   │   │   ├── Comparativos.tsx
│       │   │   │   └── RelatoriosPage.tsx
│       │   │   ├── 📁 hooks/
│       │   │   │   └── useRelatorios.ts
│       │   │   └── services/
│       │   │       └── relatoriosService.ts
│       │   │
│       │   ├── 📁 configuracoes/
│       │   │   ├── 📁 components/
│       │   │   │   ├── EmailConfig.tsx
│       │   │   │   ├── NotificacoesConfig.tsx
│       │   │   │   ├── SegurancaConfig.tsx
│       │   │   │   ├── LimitesConfig.tsx
│       │   │   │   └── ConfiguracoesPage.tsx
│       │   │   ├── 📁 hooks/
│       │   │   │   └── useConfigsGlobais.ts
│       │   │   └── services/
│       │   │       └── configsService.ts
│       │   │
│       │   └── 📁 suporte/
│       │       ├── 📁 components/
│       │       │   ├── TicketsList.tsx
│       │       │   ├── TicketDetail.tsx
│       │       │   ├── ChatSuporte.tsx
│       │       │   └── SuportePage.tsx
│       │       ├── 📁 hooks/
│       │       │   ├── useTickets.ts
│       │       │   └── useChatSuporte.ts
│       │       └── services/
│       │           └── suporteService.ts
│       │
│       ├── 📁 components/
│       │   ├── AdminSidebar.tsx
│       │   ├── AdminHeader.tsx
│       │   ├── AdminLayout.tsx
│       │   ├── ProtectedAdminRoute.tsx
│       │   └── AdminBreadcrumb.tsx
│       │
│       ├── 📁 hooks/
│       │   ├── useAdminAuth.ts
│       │   └── useAdminNavigation.ts
│       │
│       ├── 📁 services/
│       │   └── adminService.ts
│       │
│       ├── 📁 types/
│       │   └── admin.types.ts
│       │
│       └── index.ts
│
├── 📁 shared/
│   ├── 📁 components/
│   │   ├── 📁 Layout/
│   │   │   ├── MainLayout.tsx
│   │   │   └── AppContainer.tsx
│   │   ├── 📁 Navigation/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Breadcrumb.tsx
│   │   ├── 📁 UI/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Dialog.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Loading.tsx
│   │   │   ├── Error.tsx
│   │   │   └── Empty.tsx
│   │   └── 📁 Avatar/
│   │       └── Avatar.tsx (40px padrão)
│   │
│   ├── 📁 hooks/
│   │   ├── useAuth.ts
│   │   ├── useFetch.ts
│   │   ├── useDebounce.ts
│   │   ├── usePagination.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useToast.ts
│   │   └── useModal.ts
│   │
│   ├── 📁 utils/
│   │   ├── api.ts (axios/fetch config)
│   │   ├── formatters.ts (data, moeda, etc)
│   │   ├── validators.ts (CPF, CNPJ, OAB, CNJ)
│   │   ├── storage.ts
│   │   ├── constants.ts
│   │   └── errorHandler.ts
│   │
│   ├── 📁 types/
│   │   ├── api.types.ts
│   │   ├── common.types.ts
│   │   ├── auth.types.ts
│   │   ├── user.types.ts
│   │   ├── process.types.ts
│   │   └── error.types.ts
│   │
│   └── 📁 services/
│       ├── apiClient.ts (configuração axios/fetch)
│       ├── authService.ts
│       ├── storageService.ts
│       └── notificationService.ts
│
├── 📁 app/ (ou pages/ se Next.js)
│   ├── 📁 layout/
│   ├── 📁 (auth)/
│   │   ├── 📁 login/
│   │   │   └── page.tsx
│   │   └── 📁 register/
│   │       └── page.tsx
│   ├── 📁 (app)/ (Rotas protegidas)
│   │   ├── page.tsx (Dashboard do usuário ou redirect)
│   │   ├── 📁 consultas/
│   │   │   └── page.tsx
│   │   ├── 📁 processos/
│   │   │   ├── page.tsx
│   │   │   └── 📁 [id]/
│   │   │       └── page.tsx
│   │   ├── 📁 monitoramentos/
│   │   │   └── page.tsx
│   │   ├── 📁 senhas/
│   │   │   └── page.tsx
│   │   ├── 📁 planos/
│   │   │   └── page.tsx
│   │   ├── 📁 perfil/
│   │   │   └── page.tsx
│   │   └── 📁 admin/ (Rotas protegidas - admin only)
│   │       ├── page.tsx (Dashboard admin)
│   │       ├── 📁 usuarios/
│   │       │   └── page.tsx
│   │       ├── 📁 planos/
│   │       │   └── page.tsx
│   │       ├── 📁 apis/
│   │       │   └── page.tsx
│   │       ├── 📁 operacoes/
│   │       │   └── page.tsx
│   │       ├── 📁 relatorios/
│   │       │   └── page.tsx
│   │       ├── 📁 configuracoes/
│   │       │   └── page.tsx
│   │       └── 📁 suporte/
│   │           └── page.tsx
│   │
│   └── globals.css
│
├── 📁 hooks/
│   └── (global hooks if needed)
│
├── 📁 lib/
│   └── auth.ts (Middleware de autenticação)
│
├── index.css (Design System - Tailwind theme)
├── main.tsx (ou index.tsx)
├── App.tsx
└── vite.config.ts
```

---

## Prompt Completo para Lovable.dev

```
CRIE O JUSMONITOR V3 COM A SEGUINTE ARQUITETURA FEATURE-BASED:

===========================================
ARQUITETURA DO PROJETO
===========================================

ESTRUTURA DE PASTAS - FEATURE-BASED:

src/features/
├── consultas/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── types/
│   └── index.ts
├── processos/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── types/
│   └── index.ts
├── monitoramentos/
├── senhas/
├── planos/
├── perfil/
└── admin/ (FEATURE SEPARADA)
    ├── pages/
    │   ├── dashboard/
    │   ├── usuarios/
    │   ├── planos/
    │   ├── apis/ (CRÍTICA)
    │   ├── operacoes/
    │   ├── relatorios/
    │   ├── configuracoes/
    │   └── suporte/
    ├── components/
    │   ├── AdminLayout.tsx
    │   ├── AdminSidebar.tsx
    │   ├── ProtectedAdminRoute.tsx
    │   └── [outros componentes]
    ├── hooks/
    ├── services/
    ├── types/
    └── index.ts

src/shared/
├── components/ (UI reutilizável)
├── hooks/ (Lógica reutilizável)
├── utils/ (Funções auxiliares)
├── types/ (Types globais)
└── services/ (Serviços reutilizáveis)

src/app/ (Rotas - Next.js ou React Router)

REGRAS DA ARQUITETURA:

1. ISOLAMENTO:
   - Cada feature é autossuficiente
   - Features NÃO importam de outras features
   - Apenas shared/ pode ser usado entre features

2. BARREL EXPORTS:
   - Cada feature/pasta tem index.ts
   - Exemplo: import { useConsulta } from '@/features/consultas'

3. TIPOS:
   - Tipos específicos ficam em types/ da feature
   - Tipos globais em shared/types/

4. SERVICES:
   - Services lidam com API calls (JUDiT, Escavador)
   - Services utilizam shared/services/apiClient.ts

5. ADMIN É UMA FEATURE SEPARADA:
   - Proteção com middleware de autenticação
   - Rotas em /admin/*
   - Sidebar separado
   - Apenas role="admin" acessa

6. COMPONENTES COMPARTILHADOS:
   - Button, Input, Card, Badge, Dialog, etc em shared/components/
   - Avatar 40px padrão em shared/components/Avatar/

===========================================
FEATURES DO USUÁRIO COMUM (7 FEATURES)
===========================================

[Aqui vem sua descrição das 7 features do usuário comum]

===========================================
ADMIN DASHBOARD (FEATURE 8)
===========================================

[Aqui vem sua descrição do Admin Dashboard com as 8 páginas]

===========================================
DESIGN SYSTEM
===========================================

[Sua configuração CSS e paleta de cores]

===========================================
APIS
===========================================

[Links e configuração das APIs]

```

---

## Principais Mudanças:

✅ **Admin é uma feature separada** em `src/features/admin/`
✅ **Página de APIs é crítica** - isolada e bem estruturada
✅ **Protección de rotas** - middleware no `lib/auth.ts`
✅ **Sidebar separado** - AdminSidebar vs Sidebar comum
✅ **Todos os serviços** organizados por contexto
✅ **Type safety** - cada feature tem seus types
✅ **Escalável** - fácil adicionar novas features

Esta arquitetura é pronta para produção e funciona muito bem com Lovable.dev! 🚀