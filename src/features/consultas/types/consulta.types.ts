export type TipoConsulta = 'processual' | 'cadastral' | 'penal'

export type TipoIdentificador = 'cpf' | 'cnpj' | 'oab' | 'cnj'

export interface ConsultaProcessualData {
  tipoIdentificador: TipoIdentificador
  valor: string
}

export interface ConsultaCadastralData {
  tipoIdentificador: 'cpf' | 'cnpj'
  valor: string
}

export interface ConsultaPenalData {
  cpf: string
}

export interface Busca {
  id: string
  tipo: TipoConsulta
  tipoIdentificador?: TipoIdentificador | 'cpf' | 'cnpj'
  valor: string
  resultados: number
  data: Date
  loading?: boolean
  fromCache?: boolean
  creditsConsumed?: number
  apiUsed?: 'judit' | 'escavador'
}
