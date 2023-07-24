/*
  Warnings:

  - A unique constraint covering the columns `[auth]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "auth" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_auth_key" ON "User"("auth");
