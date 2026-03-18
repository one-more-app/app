/*
  Warnings:

  - A unique constraint covering the columns `[userId,clientId]` on the table `PerformanceEntry` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,clientId]` on the table `TrackedExercise` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `clientId` to the `PerformanceEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientId` to the `TrackedExercise` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PerformanceEntry" ADD COLUMN     "clientId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TrackedExercise" ADD COLUMN     "clientId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceEntry_userId_clientId_key" ON "PerformanceEntry"("userId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "TrackedExercise_userId_clientId_key" ON "TrackedExercise"("userId", "clientId");
