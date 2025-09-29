/**
 * Script para corrigir duplicatas na collection de donations
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ong-marketplace';

async function fixDonationsDuplicates() {
  try {
    console.log('🔧 Conectando ao MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('donations');

    // 1. Verificar documentos com mercadoPagoId null
    console.log('\n📊 Verificando documentos com mercadoPagoId null...');
    const nullCount = await collection.countDocuments({ mercadoPagoId: null });
    console.log(`Encontrados ${nullCount} documentos com mercadoPagoId: null`);

    if (nullCount > 1) {
      console.log('\n🧹 Removendo documentos duplicados...');
      
      // Manter apenas o mais recente e deletar os outros
      const duplicates = await collection.find({ mercadoPagoId: null })
        .sort({ createdAt: -1 })
        .skip(1)
        .toArray();
      
      console.log(`Removendo ${duplicates.length} documentos duplicados...`);
      
      for (const doc of duplicates) {
        await collection.deleteOne({ _id: doc._id });
        console.log(`✅ Removido documento: ${doc._id}`);
      }
    }

    // 2. Verificar e remover índice único problemático se existir
    console.log('\n🔍 Verificando índices...');
    const indexes = await collection.indexes();
    
    const problematicIndex = indexes.find(idx => 
      idx.name === 'donations_mercadoPagoId_key' || 
      (idx.key && idx.key.mercadoPagoId && idx.unique)
    );

    if (problematicIndex) {
      console.log('🗑️ Removendo índice único problemático...');
      await collection.dropIndex(problematicIndex.name);
      console.log('✅ Índice removido');
    }

    // 3. Criar índice sparse (permite múltiplos nulls)
    console.log('\n📝 Criando índice sparse para mercadoPagoId...');
    await collection.createIndex(
      { mercadoPagoId: 1 }, 
      { 
        unique: true, 
        sparse: true,
        name: 'mercadoPagoId_sparse_unique'
      }
    );
    console.log('✅ Índice sparse criado');

    console.log('\n🎉 Correção finalizada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  fixDonationsDuplicates();
}

module.exports = { fixDonationsDuplicates };
