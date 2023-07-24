-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "name" TEXT,
    "auth" TEXT NOT NULL,
    "answered" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_User" ("access_token", "auth", "id", "name", "refresh_token") SELECT "access_token", "auth", "id", "name", "refresh_token" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_auth_key" ON "User"("auth");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
