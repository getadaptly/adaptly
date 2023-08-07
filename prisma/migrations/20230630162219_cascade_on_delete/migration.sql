-- DropForeignKey
ALTER TABLE "dependency_update" DROP CONSTRAINT "dependency_update_pull_request_id_fkey";

-- DropForeignKey
ALTER TABLE "pull_request" DROP CONSTRAINT "pull_request_repository_id_fkey";

-- AddForeignKey
ALTER TABLE "pull_request" ADD CONSTRAINT "pull_request_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dependency_update" ADD CONSTRAINT "dependency_update_pull_request_id_fkey" FOREIGN KEY ("pull_request_id") REFERENCES "pull_request"("id") ON DELETE CASCADE ON UPDATE CASCADE;
