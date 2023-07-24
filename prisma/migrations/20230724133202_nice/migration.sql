/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "name" TEXT
);
INSERT INTO "new_User" ("access_token", "id", "name", "refresh_token") SELECT "access_token", "id", "name", "refresh_token" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
