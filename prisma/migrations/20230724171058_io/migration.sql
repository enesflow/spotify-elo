-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Track" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spotifyId" TEXT,
    "elo" INTEGER DEFAULT 1000,
    "won" INTEGER DEFAULT 0,
    "lost" INTEGER DEFAULT 0,
    "playlistId" TEXT,
    CONSTRAINT "Track_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Track" ("elo", "id", "lost", "playlistId", "spotifyId", "won") SELECT "elo", "id", "lost", "playlistId", "spotifyId", "won" FROM "Track";
DROP TABLE "Track";
ALTER TABLE "new_Track" RENAME TO "Track";
CREATE INDEX "Track_elo_idx" ON "Track"("elo" DESC);
CREATE UNIQUE INDEX "Track_spotifyId_playlistId_key" ON "Track"("spotifyId", "playlistId");
CREATE TABLE "new_Playlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spotifyId" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Playlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Playlist" ("id", "spotifyId", "userId") SELECT "id", "spotifyId", "userId" FROM "Playlist";
DROP TABLE "Playlist";
ALTER TABLE "new_Playlist" RENAME TO "Playlist";
CREATE UNIQUE INDEX "Playlist_spotifyId_userId_key" ON "Playlist"("spotifyId", "userId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
