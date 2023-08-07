/*
  Warnings:

  - Added the required column `manifest_filename` to the `dependency_update` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "dependency_update" ADD COLUMN     "manifest_filename" TEXT NOT NULL;
