/*
  Warnings:

  - You are about to drop the column `receiverId` on the `AnonymousConversation` table. All the data in the column will be lost.
  - You are about to drop the column `senderId` on the `AnonymousConversation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[eventId,participantAId,participantBId]` on the table `AnonymousConversation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `participantAId` to the `AnonymousConversation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `participantBId` to the `AnonymousConversation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AnonymousConversation" DROP CONSTRAINT "AnonymousConversation_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "AnonymousConversation" DROP CONSTRAINT "AnonymousConversation_senderId_fkey";

-- DropIndex
DROP INDEX "AnonymousConversation_eventId_senderId_receiverId_key";

-- DropIndex
DROP INDEX "AnonymousConversation_receiverId_idx";

-- DropIndex
DROP INDEX "AnonymousConversation_senderId_idx";

-- AlterTable
ALTER TABLE "AnonymousConversation" DROP COLUMN "receiverId",
DROP COLUMN "senderId",
ADD COLUMN     "participantAId" TEXT NOT NULL,
ADD COLUMN     "participantBId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "AnonymousConversation_participantAId_idx" ON "AnonymousConversation"("participantAId");

-- CreateIndex
CREATE INDEX "AnonymousConversation_participantBId_idx" ON "AnonymousConversation"("participantBId");

-- CreateIndex
CREATE UNIQUE INDEX "AnonymousConversation_eventId_participantAId_participantBId_key" ON "AnonymousConversation"("eventId", "participantAId", "participantBId");

-- AddForeignKey
ALTER TABLE "AnonymousConversation" ADD CONSTRAINT "AnonymousConversation_participantAId_fkey" FOREIGN KEY ("participantAId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnonymousConversation" ADD CONSTRAINT "AnonymousConversation_participantBId_fkey" FOREIGN KEY ("participantBId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
