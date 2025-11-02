import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, Pause, Trash2 } from "lucide-react";

const Monitoramentos = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Monitoramentos</h1>
          <p className="text-muted-foreground">
            Gerencie os processos que você está acompanhando
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Novo Monitoramento
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-primary mb-2">12</div>
            <div className="text-sm text-muted-foreground">Monitoramentos Ativos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-primary mb-2">3</div>
            <div className="text-sm text-muted-foreground">Novos Alertas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-primary mb-2">5</div>
            <div className="text-sm text-muted-foreground">Verificações Hoje</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {[1, 2, 3].map((item) => (
          <Card key={item}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">Processo 0000000-00.2024.8.26.0000</h3>
                    <Badge>Ativo</Badge>
                    <Badge variant="outline">TJ-SP</Badge>
                  </div>
                  
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p><strong>Tipo:</strong> Monitoramento por CNJ</p>
                    <p><strong>Criado em:</strong> 01/01/2025</p>
                    <p><strong>Última verificação:</strong> Há 2 horas</p>
                    <p><strong>Próxima verificação:</strong> Daqui a 4 horas</p>
                  </div>
                  
                  <div className="mt-3">
                    <Badge variant="secondary">3 novos andamentos</Badge>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Pause className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Monitoramentos;
