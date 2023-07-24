-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Track" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spotifyId" TEXT,
    "name" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "album" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "elo" INTEGER NOT NULL DEFAULT 1000,
    "won" INTEGER NOT NULL DEFAULT 0,
    "lost" INTEGER NOT NULL DEFAULT 0,
    "playlistId" TEXT,
    CONSTRAINT "Track_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Track" ("album", "artist", "elo", "id", "image", "lost", "name", "playlistId", "spotifyId", "url", "won") SELECT "album", "artist", coalesce("elo", 1000) AS "elo", "id", "image", coalesce("lost", 0) AS "lost", "name", "playlistId", "spotifyId", "url", coalesce("won", 0) AS "won" FROM "Track";
DROP TABLE "Track";
ALTER TABLE "new_Track" RENAME TO "Track";
CREATE INDEX "Track_elo_idx" ON "Track"("elo" DESC);
CREATE UNIQUE INDEX "Track_spotifyId_playlistId_key" ON "Track"("spotifyId", "playlistId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
