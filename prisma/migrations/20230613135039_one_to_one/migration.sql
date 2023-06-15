/*
  Warnings:

  - A unique constraint covering the columns `[authorId]` on the table `Publication` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Publication_authorId_key" ON "Publication"("authorId");
