import { prisma } from '@adaptly/database/prisma';
import { throwRepositoryNotFound } from '@adaptly/errors/shared';
import { UserFeedback } from '@prisma/client';

export async function storeInDatabase(repositoryFullName: string, userFeedback: string): Promise<UserFeedback> {
    try {
        const repository = await prisma.repository.findUniqueOrThrow({
            where: {
                fullName: repositoryFullName
            }
        });

        const feedback = await prisma.userFeedback.create({
            data: {
                repositoryId: repository.id,
                feedback: userFeedback
            }
        });

        return feedback;
    } catch (error) {
        throwRepositoryNotFound(error, { fullName: repositoryFullName });
    }
}
