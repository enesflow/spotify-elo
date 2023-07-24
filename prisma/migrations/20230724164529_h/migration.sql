/*
  Warnings:

  - A unique constraint covering the columns `[spotifyId,userId]` on the table `Playlist` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "Track" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spotifyId" TEXT,
    "elo" INTEGER,
    "won" INTEGER,
    "lost" INTEGER,
    "playlistId" TEXT,
    CONSTRAINT "Track_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Playlist_spotifyId_userId_key" ON "Playlist"("spotifyId", "userId");
