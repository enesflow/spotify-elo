/*
  Warnings:

  - A unique constraint covering the columns `[spotifyId,playlistId]` on the table `Track` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Track_spotifyId_playlistId_key" ON "Track"("spotifyId", "playlistId");
