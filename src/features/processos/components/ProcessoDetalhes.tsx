import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Share2, Bell, Download, FileDown, Loader2 } from "lucide-react"
import { useProcessoDetalhes } from "../hooks/useProcessoDetalhes"

export const ProcessoDetalhes = () => {
  const { cnjNumber } = useParams<{ cnjNumber: string }>()
  const navigate = useNavigate()
  
  const {
    processo,
    movimentos,
    anexos,
    loading,
    capturandoAnexos,
    capturarAnexos,
    baixarPDF,
    monitorarProcesso
  } = useProcessoDetalhes(cnjNumber || "")

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!processo) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Processo não encontrado</h2>
        <p className="text-muted-foreground mb-4">
          O processo solicitado não existe ou não está disponível
        </p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>
    )
  }

  const autores = Array.isArray(processo.author_names) ? processo.author_names : []
  const reus = Array.isArray(processo.defendant_names) ? processo.defendant_names : []
  const partesCpfCnpj = Array.isArray(processo.parties_cpf_cnpj) ? processo.parties_cpf_cnpj : []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold mb-2">Detalhes do Processo</h1>
          <p className="text-muted-foreground">
            Processo nº {processo.cnj_number}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline"
            onClick={capturarAnexos}
            disabled={capturandoAnexos}
          >
            {capturandoAnexos ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4 mr-2" />
            )}
            Capturar Anexos
          </Button>
          <Button variant="outline" onClick={monitorarProcesso}>
            <Bell className="w-4 h-4 mr-2" />
            Monitorar
          </Button>
          <Button variant="outline">
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
          <Button onClick={baixarPDF}>
            <Download className="w-4 h-4 mr-2" />
            Baixar PDF
          </Button>
        </div>
      </div>

      <Tabs defaultValue="capa" className="w-full">
        <TabsList>
          <TabsTrigger value="capa">Capa Processual</TabsTrigger>
          <TabsTrigger value="movimentacoes">
            Movimentações
            {movimentos.length > 0 && (
              <Badge variant="secondary" className="ml-2">{movimentos.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="anexos">
            Anexos
            {anexos.length > 0 && (
              <Badge variant="secondary" className="ml-2">{anexos.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="capa" className="space-y-4 mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold mb-4 text-lg">Informações Gerais</h3>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Número CNJ:</dt>
                      <dd className="font-medium">{processo.cnj_number}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Tribunal:</dt>
                      <dd className="font-medium">{processo.tribunal}</dd>
                    </div>
                    {processo.distribution_date && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Distribuição:</dt>
                        <dd className="font-medium">
                          {new Date(processo.distribution_date).toLocaleDateString('pt-BR')}
                        </dd>
                      </div>
                    )}
                    {processo.status && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Status:</dt>
                        <dd><Badge>{processo.status}</Badge></dd>
                      </div>
                    )}
                    {processo.case_value && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Valor da Causa:</dt>
                        <dd className="font-medium">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(processo.case_value)}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div>
                  <h3 className="font-semibold mb-4 text-lg">Fase Processual</h3>
                  <dl className="space-y-3 text-sm">
                    {processo.phase && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Fase:</dt>
                        <dd className="font-medium">{processo.phase}</dd>
                      </div>
                    )}
                    {processo.judge_name && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Juiz:</dt>
                        <dd className="font-medium">{processo.judge_name}</dd>
                      </div>
                    )}
                    {processo.court_name && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Vara:</dt>
                        <dd className="font-medium">{processo.court_name}</dd>
                      </div>
                    )}
                    {processo.last_update && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Última Atualização:</dt>
                        <dd className="font-medium">
                          {new Date(processo.last_update).toLocaleDateString('pt-BR')}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold mb-4 text-lg">Polo Ativo</h3>
                  {autores.length > 0 ? (
                    <div className="space-y-3">
                      {autores.map((autor, index) => (
                        <div key={index} className="text-sm">
                          <div className="font-medium">{autor}</div>
                          {partesCpfCnpj[index] && (
                            <div className="text-muted-foreground">
                              {partesCpfCnpj[index].length === 11 ? 'CPF' : 'CNPJ'}: {partesCpfCnpj[index]}
                            </div>
                          )}
                          <div className="text-muted-foreground">Qualidade: Autor</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sem informações disponíveis</p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold mb-4 text-lg">Polo Passivo</h3>
                  {reus.length > 0 ? (
                    <div className="space-y-3">
                      {reus.map((reu, index) => (
                        <div key={index} className="text-sm">
                          <div className="font-medium">{reu}</div>
                          {partesCpfCnpj[autores.length + index] && (
                            <div className="text-muted-foreground">
                              {partesCpfCnpj[autores.length + index].length === 11 ? 'CPF' : 'CNPJ'}: {partesCpfCnpj[autores.length + index]}
                            </div>
                          )}
                          <div className="text-muted-foreground">Qualidade: Réu</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sem informações disponíveis</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movimentacoes" className="space-y-3 mt-6">
          {movimentos.length > 0 ? (
            movimentos.map((movimento) => (
              <Card key={movimento.id} className="animate-fade-in">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(movimento.movement_date).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{movimento.movement_type || 'Movimentação'}</h4>
                        {movimento.tribunal_source && (
                          <Badge variant="outline" className="text-xs">
                            {movimento.tribunal_source}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {movimento.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Nenhuma movimentação registrada</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="anexos" className="space-y-3 mt-6">
          {anexos.length > 0 ? (
            anexos.map((anexo) => (
              <Card key={anexo.id} className="hover:border-primary transition-colors animate-fade-in">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{anexo.attachment_name}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        {anexo.filing_date && (
                          <span>Juntado em {new Date(anexo.filing_date).toLocaleDateString('pt-BR')}</span>
                        )}
                        {anexo.attachment_type && (
                          <Badge variant="outline" className="text-xs">{anexo.attachment_type}</Badge>
                        )}
                        {anexo.file_size && (
                          <span>{(anexo.file_size / 1024).toFixed(2)} KB</span>
                        )}
                      </div>
                    </div>
                    <Button size="sm" disabled={!anexo.file_url}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                      {anexo.download_cost_credits && anexo.download_cost_credits > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {anexo.download_cost_credits} créditos
                        </Badge>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground mb-4">Nenhum anexo disponível</p>
                <Button variant="outline" onClick={capturarAnexos} disabled={capturandoAnexos}>
                  {capturandoAnexos ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FileDown className="w-4 h-4 mr-2" />
                  )}
                  Capturar Anexos dos Tribunais
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
