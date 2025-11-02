import { Button } from "@/components/ui/button";
import { Search, Shield, Bell, FileText } from "lucide-react";
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
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        >
          <source src="/hero-background.mp4" type="video/mp4" />
        </video>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="mb-8">
            <img 
              src={logoHorizontal} 
              alt="JusMonitor" 
              className="h-16 mx-auto mb-8"
            />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-foreground">
            Monitore Processos Judiciais
            <br />
            <span className="text-primary">com Inteligência</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            Consulte, acompanhe e baixe processos judiciais de forma simples e automatizada.
            Receba alertas em tempo real sobre movimentações.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg h-14 px-8">
              <Link to="/auth">Começar Agora</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg h-14 px-8">
              <Link to="/auth">Login</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-secondary/50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">
            Recursos Principais
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-card p-8 rounded-lg border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Consultas Rápidas</h3>
              <p className="text-muted-foreground">
                Busque processos por CPF, CNPJ, OAB ou número CNJ em múltiplos tribunais.
              </p>
            </div>
            
            <div className="bg-card p-8 rounded-lg border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Bell className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Monitoramento</h3>
              <p className="text-muted-foreground">
                Receba notificações automáticas sobre novos andamentos processuais.
              </p>
            </div>
            
            <div className="bg-card p-8 rounded-lg border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Download de Anexos</h3>
              <p className="text-muted-foreground">
                Baixe petições, sentenças e documentos processuais diretamente.
              </p>
            </div>
            
            <div className="bg-card p-8 rounded-lg border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Seguro e Confiável</h3>
              <p className="text-muted-foreground">
                Acesso seguro a processos sob segredo de justiça com credenciais protegidas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t" style={{ backgroundColor: 'hsl(var(--footer-background))' }}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-muted-foreground">
              © 2025 JusMonitor. Todos os direitos reservados.
            </div>
            <div className="flex gap-6">
              <Link to="/termos" className="text-muted-foreground hover:text-primary transition-colors">
                Termos de Uso
              </Link>
              <Link to="/privacidade" className="text-muted-foreground hover:text-primary transition-colors">
                Privacidade
              </Link>
              <Link to="/contato" className="text-muted-foreground hover:text-primary transition-colors">
                Contato
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
