/*
  Warnings:

  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "name" TEXT
);
INSERT INTO "new_User" ("access_token", "id", "name", "refresh_token") SELECT "access_token", "id", "name", "refresh_token" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
