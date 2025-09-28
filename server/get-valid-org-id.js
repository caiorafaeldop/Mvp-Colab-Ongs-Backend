const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getValidOrgId() {
  try {
    console.log('🔍 Buscando organizações válidas...');
    
    const organizations = await prisma.user.findMany({
      where: {
        userType: 'organization'
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    if (organizations.length === 0) {
      console.log('❌ Nenhuma organização encontrada. Execute o seed primeiro:');
      console.log('npm run db:seed');
      return;
    }

    console.log('✅ Organizações encontradas:');
    organizations.forEach((org, index) => {
      console.log(`${index + 1}. ID: ${org.id}`);
      console.log(`   Nome: ${org.name}`);
      console.log(`   Email: ${org.email}`);
      console.log('');
    });

    console.log('🎯 Use um desses IDs nos seus testes!');
    console.log(`Exemplo: "${organizations[0].id}"`);

  } catch (error) {
    console.error('❌ Erro ao buscar organizações:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

getValidOrgId();
