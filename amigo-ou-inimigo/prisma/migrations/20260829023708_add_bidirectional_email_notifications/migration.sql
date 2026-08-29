/*
  Warnings:

  - You are about to drop the column `emailNotificationSentAt` on the `AnonymousConversation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AnonymousConversation" DROP COLUMN "emailNotificationSentAt",
ADD COLUMN     "emailNotificationSentAtA" TIMESTAMP(3),
ADD COLUMN     "emailNotificationSentAtB" TIMESTAMP(3);
