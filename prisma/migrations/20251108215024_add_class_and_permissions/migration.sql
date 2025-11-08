-- CreateEnum
CREATE TYPE "ClassLevel" AS ENUM ('JSS1', 'JSS2', 'JSS3', 'SSS1', 'SSS2', 'SSS3');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "classLevel" "ClassLevel",
ADD COLUMN     "permissions" JSONB,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "User_classLevel_idx" ON "User"("classLevel");
