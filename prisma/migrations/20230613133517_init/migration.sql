-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "chatId" INTEGER NOT NULL,
    "editMode" TEXT,
    "bust" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Publication" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "authorId" INTEGER NOT NULL,
    "published" BOOLEAN DEFAULT false,
    CONSTRAINT "Publication_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_chatId_key" ON "User"("chatId");
