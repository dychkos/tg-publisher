/*
  Warnings:

  - You are about to drop the column `bust` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "chatId" INTEGER NOT NULL,
    "editMode" TEXT,
    "busy" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_User" ("chatId", "editMode", "id") SELECT "chatId", "editMode", "id" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_chatId_key" ON "User"("chatId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
