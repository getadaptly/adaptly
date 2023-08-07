/*
  Warnings:

  - You are about to drop the `DependencyUpdate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PullRequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Repository` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DependencyUpdate" DROP CONSTRAINT "DependencyUpdate_pullRequestId_fkey";

-- DropForeignKey
ALTER TABLE "PullRequest" DROP CONSTRAINT "PullRequest_repositoryId_fkey";

-- DropTable
DROP TABLE "DependencyUpdate";

-- DropTable
DROP TABLE "PullRequest";

-- DropTable
DROP TABLE "Repository";

-- CreateTable
CREATE TABLE "repository" (
    "id" SERIAL NOT NULL,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pull_request" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "adaptly_approved" BOOLEAN NOT NULL DEFAULT false,
    "mergedAt" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "repositoryId" INTEGER NOT NULL,

    CONSTRAINT "pull_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dependency_update" (
    "id" SERIAL NOT NULL,
    "dependencyName" TEXT NOT NULL,
    "currentVersion" TEXT NOT NULL,
    "cursorVersion" TEXT NOT NULL,
    "targetVersion" TEXT NOT NULL,
    "intermediaryVersions" TEXT[],
    "pullRequestId" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dependency_update_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "repository_full_name_key" ON "repository"("full_name");

-- AddForeignKey
ALTER TABLE "pull_request" ADD CONSTRAINT "pull_request_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repository"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dependency_update" ADD CONSTRAINT "dependency_update_pullRequestId_fkey" FOREIGN KEY ("pullRequestId") REFERENCES "pull_request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
