#!/usr/bin/env node

/**
 * Script de teste para API Escavador (Node.js)
 *
 * Para executar:
 * node test-escavador-api.mjs
 *
 * Ou com API key direto:
 * ESCAVADOR_API_KEY=sua-chave node test-escavador-api.mjs
 */

import { writeFile } from 'fs/promises';

const ESCAVADOR_API_KEY = process.env.ESCAVADOR_API_KEY;
const ESCAVADOR_BASE_URL = 'https://api.escavador.com';

if (!ESCAVADOR_API_KEY) {
  console.error('❌ ESCAVADOR_API_KEY não encontrada nas variáveis de ambiente');
  console.log('Configure com: export ESCAVADOR_API_KEY=sua-chave');
  process.exit(1);
}

console.log('🔍 Testando API Escavador');
console.log('=' .repeat(60));
console.log(`Base URL: ${ESCAVADOR_BASE_URL}`);
console.log(`API Key: ${ESCAVADOR_API_KEY.substring(0, 10)}...`);
console.log('='.repeat(60));

const results = [];

async function testEndpoint(name, endpoint, method = 'GET', body = null) {
  console.log(`\n📡 Testando: ${name}`);
  console.log(`   Endpoint: ${method} ${endpoint}`);

  const startTime = Date.now();

  try {
    const options = {
      method,
      headers: {
        'Authorization': `Token ${ESCAVADOR_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
      console.log(`   Body: ${JSON.stringify(body, null, 2)}`);
    }

    const response = await fetch(`${ESCAVADOR_BASE_URL}${endpoint}`, options);
    const latency = Date.now() - startTime;

    let data;
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { raw: text };
    }

    const result = {
      test: name,
      success: response.ok,
      status: response.status,
      data,
      latency,
    };

    if (response.ok) {
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   ⏱️  Latência: ${latency}ms`);
      console.log(`   📦 Resposta:`, JSON.stringify(data, null, 2).substring(0, 200));
    } else {
      console.log(`   ❌ Status: ${response.status}`);
      console.log(`   ❌ Erro:`, JSON.stringify(data, null, 2));
      result.error = JSON.stringify(data);
    }

    results.push(result);
    return result;

  } catch (error) {
    const latency = Date.now() - startTime;
    console.log(`   ❌ Erro de rede: ${error.message}`);

    const result = {
      test: name,
      success: false,
      error: error.message,
      latency,
    };

    results.push(result);
    return result;
  }
}

// ===== TESTES =====

console.log('\n\n🧪 INICIANDO TESTES\n');

// Teste 1: Saldo (verifica se API está funcionando)
await testEndpoint(
  'Consultar Saldo',
  '/v1/saldo',
  'GET'
);

// Teste 2: Busca Geral
await testEndpoint(
  'Busca Geral',
  '/v1/busca',
  'POST',
  {
    q: 'João Silva'
  }
);

// Teste 3: Pesquisa por CPF/CNPJ
await testEndpoint(
  'Pesquisa por CPF',
  '/v1/pesquisas/cpf-cnpj',
  'POST',
  {
    cpf_cnpj: '12345678900'
  }
);

// Teste 4: Pesquisa por OAB
await testEndpoint(
  'Pesquisa por OAB',
  '/v1/pesquisas/oab',
  'POST',
  {
    oab: '123456',
    uf: 'SP'
  }
);

// Teste 5: Pesquisa por Processo (Assíncrona)
await testEndpoint(
  'Pesquisa por Processo (Assíncrona)',
  '/v1/pesquisas/processo',
  'POST',
  {
    numero_processo: '0000000-00.0000.0.00.0000'
  }
);

// Teste 6: Listar Tribunais
await testEndpoint(
  'Listar Tribunais',
  '/v1/tribunais',
  'GET'
);

// Teste 7: Busca Assíncrona
await testEndpoint(
  'Busca Assíncrona',
  '/v1/busca-assincrona',
  'POST',
  {
    q: 'João Silva',
    tipo: 'pessoa'
  }
);

// Teste 8: Callbacks configurados
await testEndpoint(
  'Listar Callbacks',
  '/v1/callbacks',
  'GET'
);

// Teste 9: Monitoramentos ativos
await testEndpoint(
  'Listar Monitoramentos',
  '/v1/monitoramentos',
  'GET'
);

// Teste 10: Diários Oficiais - Origens
await testEndpoint(
  'Diários Oficiais - Origens',
  '/v1/diarios-oficiais/origens',
  'GET'
);

// ===== RESUMO =====

console.log('\n\n' + '='.repeat(60));
console.log('📊 RESUMO DOS TESTES');
console.log('='.repeat(60));

const totalTests = results.length;
const successTests = results.filter(r => r.success).length;
const failedTests = totalTests - successTests;

console.log(`\nTotal de testes: ${totalTests}`);
console.log(`✅ Sucessos: ${successTests}`);
console.log(`❌ Falhas: ${failedTests}`);
console.log(`📈 Taxa de sucesso: ${((successTests / totalTests) * 100).toFixed(1)}%`);

if (successTests > 0) {
  const avgLatency = results
    .filter(r => r.success && r.latency)
    .reduce((acc, r) => acc + (r.latency || 0), 0) / successTests;
  console.log(`⏱️  Latência média: ${avgLatency.toFixed(0)}ms`);
}

console.log('\n\n📋 DETALHES POR TESTE:');
console.log('-'.repeat(60));

results.forEach(result => {
  const status = result.success ? '✅' : '❌';
  const latency = result.latency ? `${result.latency}ms` : 'N/A';
  const statusCode = result.status ? `HTTP ${result.status}` : 'Sem resposta';

  console.log(`\n${status} ${result.test}`);
  console.log(`   Status: ${statusCode}`);
  console.log(`   Latência: ${latency}`);

  if (!result.success && result.error) {
    console.log(`   Erro: ${result.error.substring(0, 100)}`);
  }
});

console.log('\n' + '='.repeat(60));
console.log('🏁 Testes concluídos!');
console.log('='.repeat(60) + '\n');

// Salvar resultados em JSON
const resultsJson = {
  timestamp: new Date().toISOString(),
  api: 'Escavador',
  baseUrl: ESCAVADOR_BASE_URL,
  summary: {
    total: totalTests,
    success: successTests,
    failed: failedTests,
    successRate: ((successTests / totalTests) * 100).toFixed(1) + '%'
  },
  tests: results
};

const filename = `test-results-escavador-${Date.now()}.json`;
await writeFile(filename, JSON.stringify(resultsJson, null, 2));
console.log(`💾 Resultados salvos em: ${filename}\n`);
