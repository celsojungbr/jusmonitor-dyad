#!/bin/bash

###############################################################################
# Script para executar testes de APIs - JusMonitor
#
# Uso:
#   ./run-tests.sh                    # Executar todos os testes
#   ./run-tests.sh judit              # Apenas JUDiT
#   ./run-tests.sh escavador          # Apenas Escavador
#   ./run-tests.sh help               # Mostrar ajuda
###############################################################################

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "======================================================================"
echo "🧪 TESTES DE APIS - JusMonitor"
echo "======================================================================"
echo ""

# Função de ajuda
show_help() {
    echo "Uso: $0 [opção]"
    echo ""
    echo "Opções:"
    echo "  (vazio)      Executar todos os testes"
    echo "  judit        Testar apenas API JUDiT"
    echo "  escavador    Testar apenas API Escavador"
    echo "  help         Mostrar esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0                    # Todos os testes"
    echo "  $0 judit              # Apenas JUDiT"
    echo "  $0 escavador          # Apenas Escavador"
    echo ""
    echo "IMPORTANTE:"
    echo "  As variáveis de ambiente JUDIT_API_KEY e ESCAVADOR_API_KEY"
    echo "  devem estar configuradas antes de executar os testes."
    echo ""
    echo "  export JUDIT_API_KEY=sua-chave"
    echo "  export ESCAVADOR_API_KEY=sua-chave"
    echo ""
}

# Verificar Node.js
check_node() {
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js não encontrado${NC}"
        echo "Instale Node.js 18+ para executar os testes"
        exit 1
    fi

    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo -e "${YELLOW}⚠️  Node.js versão $NODE_VERSION detectada${NC}"
        echo "Recomendado: Node.js 18 ou superior"
    else
        echo -e "${GREEN}✅ Node.js $(node --version) detectado${NC}"
    fi
}

# Verificar secrets
check_secrets() {
    local has_judit=false
    local has_escavador=false

    if [ -n "$JUDIT_API_KEY" ]; then
        echo -e "${GREEN}✅ JUDIT_API_KEY configurada${NC} (${JUDIT_API_KEY:0:10}...)"
        has_judit=true
    else
        echo -e "${YELLOW}⚠️  JUDIT_API_KEY não configurada${NC}"
    fi

    if [ -n "$ESCAVADOR_API_KEY" ]; then
        echo -e "${GREEN}✅ ESCAVADOR_API_KEY configurada${NC} (${ESCAVADOR_API_KEY:0:10}...)"
        has_escavador=true
    else
        echo -e "${YELLOW}⚠️  ESCAVADOR_API_KEY não configurada${NC}"
    fi

    if [ "$has_judit" = false ] && [ "$has_escavador" = false ]; then
        echo ""
        echo -e "${RED}❌ Nenhuma API key configurada!${NC}"
        echo ""
        echo "Configure as variáveis de ambiente:"
        echo "  export JUDIT_API_KEY=sua-chave-judit"
        echo "  export ESCAVADOR_API_KEY=sua-chave-escavador"
        echo ""
        echo "Ou crie um arquivo .env.local:"
        echo "  echo 'JUDIT_API_KEY=sua-chave' > .env.local"
        echo "  echo 'ESCAVADOR_API_KEY=sua-chave' >> .env.local"
        echo "  export \$(cat .env.local | xargs)"
        echo ""
        exit 1
    fi

    echo ""
}

# Executar teste JUDiT
test_judit() {
    if [ -z "$JUDIT_API_KEY" ]; then
        echo -e "${YELLOW}⚠️  Pulando testes JUDiT (chave não configurada)${NC}"
        return 0
    fi

    echo ""
    echo "======================================================================"
    echo -e "${BLUE}🔍 TESTANDO API JUDIT${NC}"
    echo "======================================================================"
    echo ""

    if node test-judit-api.mjs; then
        echo -e "${GREEN}✅ Testes JUDiT concluídos com sucesso${NC}"
        return 0
    else
        echo -e "${RED}❌ Testes JUDiT falharam${NC}"
        return 1
    fi
}

# Executar teste Escavador
test_escavador() {
    if [ -z "$ESCAVADOR_API_KEY" ]; then
        echo -e "${YELLOW}⚠️  Pulando testes Escavador (chave não configurada)${NC}"
        return 0
    fi

    echo ""
    echo "======================================================================"
    echo -e "${BLUE}🔍 TESTANDO API ESCAVADOR${NC}"
    echo "======================================================================"
    echo ""

    if node test-escavador-api.mjs; then
        echo -e "${GREEN}✅ Testes Escavador concluídos com sucesso${NC}"
        return 0
    else
        echo -e "${RED}❌ Testes Escavador falharam${NC}"
        return 1
    fi
}

# Mostrar resumo de arquivos gerados
show_results() {
    echo ""
    echo "======================================================================"
    echo "📁 ARQUIVOS DE RESULTADOS GERADOS"
    echo "======================================================================"
    echo ""

    if ls test-results-*.json 1> /dev/null 2>&1; then
        for file in test-results-*.json; do
            SIZE=$(du -h "$file" | cut -f1)
            echo "  📄 $file ($SIZE)"
        done

        echo ""
        echo "Para ver os resultados:"
        echo "  cat test-results-judit-*.json | jq ."
        echo "  cat test-results-escavador-*.json | jq ."
    else
        echo -e "${YELLOW}  Nenhum arquivo de resultado encontrado${NC}"
    fi

    echo ""
}

# Main
main() {
    case "${1:-all}" in
        help|-h|--help)
            show_help
            exit 0
            ;;
        judit)
            check_node
            check_secrets
            test_judit
            show_results
            ;;
        escavador)
            check_node
            check_secrets
            test_escavador
            show_results
            ;;
        all|*)
            check_node
            check_secrets

            START_TIME=$(date +%s)

            test_judit
            JUDIT_STATUS=$?

            test_escavador
            ESCAVADOR_STATUS=$?

            END_TIME=$(date +%s)
            DURATION=$((END_TIME - START_TIME))

            echo ""
            echo "======================================================================"
            echo "📊 RESUMO FINAL"
            echo "======================================================================"
            echo ""

            if [ $JUDIT_STATUS -eq 0 ]; then
                echo -e "${GREEN}✅ JUDiT${NC}"
            else
                echo -e "${RED}❌ JUDiT${NC}"
            fi

            if [ $ESCAVADOR_STATUS -eq 0 ]; then
                echo -e "${GREEN}✅ Escavador${NC}"
            else
                echo -e "${RED}❌ Escavador${NC}"
            fi

            echo ""
            echo "⏱️  Tempo total: ${DURATION}s"

            show_results

            echo "======================================================================"
            echo "🏁 TESTES CONCLUÍDOS!"
            echo "======================================================================"
            echo ""

            # Sair com erro se algum teste falhou
            if [ $JUDIT_STATUS -ne 0 ] || [ $ESCAVADOR_STATUS -ne 0 ]; then
                exit 1
            fi
            ;;
    esac
}

main "$@"
