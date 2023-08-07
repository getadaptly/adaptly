/*
  Warnings:

  - A unique constraint covering the columns `[repository_id,number]` on the table `pull_request` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "pull_request_repository_id_number_key" ON "pull_request"("repository_id", "number");
