/*
  Warnings:

  - A unique constraint covering the columns `[ip_address,event_id]` on the table `EventRegistrationSpam` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "EventRegistrationSpam_ip_address_event_id_key" ON "EventRegistrationSpam"("ip_address", "event_id");
