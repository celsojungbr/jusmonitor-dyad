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
          // Futuramente: { name: 'judit', displayName: 'JUDiT' }
        ]
      }
    ]
  }
  // Mais features serão adicionadas no futuro
]
