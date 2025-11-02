import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Share2, Bell, Download } from "lucide-react";

const Processos = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Detalhes do Processo</h1>
          <p className="text-muted-foreground">
            Processo nº 0000000-00.2024.8.26.0000
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Bell className="w-4 h-4 mr-2" />
            Monitorar
          </Button>
          <Button variant="outline">
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Baixar PDF
          </Button>
        </div>
      </div>

      <Tabs defaultValue="capa" className="w-full">
        <TabsList>
          <TabsTrigger value="capa">Capa Processual</TabsTrigger>
          <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
          <TabsTrigger value="envolvidos">Envolvidos</TabsTrigger>
          <TabsTrigger value="anexos">Anexos</TabsTrigger>
        </TabsList>

        <TabsContent value="capa" className="space-y-4 mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Informações Gerais</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Número CNJ:</dt>
                      <dd className="font-medium">0000000-00.2024.8.26.0000</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Tribunal:</dt>
                      <dd className="font-medium">TJ-SP</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Distribuição:</dt>
                      <dd className="font-medium">15/01/2024</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Status:</dt>
                      <dd><Badge>Ativo</Badge></dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Valor da Causa:</dt>
                      <dd className="font-medium">R$ 50.000,00</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Fase Processual</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Fase:</dt>
                      <dd className="font-medium">Conhecimento</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Juiz:</dt>
                      <dd className="font-medium">Dr. José Santos</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Comarca:</dt>
                      <dd className="font-medium">São Paulo</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Vara:</dt>
                      <dd className="font-medium">1ª Vara Cível</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movimentacoes" className="space-y-3 mt-6">
          {[1, 2, 3, 4].map((item) => (
            <Card key={item}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="text-sm text-muted-foreground whitespace-nowrap">
                    {new Date().toLocaleDateString('pt-BR')}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">Juntada de Petição</h4>
                    <p className="text-sm text-muted-foreground">
                      Peticionamento realizado pela parte autora com documentos complementares.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="envolvidos" className="space-y-3 mt-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Polo Ativo</h3>
              <div className="space-y-3">
                <div>
                  <div className="font-medium">João da Silva</div>
                  <div className="text-sm text-muted-foreground">CPF: 000.000.000-00</div>
                  <div className="text-sm text-muted-foreground">Qualidade: Autor</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Polo Passivo</h3>
              <div className="space-y-3">
                <div>
                  <div className="font-medium">Empresa XYZ Ltda</div>
                  <div className="text-sm text-muted-foreground">CNPJ: 00.000.000/0000-00</div>
                  <div className="text-sm text-muted-foreground">Qualidade: Réu</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anexos" className="space-y-3 mt-6">
          {[1, 2, 3].map((item) => (
            <Card key={item} className="hover:border-primary transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Petição Inicial</h4>
                    <p className="text-sm text-muted-foreground">
                      Juntado em {new Date().toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Button size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Processos;
