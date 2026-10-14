import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password_hash = await bcrypt.hash('demo12345', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@pletenie.local' },
    update: {},
    create: {
      name: 'Demo',
      email: 'demo@pletenie.local',
      password_hash,
      timezone: 'Europe/Moscow',
    },
  });

  const existingSpace = await prisma.space.findFirst({
    where: { owner_id: user.id, name: 'Личное' },
  });

  if (!existingSpace) {
    const space = await prisma.space.create({
      data: { owner_id: user.id, name: 'Личное' },
    });

    await prisma.source.create({
      data: { space_id: space.id, name: 'Мой календарь', color: '#5B5FEF' },
    });

    console.log(`Seeded user ${user.email} with space "${space.name}"`);
  } else {
    console.log(`User ${user.email} already seeded`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
