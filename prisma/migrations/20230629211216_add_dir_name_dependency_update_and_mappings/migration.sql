/*
  Warnings:

  - You are about to drop the column `currentVersion` on the `dependency_update` table. All the data in the column will be lost.
  - You are about to drop the column `cursorVersion` on the `dependency_update` table. All the data in the column will be lost.
  - You are about to drop the column `dependencyName` on the `dependency_update` table. All the data in the column will be lost.
  - You are about to drop the column `intermediaryVersions` on the `dependency_update` table. All the data in the column will be lost.
  - You are about to drop the column `pullRequestId` on the `dependency_update` table. All the data in the column will be lost.
  - You are about to drop the column `targetVersion` on the `dependency_update` table. All the data in the column will be lost.
  - You are about to drop the column `mergedAt` on the `pull_request` table. All the data in the column will be lost.
  - You are about to drop the column `repositoryId` on the `pull_request` table. All the data in the column will be lost.
  - Added the required column `current_version` to the `dependency_update` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cursor_version` to the `dependency_update` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dependency_name` to the `dependency_update` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dir_name` to the `dependency_update` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pull_request_id` to the `dependency_update` table without a default value. This is not possible if the table is not empty.
  - Added the required column `target_version` to the `dependency_update` table without a default value. This is not possible if the table is not empty.
  - Added the required column `repository_id` to the `pull_request` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "dependency_update" DROP CONSTRAINT "dependency_update_pullRequestId_fkey";

-- DropForeignKey
ALTER TABLE "pull_request" DROP CONSTRAINT "pull_request_repositoryId_fkey";

-- AlterTable
ALTER TABLE "dependency_update" DROP COLUMN "currentVersion",
DROP COLUMN "cursorVersion",
DROP COLUMN "dependencyName",
DROP COLUMN "intermediaryVersions",
DROP COLUMN "pullRequestId",
DROP COLUMN "targetVersion",
ADD COLUMN     "current_version" TEXT NOT NULL,
ADD COLUMN     "cursor_version" TEXT NOT NULL,
ADD COLUMN     "dependency_name" TEXT NOT NULL,
ADD COLUMN     "dir_name" TEXT NOT NULL,
ADD COLUMN     "intermediary_versions" TEXT[],
ADD COLUMN     "pull_request_id" INTEGER NOT NULL,
ADD COLUMN     "target_version" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "pull_request" DROP COLUMN "mergedAt",
DROP COLUMN "repositoryId",
ADD COLUMN     "merged_at" TIMESTAMP(3),
ADD COLUMN     "repository_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "pull_request" ADD CONSTRAINT "pull_request_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repository"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dependency_update" ADD CONSTRAINT "dependency_update_pull_request_id_fkey" FOREIGN KEY ("pull_request_id") REFERENCES "pull_request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
