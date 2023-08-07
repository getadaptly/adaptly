/*
  Warnings:

  - A unique constraint covering the columns `[repository_id,pull_request_id,dependency_name]` on the table `dependency_update` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `repository_id` to the `dependency_update` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "dependency_update" ADD COLUMN     "repository_id" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "dependency_update_repository_id_pull_request_id_dependency__key" ON "dependency_update"("repository_id", "pull_request_id", "dependency_name");

-- AddForeignKey
ALTER TABLE "dependency_update" ADD CONSTRAINT "dependency_update_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;
