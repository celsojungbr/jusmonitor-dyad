import Header from "@/components/Header";
import { Badge } from "@/components/ui/badge";

const Sobre = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <Badge className="mb-4">Sobre Nós</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Sobre o JusMonitor
            </h1>
            <p className="text-lg text-muted-foreground">
              Transformando o acompanhamento processual com tecnologia
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground leading-relaxed mb-6">
              O JusMonitor é uma plataforma de monitoramento judicial desenvolvida para
              advogados, escritórios de advocacia e departamentos jurídicos que buscam
              otimizar o acompanhamento de processos judiciais.
            </p>

            <p className="text-muted-foreground leading-relaxed mb-6">
              Utilizando Inteligência Artificial e automação, nossa plataforma permite
              que você consulte, monitore e receba alertas sobre movimentações processuais
              em tempo real, economizando tempo e garantindo que nenhum prazo importante
              seja perdido.
            </p>

            <h2 className="text-2xl font-bold mb-4 mt-8">Nossa Missão</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Facilitar o trabalho de profissionais do direito através da tecnologia,
              tornando o acompanhamento processual mais eficiente, seguro e acessível.
            </p>

            <h2 className="text-2xl font-bold mb-4 mt-8">Nossos Valores</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Segurança e confidencialidade dos dados</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Inovação contínua em tecnologia jurídica</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Compromisso com a excelência no atendimento</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Transparência e ética em todas as operações</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Sobre;
