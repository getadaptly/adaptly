/*
  Warnings:

  - Added the required column `dependency_repo_url` to the `dependency_update` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dependency_url` to the `dependency_update` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "dependency_update" ADD COLUMN     "dependency_repo_url" TEXT NOT NULL,
ADD COLUMN     "dependency_url" TEXT NOT NULL;
