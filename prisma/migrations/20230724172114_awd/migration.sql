/*
  Warnings:

  - Made the column `album` on table `Track` required. This step will fail if there are existing NULL values in that column.
  - Made the column `artist` on table `Track` required. This step will fail if there are existing NULL values in that column.
  - Made the column `image` on table `Track` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `Track` required. This step will fail if there are existing NULL values in that column.
  - Made the column `uri` on table `Track` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Track" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spotifyId" TEXT,
    "name" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "album" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "uri" TEXT NOT NULL,
    "elo" INTEGER DEFAULT 1000,
    "won" INTEGER DEFAULT 0,
    "lost" INTEGER DEFAULT 0,
    "playlistId" TEXT,
    CONSTRAINT "Track_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Track" ("album", "artist", "elo", "id", "image", "lost", "name", "playlistId", "spotifyId", "uri", "won") SELECT "album", "artist", "elo", "id", "image", "lost", "name", "playlistId", "spotifyId", "uri", "won" FROM "Track";
DROP TABLE "Track";
ALTER TABLE "new_Track" RENAME TO "Track";
CREATE INDEX "Track_elo_idx" ON "Track"("elo" DESC);
CREATE UNIQUE INDEX "Track_spotifyId_playlistId_key" ON "Track"("spotifyId", "playlistId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
