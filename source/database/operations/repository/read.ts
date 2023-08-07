import { prisma } from '@adaptly/database/prisma';
import { throwRepositoryNotFound } from '@adaptly/errors/shared';
import { Repository } from '@prisma/client';

export async function findRepository(fullName: string): Promise<Repository> {
    try {
        const repository = await prisma.repository.findUniqueOrThrow({
            where: {
                fullName
            }
        });

        return repository;
    } catch (error) {
        throwRepositoryNotFound(error, { fullName });
    }
}
