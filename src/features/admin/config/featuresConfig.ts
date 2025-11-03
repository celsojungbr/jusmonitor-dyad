import { Feature } from '../types/feature.types'

export const FEATURES_CONFIG: Feature[] = [
  {
    id: 'busca-processual-cpf-cnpj',
    name: 'Busca Processual por CPF/CNPJ',
    description: 'Permite buscar processos judiciais utilizando CPF ou CNPJ',
    functions: [
      {
        functionName: 'escavador_consulta_CPF_CNPJ',
        displayName: 'Escavador - Consulta CPF/CNPJ',
        availableProviders: [
          { name: 'escavador', displayName: 'Escavador' }
        ]
      },
      {
        functionName: 'judit-search-document',
        displayName: 'JUDiT - Consulta por Documento',
        availableProviders: [
          { name: 'judit', displayName: 'JUDiT' }
        ]
      },
      {
        functionName: 'judit_consulta_hot_storage',
        displayName: 'JUDiT - Hot Storage (Datalake)',
        availableProviders: [
          { name: 'judit', displayName: 'JUDiT Hot Storage' }
        ]
      }
    ]
  }
  // Mais features serão adicionadas no futuro
]
