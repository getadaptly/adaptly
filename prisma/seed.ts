import Logger from '@adaptly/logging/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const owner = 'getadaptly';
    const name = 'playground';

    const repository = await prisma.repository.upsert({
        where: { fullName: `${owner}/${name}` },
        update: {},
        create: {
            owner,
            name,
            fullName: `${owner}/${name}`
        }
    });

    console.log('Set up repository', repository);
}

main()
    .then(async () => {
        Logger.info(`Prisma database seeding completed`);
        await prisma.$disconnect();
    })
    .catch(async (error) => {
        Logger.error(`Prisma database seeding failed`, error);
        await prisma.$disconnect();
        process.exit(1);
    });
