-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('DAILY_OZ_MISSED', 'DAILY_SLEEP_MISSED');

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "babyId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificationLog_babyId_idx" ON "NotificationLog"("babyId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationLog_babyId_type_day_key" ON "NotificationLog"("babyId", "type", "day");

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby"("id") ON DELETE CASCADE ON UPDATE CASCADE;
