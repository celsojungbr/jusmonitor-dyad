#!/usr/bin/env -S deno run --allow-env --allow-net

/**
 * Script de teste para API JUDiT
 *
 * Para executar:
 * deno run --allow-env --allow-net test-judit-api.ts
 *
 * Ou com API key direto:
 * JUDIT_API_KEY=sua-chave deno run --allow-env --allow-net test-judit-api.ts
 */

const JUDIT_API_KEY = Deno.env.get('JUDIT_API_KEY');
const JUDIT_BASE_URL = 'https://api.judit.io';

if (!JUDIT_API_KEY) {
  console.error('❌ JUDIT_API_KEY não encontrada nas variáveis de ambiente');
  console.log('Configure com: export JUDIT_API_KEY=sua-chave');
  Deno.exit(1);
}

console.log('🔍 Testando API JUDiT');
console.log('=' .repeat(60));
console.log(`Base URL: ${JUDIT_BASE_URL}`);
console.log(`API Key: ${JUDIT_API_KEY.substring(0, 10)}...`);
console.log('=' .repeat(60));

interface TestResult {
  test: string;
  success: boolean;
  status?: number;
  data?: any;
  error?: string;
  latency?: number;
}

const results: TestResult[] = [];

async function testEndpoint(
  name: string,
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<TestResult> {
  console.log(`\n📡 Testando: ${name}`);
  console.log(`   Endpoint: ${method} ${endpoint}`);

  const startTime = Date.now();

  try {
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${JUDIT_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
      console.log(`   Body: ${JSON.stringify(body, null, 2)}`);
    }

    const response = await fetch(`${JUDIT_BASE_URL}${endpoint}`, options);
    const latency = Date.now() - startTime;

    let data: any;
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { raw: text };
    }

    const result: TestResult = {
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

    const result: TestResult = {
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

// Teste 1: Health Check (pode não existir)
await testEndpoint(
  'Health Check',
  '/v1/health',
  'GET'
);

// Teste 2: Busca por CPF (endpoint corrigido)
await testEndpoint(
  'Busca por Documento (CPF)',
  '/v1/requests/request-document',
  'POST',
  {
    document: '12345678900', // CPF de teste
    document_type: 'CPF',
    cache: true
  }
);

// Teste 3: Busca por CNPJ
await testEndpoint(
  'Busca por Documento (CNPJ)',
  '/v1/requests/request-document',
  'POST',
  {
    document: '12345678000190', // CNPJ de teste
    document_type: 'CNPJ',
    cache: true
  }
);

// Teste 4: Busca por CNJ
await testEndpoint(
  'Busca por CNJ',
  '/v1/requests/requests',
  'POST',
  {
    cnj_number: '0000000-00.0000.0.00.0000', // CNJ de teste
    cache: true,
    include_movements: true
  }
);

// Teste 5: Busca por Nome
await testEndpoint(
  'Busca por Nome',
  '/v1/requests/name',
  'POST',
  {
    name: 'João Silva',
    cache: true
  }
);

// Teste 6: Dados Cadastrais
await testEndpoint(
  'Dados Cadastrais',
  '/v1/registration-data/registration-data',
  'POST',
  {
    document: '12345678900',
    document_type: 'CPF'
  }
);

// Teste 7: Tracking (Monitoramento)
await testEndpoint(
  'Criar Tracking',
  '/v1/tracking/tracking',
  'POST',
  {
    document: '12345678900',
    document_type: 'CPF',
    callback_url: 'https://exemplo.com/callback'
  }
);

// Teste 8: Consulta Penal - Mandados
await testEndpoint(
  'Consulta Penal - Mandados',
  '/v1/criminal-consultation/warrant',
  'POST',
  {
    document: '12345678900',
    document_type: 'CPF'
  }
);

// Teste 9: Consumo de Créditos
await testEndpoint(
  'Consumo de Créditos',
  '/v1/resource/consumption',
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
  api: 'JUDiT',
  baseUrl: JUDIT_BASE_URL,
  summary: {
    total: totalTests,
    success: successTests,
    failed: failedTests,
    successRate: ((successTests / totalTests) * 100).toFixed(1) + '%'
  },
  tests: results
};

const filename = `test-results-judit-${Date.now()}.json`;
await Deno.writeTextFile(filename, JSON.stringify(resultsJson, null, 2));
console.log(`💾 Resultados salvos em: ${filename}\n`);
