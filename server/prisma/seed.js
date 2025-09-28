const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpar dados existentes (opcional - descomente se necessário)
  // await prisma.file.deleteMany();
  // await prisma.notification.deleteMany();
  // await prisma.collaboration.deleteMany();
  // await prisma.product.deleteMany();
  // await prisma.user.deleteMany();

  // Criar usuários de exemplo
  const hashedPassword = await bcrypt.hash('123456', 10);

  const commonUser = await prisma.user.create({
    data: {
      name: 'João Silva',
      email: 'joao@email.com',
      password: hashedPassword,
      userType: 'common',
      phone: '11999999999',
    },
  });

  const org1 = await prisma.user.create({
    data: {
      name: 'ONG Esperança',
      email: 'contato@ongesperanca.org',
      password: hashedPassword,
      userType: 'organization',
      phone: '11888888888',
    },
  });

  const org2 = await prisma.user.create({
    data: {
      name: 'Instituto Solidário',
      email: 'info@institutosolidario.org',
      password: hashedPassword,
      userType: 'organization',
      phone: '11777777777',
    },
  });

  console.log('✅ Usuários criados:', { commonUser: commonUser.id, org1: org1.id, org2: org2.id });

  // Criar produtos de exemplo
  const product1 = await prisma.product.create({
    data: {
      name: 'Cesta Básica Familiar',
      description: 'Cesta básica completa para uma família de 4 pessoas',
      price: 85.50,
      imageUrls: ['https://example.com/cesta1.jpg'],
      organizationId: org1.id,
      organizationName: org1.name,
      category: 'Alimentação',
      stock: 50,
    },
  });

  const product2 = await prisma.product.create({
    data: {
      name: 'Kit Escolar Completo',
      description: 'Kit com materiais escolares para crianças do ensino fundamental',
      price: 45.00,
      imageUrls: ['https://example.com/kit-escolar.jpg'],
      organizationId: org2.id,
      organizationName: org2.name,
      category: 'Educação',
      stock: 30,
    },
  });

  console.log('✅ Produtos criados:', { product1: product1.id, product2: product2.id });

  // Criar colaboração de exemplo
  const collaboration = await prisma.collaboration.create({
    data: {
      requesterOrgId: org1.id,
      requesterOrgName: org1.name,
      targetOrgId: org2.id,
      targetOrgName: org2.name,
      title: 'Parceria para Distribuição de Materiais Escolares',
      description: 'Proposta de parceria para distribuir kits escolares junto com as cestas básicas',
      status: 'pending',
    },
  });

  console.log('✅ Colaboração criada:', collaboration.id);

  // Criar notificações de exemplo
  const notification1 = await prisma.notification.create({
    data: {
      userId: org2.id,
      title: 'Nova Proposta de Colaboração',
      message: `A ${org1.name} enviou uma proposta de colaboração`,
      type: 'collaboration',
      relatedEntityId: collaboration.id,
      relatedEntityType: 'collaboration',
    },
  });

  const notification2 = await prisma.notification.create({
    data: {
      userId: commonUser.id,
      title: 'Bem-vindo ao Sistema!',
      message: 'Obrigado por se cadastrar em nossa plataforma de colaboração entre ONGs',
      type: 'success',
    },
  });

  console.log('✅ Notificações criadas:', { notification1: notification1.id, notification2: notification2.id });

  console.log('🎉 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
