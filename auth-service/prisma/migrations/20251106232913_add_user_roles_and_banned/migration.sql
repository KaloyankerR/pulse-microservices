-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'MODERATOR');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';
ALTER TABLE "users" ADD COLUMN "banned" BOOLEAN NOT NULL DEFAULT false;
