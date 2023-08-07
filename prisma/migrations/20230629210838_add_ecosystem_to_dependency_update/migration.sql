/*
  Warnings:

  - Added the required column `ecosystem` to the `dependency_update` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "dependency_update" ADD COLUMN     "ecosystem" TEXT NOT NULL;
