/*
  Warnings:

  - Made the column `userId` on table `Playlist` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Playlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spotifyId" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Playlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Playlist" ("id", "spotifyId", "userId") SELECT "id", "spotifyId", "userId" FROM "Playlist";
DROP TABLE "Playlist";
ALTER TABLE "new_Playlist" RENAME TO "Playlist";
CREATE UNIQUE INDEX "Playlist_spotifyId_userId_key" ON "Playlist"("spotifyId", "userId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
