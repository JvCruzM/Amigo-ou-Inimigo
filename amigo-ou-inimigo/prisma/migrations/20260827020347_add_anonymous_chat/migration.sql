-- CreateTable
CREATE TABLE "AnonymousConversation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "eventId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,

    CONSTRAINT "AnonymousConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnonymousMessage" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,

    CONSTRAINT "AnonymousMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnonymousConversation_eventId_idx" ON "AnonymousConversation"("eventId");

-- CreateIndex
CREATE INDEX "AnonymousConversation_senderId_idx" ON "AnonymousConversation"("senderId");

-- CreateIndex
CREATE INDEX "AnonymousConversation_receiverId_idx" ON "AnonymousConversation"("receiverId");

-- CreateIndex
CREATE UNIQUE INDEX "AnonymousConversation_eventId_senderId_receiverId_key" ON "AnonymousConversation"("eventId", "senderId", "receiverId");

-- CreateIndex
CREATE INDEX "AnonymousMessage_conversationId_createdAt_idx" ON "AnonymousMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "AnonymousMessage_senderId_idx" ON "AnonymousMessage"("senderId");

-- AddForeignKey
ALTER TABLE "AnonymousConversation" ADD CONSTRAINT "AnonymousConversation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnonymousConversation" ADD CONSTRAINT "AnonymousConversation_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnonymousConversation" ADD CONSTRAINT "AnonymousConversation_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnonymousMessage" ADD CONSTRAINT "AnonymousMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AnonymousConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnonymousMessage" ADD CONSTRAINT "AnonymousMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
