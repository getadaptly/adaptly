-- CreateTable
CREATE TABLE "user_feedback" (
    "id" SERIAL NOT NULL,
    "feedback" TEXT NOT NULL,
    "repository_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_feedback_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user_feedback" ADD CONSTRAINT "user_feedback_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;
