-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterTable
ALTER TABLE "Opportunity" ADD COLUMN "deadline" TIMESTAMP(3);
ALTER TABLE "Opportunity" ADD COLUMN "priority" "Priority" NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE "Opportunity" ADD COLUMN "tags" TEXT[];

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Comment" ADD COLUMN "isEdited" BOOLEAN NOT NULL DEFAULT false;
