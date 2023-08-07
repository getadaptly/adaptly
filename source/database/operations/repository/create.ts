import { prisma } from '@adaptly/database/prisma';
import Logger from '@adaptly/logging/logger';
import { getRepositoryOwnerAndName } from '@adaptly/services/github/utils/repository';
import { Repository } from '@prisma/client';

export async function createRepository(fullName: string): Promise<Repository> {
    const [owner, name] = getRepositoryOwnerAndName(fullName);

    const existing = await prisma.repository.findUnique({
        where: {
            fullName
        }
    });

    if (existing) {
        return existing;
    }

    const repository = await prisma.repository.create({
        data: {
            owner,
            name,
            fullName
        }
    });

    Logger.info('Created a new repository in database', { repository });

    return repository;
}
