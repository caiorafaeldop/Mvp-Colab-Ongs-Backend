/**
 * 🔧 Script para corrigir o DonationRepository
 * Substitui MongoDB por Prisma
 */

const fs = require('fs');
const path = require('path');

const factoryPath = path.join(__dirname, 'src/main/factories/RepositoryFactory.js');

// Ler o arquivo atual
let content = fs.readFileSync(factoryPath, 'utf8');

// Substituir a implementação do createDonationRepository
const newDonationMethod = `
  /**
   * Cria ou retorna instância existente do DonationRepository
   * @returns {PrismaDonationRepository}
   */
  createDonationRepository() {
    if (!this.repositories.has('donationRepository')) {
      console.log('[REPOSITORY FACTORY] Criando PrismaDonationRepository');
      
      const donationRepository = new PrismaDonationRepository();
      this.repositories.set('donationRepository', donationRepository);
      
      console.log('[REPOSITORY FACTORY] PrismaDonationRepository criado com sucesso');
    }

    return this.repositories.get('donationRepository');
  }
`;

// Encontrar e substituir o método createDonationRepository
const startPattern = /\/\*\*[\s\S]*?createDonationRepository\(\)\s*\{/;
const endPattern = /\s*return this\.repositories\.get\('donationRepository'\);\s*\}/;

// Encontrar início e fim do método
const startMatch = content.match(startPattern);
const endMatch = content.match(endPattern);

if (startMatch && endMatch) {
  const startIndex = startMatch.index;
  const endIndex = endMatch.index + endMatch[0].length;
  
  // Substituir o método
  const newContent = content.substring(0, startIndex) + newDonationMethod + content.substring(endIndex);
  
  // Salvar o arquivo
  fs.writeFileSync(factoryPath, newContent);
  
  console.log('✅ RepositoryFactory corrigido com sucesso!');
  console.log('🔄 PrismaDonationRepository configurado');
} else {
  console.log('❌ Não foi possível encontrar o método createDonationRepository');
}

console.log('🎯 Execute: npm run dev');
