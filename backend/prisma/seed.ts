import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Dados iniciais mínimos para rodar o sistema em desenvolvimento: sócio-diretor,
// categorias padrão e configuração geral. Nunca versiona senha real — usa senha
// de desenvolvimento, documentada apenas neste arquivo.
async function main() {
  const passwordHash = await bcrypt.hash('kalibaba123', 12);

  const diretorSocio = await prisma.socio.upsert({
    where: { email: 'diretor@kalibaba.local' },
    update: {},
    create: {
      name: 'Diretor Kalibaba',
      email: 'diretor@kalibaba.local',
      defaultPosition: 'LINHA',
    },
  });

  await prisma.user.upsert({
    where: { email: 'diretor@kalibaba.local' },
    update: {},
    create: {
      email: 'diretor@kalibaba.local',
      passwordHash,
      role: 'DIRETOR',
      socioId: diretorSocio.id,
    },
  });

  await prisma.systemConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      defaultMonthlyFee: 110,
      defaultGuestFee: 30,
      currentSeason: new Date().getFullYear(),
    },
  });

  const expenseCategories = ['Arbitragem', 'Aluguel de quadra', 'Bolas e materiais', 'Confraternização'];
  for (const name of expenseCategories) {
    await prisma.expenseCategory.upsert({ where: { name }, update: {}, create: { name } });
  }

  const revenueCategoriesSystem = ['Mensalidades de sócios', 'Convidados'];
  for (const name of revenueCategoriesSystem) {
    await prisma.revenueCategory.upsert({ where: { name }, update: {}, create: { name, isSystem: true } });
  }

  const revenueCategoriesOther = ['Rifa', 'Rendimentos'];
  for (const name of revenueCategoriesOther) {
    await prisma.revenueCategory.upsert({ where: { name }, update: {}, create: { name, isSystem: false } });
  }

  // eslint-disable-next-line no-console
  console.log('Seed concluído. Login de desenvolvimento: diretor@kalibaba.local / kalibaba123');
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
