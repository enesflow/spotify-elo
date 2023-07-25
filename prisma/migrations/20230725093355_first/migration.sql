-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "name" TEXT,
    "auth" TEXT NOT NULL,
    "answered" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Playlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spotifyId" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Playlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Track" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spotifyId" TEXT,
    "name" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "album" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "elo" REAL NOT NULL DEFAULT 1000,
    "won" INTEGER NOT NULL DEFAULT 0,
    "lost" INTEGER NOT NULL DEFAULT 0,
    "playlistId" TEXT,
    CONSTRAINT "Track_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_auth_key" ON "User"("auth");

-- CreateIndex
CREATE UNIQUE INDEX "Playlist_spotifyId_userId_key" ON "Playlist"("spotifyId", "userId");

-- CreateIndex
CREATE INDEX "Track_elo_idx" ON "Track"("elo" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Track_spotifyId_playlistId_key" ON "Track"("spotifyId", "playlistId");
