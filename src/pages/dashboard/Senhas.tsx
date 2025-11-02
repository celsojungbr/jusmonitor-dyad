import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Shield } from "lucide-react";

const Senhas = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Senhas e Credenciais</h1>
          <p className="text-muted-foreground">
            Gerencie credenciais para acesso a processos sob segredo de justiça
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nova Credencial
        </Button>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-semibold">Armazenamento Seguro</h3>
              <p className="text-sm text-muted-foreground">
                Todas as credenciais são armazenadas com criptografia end-to-end.
                Suas senhas estão protegidas e nunca são expostas em texto simples.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {[
          { tribunal: "TJ-SP", type: "Usuário e Senha", status: "Ativa" },
          { tribunal: "TJ-RJ", type: "Certificado Digital", status: "Ativa" },
          { tribunal: "TJ-MG", type: "Usuário e Senha", status: "Expirada" },
        ].map((cred, idx) => (
          <Card key={idx}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{cred.tribunal}</h3>
                    <Badge variant={cred.status === "Ativa" ? "default" : "destructive"}>
                      {cred.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p><strong>Tipo:</strong> {cred.type}</p>
                    <p><strong>Cadastrado em:</strong> 01/01/2025</p>
                    <p><strong>Último uso:</strong> 15/01/2025</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Edit className="w-4 h-4" />
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

export default Senhas;
