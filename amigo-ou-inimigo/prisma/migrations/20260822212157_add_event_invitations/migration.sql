-- CreateTable
CREATE TABLE "EventInvitation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "eventId" TEXT NOT NULL,

    CONSTRAINT "EventInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventInvitation_token_key" ON "EventInvitation"("token");

-- CreateIndex
CREATE UNIQUE INDEX "EventInvitation_eventId_email_key" ON "EventInvitation"("eventId", "email");

-- AddForeignKey
ALTER TABLE "EventInvitation" ADD CONSTRAINT "EventInvitation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
