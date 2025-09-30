/**
 * Script para verificar uso consistente dos Singletons no projeto
 * Valida que todas as instâncias são obtidas via getInstance()
 */

const fs = require('fs');
const path = require('path');

const singletons = [
  'DatabaseConnection',
  'PrismaService',
  'ConfigManager',
  'Logger'
];

const directories = [
  'src/application',
  'src/presentation',
  'src/infra/repositories',
  'src/infra/events',
  'src/main'
];

const issues = {
  directInstantiation: [],
  missingGetInstance: [],
  inconsistentUsage: [],
  goodPatterns: []
};

function scanDirectory(dir) {
  const fullPath = path.join(__dirname, '..', dir);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Diretório não encontrado: ${dir}`);
    return;
  }

  const files = fs.readdirSync(fullPath, { withFileTypes: true });

  files.forEach(file => {
    if (file.isDirectory()) {
      scanDirectory(path.join(dir, file.name));
    } else if (file.name.endsWith('.js')) {
      scanFile(path.join(dir, file.name));
    }
  });
}

function scanFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  const content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n');

  singletons.forEach(singleton => {
    // Verificar import/require do singleton
    const hasImport = content.includes(`require('./${singleton}')`) ||
                      content.includes(`require('../${singleton}')`) ||
                      content.includes(`require('../../${singleton}')`) ||
                      content.includes(`require('../../../${singleton}')`);

    if (!hasImport) return;

    // Verificar uso correto: getInstance()
    const hasGetInstance = content.includes(`${singleton}.getInstance()`);
    
    // Verificar instanciação direta (ERRADO)
    const hasDirectInstantiation = content.match(new RegExp(`new\\s+${singleton}\\s*\\(`, 'g'));
    
    if (hasDirectInstantiation) {
      hasDirectInstantiation.forEach(() => {
        issues.directInstantiation.push({
          file: filePath,
          singleton,
          issue: `Instanciação direta com 'new ${singleton}()' detectada`
        });
      });
    }

    if (hasImport && !hasGetInstance && !hasDirectInstantiation) {
      issues.missingGetInstance.push({
        file: filePath,
        singleton,
        issue: `Singleton importado mas getInstance() não encontrado`
      });
    }

    if (hasGetInstance && !hasDirectInstantiation) {
      issues.goodPatterns.push({
        file: filePath,
        singleton,
        pattern: `Uso correto com ${singleton}.getInstance()`
      });
    }

    // Verificar inconsistências (múltiplas formas de obter instância)
    const getInstanceCount = (content.match(new RegExp(`${singleton}\\.getInstance\\(\\)`, 'g')) || []).length;
    if (getInstanceCount > 3) {
      // Muitas chamadas a getInstance() podem indicar que deveria cachear a instância
      issues.inconsistentUsage.push({
        file: filePath,
        singleton,
        count: getInstanceCount,
        suggestion: 'Considere cachear a instância no início do arquivo'
      });
    }
  });
}

console.log('🔍 Verificando uso de Singletons no projeto...\n');

directories.forEach(dir => {
  console.log(`📁 Escaneando: ${dir}`);
  scanDirectory(dir);
});

console.log('\n' + '='.repeat(80));
console.log('📊 RELATÓRIO DE USO DE SINGLETONS');
console.log('='.repeat(80) + '\n');

// Instanciações diretas (CRÍTICO)
if (issues.directInstantiation.length > 0) {
  console.log('❌ CRÍTICO - Instanciação Direta Detectada:');
  console.log('   (Singleton não deve ser instanciado com "new")\n');
  issues.directInstantiation.forEach(issue => {
    console.log(`   📄 ${issue.file}`);
    console.log(`      Problema: ${issue.issue}`);
    console.log(`      Correção: Use ${issue.singleton}.getInstance()\n`);
  });
} else {
  console.log('✅ Nenhuma instanciação direta detectada\n');
}

// getInstance() ausente
if (issues.missingGetInstance.length > 0) {
  console.log('⚠️  AVISO - getInstance() Não Encontrado:');
  console.log('   (Singleton importado mas não usado corretamente)\n');
  issues.missingGetInstance.forEach(issue => {
    console.log(`   📄 ${issue.file}`);
    console.log(`      Singleton: ${issue.singleton}`);
    console.log(`      Problema: ${issue.issue}\n`);
  });
} else {
  console.log('✅ Todos os singletons importados usam getInstance()\n');
}

// Uso inconsistente
if (issues.inconsistentUsage.length > 0) {
  console.log('💡 SUGESTÃO - Otimização de Uso:\n');
  issues.inconsistentUsage.forEach(issue => {
    console.log(`   📄 ${issue.file}`);
    console.log(`      Singleton: ${issue.singleton}`);
    console.log(`      Chamadas getInstance(): ${issue.count}x`);
    console.log(`      Sugestão: ${issue.suggestion}\n`);
  });
}

// Padrões corretos
console.log(`✅ Uso Correto Detectado: ${issues.goodPatterns.length} ocorrências\n`);

// Estatísticas
console.log('='.repeat(80));
console.log('📈 ESTATÍSTICAS\n');

singletons.forEach(singleton => {
  const usages = issues.goodPatterns.filter(p => p.singleton === singleton).length;
  const problems = [
    ...issues.directInstantiation.filter(i => i.singleton === singleton),
    ...issues.missingGetInstance.filter(i => i.singleton === singleton)
  ].length;

  console.log(`   ${singleton}:`);
  console.log(`      ✅ Usos corretos: ${usages}`);
  console.log(`      ❌ Problemas: ${problems}`);
});

console.log('\n' + '='.repeat(80));

// Resultado final
const totalProblems = issues.directInstantiation.length + issues.missingGetInstance.length;
const totalGood = issues.goodPatterns.length;

if (totalProblems === 0) {
  console.log('🎉 RESULTADO: Todos os Singletons estão sendo usados corretamente!');
  console.log(`   ${totalGood} usos corretos detectados`);
  console.log('   Nota de Consistência: 10/10');
} else {
  const score = Math.max(0, 10 - (totalProblems * 0.5));
  console.log('⚠️  RESULTADO: Problemas detectados no uso de Singletons');
  console.log(`   ${totalProblems} problema(s) encontrado(s)`);
  console.log(`   ${totalGood} usos corretos`);
  console.log(`   Nota de Consistência: ${score.toFixed(1)}/10`);
}

console.log('='.repeat(80) + '\n');

// Exit code
process.exit(totalProblems > 0 ? 1 : 0);
