import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Shield, Bell, FileText, Zap, TrendingUp, Users, Star, Check } from "lucide-react";
import { Link } from "react-router-dom";
import logoHorizontal from "@/assets/logo-horizontal-white.png";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        >
          <source
            src="https://res.cloudinary.com/dsdzoebyq/video/upload/v1762060309/7892_Particles_Particle_1920x1080_gkyqa8.mp4"
            type="video/mp4"
          />
        </video>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/85 to-background" />

        {/* Animated particles effect */}
        <div className="absolute inset-0 bg-grid-white/[0.02]" />

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="mb-8 animate-fade-in">
            <img
              src={logoHorizontal}
              alt="JusMonitor"
              className="h-20 mx-auto mb-8 drop-shadow-2xl"
            />
          </div>

          <Badge className="mb-6 px-4 py-2 text-sm animate-fade-in-up">
            🚀 Plataforma de Monitoramento Judicial Inteligente
          </Badge>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 text-foreground animate-fade-in-up leading-tight">
            Monitore Processos
            <br />
            <span className="text-primary bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              com Inteligência
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto animate-fade-in-up leading-relaxed">
            Consulte, acompanhe e baixe processos judiciais de forma simples e automatizada.
            <br />
            Receba alertas em tempo real sobre movimentações processuais.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in-up">
            <Button asChild size="lg" className="text-lg h-14 px-10 shadow-lg hover:shadow-xl transition-all">
              <Link to="/auth">
                Começar Gratuitamente
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg h-14 px-10 border-2 hover:bg-secondary">
              <Link to="/auth">
                Fazer Login
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-16 animate-fade-in-up">
            <div className="bg-card/50 backdrop-blur-sm border rounded-lg p-6">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">1000+</div>
              <div className="text-sm text-muted-foreground">Processos Monitorados</div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border rounded-lg p-6">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime Garantido</div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border rounded-lg p-6">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Monitoramento Ativo</div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border rounded-lg p-6">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-sm text-muted-foreground">Advogados Ativos</div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-primary rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-background to-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4">Recursos Poderosos</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Tudo que você precisa em uma plataforma
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Ferramentas profissionais para otimizar seu trabalho jurídico
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-xl group">
              <CardHeader>
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Search className="w-7 h-7 text-primary" />
                </div>
                <CardTitle className="text-xl">Consultas Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Busque processos por CPF, CNPJ, OAB ou número CNJ em múltiplos tribunais simultaneamente.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-xl group">
              <CardHeader>
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Bell className="w-7 h-7 text-primary" />
                </div>
                <CardTitle className="text-xl">Monitoramento 24/7</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Receba notificações automáticas em tempo real sobre novos andamentos processuais.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-xl group">
              <CardHeader>
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="w-7 h-7 text-primary" />
                </div>
                <CardTitle className="text-xl">Download Automático</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Baixe petições, sentenças e documentos processuais diretamente da plataforma.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-xl group">
              <CardHeader>
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="w-7 h-7 text-primary" />
                </div>
                <CardTitle className="text-xl">Segurança Total</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Acesso seguro a processos sob segredo de justiça com credenciais criptografadas.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4">Processo Simples</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Como Funciona
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comece a monitorar seus processos em minutos
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-2xl font-bold text-primary-foreground mb-6 mx-auto shadow-lg">
                1
              </div>
              <h3 className="text-2xl font-bold mb-4">Cadastre-se</h3>
              <p className="text-muted-foreground text-lg">
                Crie sua conta gratuitamente em menos de 2 minutos
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-2xl font-bold text-primary-foreground mb-6 mx-auto shadow-lg">
                2
              </div>
              <h3 className="text-2xl font-bold mb-4">Configure</h3>
              <p className="text-muted-foreground text-lg">
                Adicione os processos que deseja monitorar
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-2xl font-bold text-primary-foreground mb-6 mx-auto shadow-lg">
                3
              </div>
              <h3 className="text-2xl font-bold mb-4">Monitore</h3>
              <p className="text-muted-foreground text-lg">
                Receba alertas automáticos de todas as movimentações
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <Badge className="mb-4">Vantagens</Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Por que escolher o JusMonitor?
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Check className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Economize Tempo</h3>
                    <p className="text-muted-foreground">
                      Automatize a consulta de processos e reduza em até 80% o tempo gasto com acompanhamento processual.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Atualizações em Tempo Real</h3>
                    <p className="text-muted-foreground">
                      Seja o primeiro a saber sobre movimentações importantes nos seus processos.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Aumente sua Produtividade</h3>
                    <p className="text-muted-foreground">
                      Gerencie centenas de processos com facilidade e nunca perca um prazo importante.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Trabalho em Equipe</h3>
                    <p className="text-muted-foreground">
                      Compartilhe informações com sua equipe e centralize o acompanhamento processual.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-8 border-2 border-primary/20">
                <div className="space-y-4">
                  <div className="bg-card p-4 rounded-lg border shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium">Processo atualizado</span>
                    </div>
                    <p className="text-sm text-muted-foreground">CNJ: 0001234-56.2024.8.26.0100</p>
                  </div>

                  <div className="bg-card p-4 rounded-lg border shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium">Nova movimentação detectada</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Sentença publicada</p>
                  </div>

                  <div className="bg-card p-4 rounded-lg border shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium">Alerta de prazo</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Vencimento em 3 dias</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4">Depoimentos</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              O que nossos clientes dizem
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-2">
              <CardHeader>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>
                <CardDescription className="text-base text-foreground">
                  "O JusMonitor revolucionou a forma como acompanho meus processos. Economizo horas todos os dias!"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="font-semibold">Dra. Maria Silva</div>
                <div className="text-sm text-muted-foreground">Advogada Civilista</div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>
                <CardDescription className="text-base text-foreground">
                  "Excelente ferramenta! As notificações em tempo real me ajudam a nunca perder prazos importantes."
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="font-semibold">Dr. João Santos</div>
                <div className="text-sm text-muted-foreground">Advogado Trabalhista</div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>
                <CardDescription className="text-base text-foreground">
                  "Interface intuitiva e funcionalidades robustas. Indispensável para qualquer escritório moderno."
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="font-semibold">Dra. Ana Costa</div>
                <div className="text-sm text-muted-foreground">Sócia em Escritório</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Pronto para começar?
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground mb-10">
              Junte-se a centenas de advogados que já otimizaram seu trabalho
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg h-14 px-10 shadow-lg hover:shadow-xl">
                <Link to="/auth">
                  Criar Conta Gratuita
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg h-14 px-10 border-2">
                <Link to="/auth">
                  Ver Demonstração
                </Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              Sem cartão de crédito necessário • Cancele quando quiser
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t bg-secondary/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2">
              <img
                src={logoHorizontal}
                alt="JusMonitor"
                className="h-12 mb-4"
              />
              <p className="text-muted-foreground mb-4">
                A plataforma mais completa para monitoramento de processos judiciais.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Produto</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/recursos" className="text-muted-foreground hover:text-primary transition-colors">
                    Recursos
                  </Link>
                </li>
                <li>
                  <Link to="/precos" className="text-muted-foreground hover:text-primary transition-colors">
                    Preços
                  </Link>
                </li>
                <li>
                  <Link to="/api" className="text-muted-foreground hover:text-primary transition-colors">
                    API
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/termos" className="text-muted-foreground hover:text-primary transition-colors">
                    Termos de Uso
                  </Link>
                </li>
                <li>
                  <Link to="/privacidade" className="text-muted-foreground hover:text-primary transition-colors">
                    Privacidade
                  </Link>
                </li>
                <li>
                  <Link to="/contato" className="text-muted-foreground hover:text-primary transition-colors">
                    Contato
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t text-center text-muted-foreground">
            <p>© 2025 JusMonitor. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
