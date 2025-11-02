import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Eye, Bell } from "lucide-react";

const Consultas = () => {
  const [searchType, setSearchType] = useState("cpf");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Consultas</h1>
        <p className="text-muted-foreground">
          Pesquise processos judiciais por CPF, CNPJ, OAB ou número CNJ
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova Consulta</CardTitle>
          <CardDescription>
            Selecione o tipo de busca e insira os dados para consultar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Busca</Label>
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpf">CPF</SelectItem>
                  <SelectItem value="cnpj">CNPJ</SelectItem>
                  <SelectItem value="oab">OAB</SelectItem>
                  <SelectItem value="cnj">Número CNJ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="md:col-span-2 space-y-2">
              <Label>Identificador</Label>
              <Input 
                placeholder={
                  searchType === "cpf" ? "000.000.000-00" :
                  searchType === "cnpj" ? "00.000.000/0000-00" :
                  searchType === "oab" ? "SP123456" :
                  "0000000-00.0000.0.00.0000"
                }
              />
            </div>
            
            <div className="flex items-end">
              <Button className="w-full">
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold mb-4">Resultados da Busca</h2>
        
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <Card key={item} className="hover:border-primary transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">
                        Processo nº 0000000-00.2024.8.26.0000
                      </h3>
                      <Badge variant="outline">TJ-SP</Badge>
                      <Badge>Ativo</Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p><strong>Autor:</strong> João da Silva</p>
                      <p><strong>Réu:</strong> Empresa XYZ Ltda</p>
                      <p><strong>Distribuição:</strong> 15/01/2024</p>
                      <p><strong>Tribunal:</strong> Tribunal de Justiça de São Paulo</p>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Badge variant="secondary">
                        <Bell className="w-3 h-3 mr-1" />
                        Monitorado
                      </Badge>
                      <Badge variant="secondary">3 anexos</Badge>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalhes
                    </Button>
                    <Button size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Baixar Autos
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Consultas;
