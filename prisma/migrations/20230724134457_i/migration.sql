/*
  Warnings:

  - Made the column `auth` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "name" TEXT,
    "auth" TEXT NOT NULL
);
INSERT INTO "new_User" ("access_token", "auth", "id", "name", "refresh_token") SELECT "access_token", "auth", "id", "name", "refresh_token" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_auth_key" ON "User"("auth");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
