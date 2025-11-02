#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read --allow-write --allow-run

/**
 * Script Master para testar todas as APIs
 *
 * Para executar:
 * deno run --allow-env --allow-net --allow-read --allow-write --allow-run test-all-apis.ts
 */

console.log('\n' + '='.repeat(70));
console.log('🚀 TESTE COMPLETO DE APIS - JusMonitor');
console.log('='.repeat(70));
console.log('\nTestando APIs: JUDiT e Escavador');
console.log('Data/Hora:', new Date().toLocaleString('pt-BR'));

// Verificar se as chaves estão configuradas
const JUDIT_API_KEY = Deno.env.get('JUDIT_API_KEY');
const ESCAVADOR_API_KEY = Deno.env.get('ESCAVADOR_API_KEY');

console.log('\n📋 Verificando configuração de secrets:');
console.log(`   JUDIT_API_KEY: ${JUDIT_API_KEY ? '✅ Configurada' : '❌ Não configurada'}`);
console.log(`   ESCAVADOR_API_KEY: ${ESCAVADOR_API_KEY ? '✅ Configurada' : '❌ Não configurada'}`);

if (!JUDIT_API_KEY && !ESCAVADOR_API_KEY) {
  console.error('\n❌ Nenhuma API key configurada!');
  console.log('\nConfigure as variáveis de ambiente:');
  console.log('   export JUDIT_API_KEY=sua-chave-judit');
  console.log('   export ESCAVADOR_API_KEY=sua-chave-escavador');
  Deno.exit(1);
}

// Executar testes
const startTime = Date.now();
const testResults: any[] = [];

// Teste JUDiT
if (JUDIT_API_KEY) {
  console.log('\n\n' + '='.repeat(70));
  console.log('🔍 TESTANDO API JUDIT');
  console.log('='.repeat(70));

  try {
    const command = new Deno.Command('deno', {
      args: ['run', '--allow-env', '--allow-net', 'test-judit-api.ts'],
      stdout: 'inherit',
      stderr: 'inherit',
    });

    const { success } = await command.output();
    testResults.push({
      api: 'JUDiT',
      success,
      timestamp: new Date().toISOString()
    });

    if (!success) {
      console.error('❌ Erro ao executar testes da API JUDiT');
    }
  } catch (error) {
    console.error('❌ Erro ao executar testes da API JUDiT:', error.message);
    testResults.push({
      api: 'JUDiT',
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
} else {
  console.log('\n⚠️  Pulando testes da API JUDiT (chave não configurada)');
}

// Teste Escavador
if (ESCAVADOR_API_KEY) {
  console.log('\n\n' + '='.repeat(70));
  console.log('🔍 TESTANDO API ESCAVADOR');
  console.log('='.repeat(70));

  try {
    const command = new Deno.Command('deno', {
      args: ['run', '--allow-env', '--allow-net', 'test-escavador-api.ts'],
      stdout: 'inherit',
      stderr: 'inherit',
    });

    const { success } = await command.output();
    testResults.push({
      api: 'Escavador',
      success,
      timestamp: new Date().toISOString()
    });

    if (!success) {
      console.error('❌ Erro ao executar testes da API Escavador');
    }
  } catch (error) {
    console.error('❌ Erro ao executar testes da API Escavador:', error.message);
    testResults.push({
      api: 'Escavador',
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
} else {
  console.log('\n⚠️  Pulando testes da API Escavador (chave não configurada)');
}

// Resumo final
const totalTime = Date.now() - startTime;
console.log('\n\n' + '='.repeat(70));
console.log('📊 RESUMO GERAL');
console.log('='.repeat(70));

testResults.forEach(result => {
  const status = result.success ? '✅' : '❌';
  console.log(`\n${status} ${result.api}`);
  if (result.error) {
    console.log(`   Erro: ${result.error}`);
  }
});

console.log(`\n⏱️  Tempo total de execução: ${(totalTime / 1000).toFixed(2)}s`);

// Procurar arquivos de resultados JSON
console.log('\n📁 Arquivos de resultados gerados:');

try {
  for await (const entry of Deno.readDir('.')) {
    if (entry.isFile && entry.name.startsWith('test-results-')) {
      console.log(`   - ${entry.name}`);
    }
  }
} catch (error) {
  console.error('   Erro ao listar arquivos:', error.message);
}

console.log('\n' + '='.repeat(70));
console.log('🏁 TESTES CONCLUÍDOS!');
console.log('='.repeat(70) + '\n');

// Sair com código de erro se algum teste falhou
const allSuccess = testResults.every(r => r.success);
Deno.exit(allSuccess ? 0 : 1);
