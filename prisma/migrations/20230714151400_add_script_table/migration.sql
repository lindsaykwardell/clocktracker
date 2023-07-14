-- CreateTable
CREATE TABLE "Script" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "json_url" TEXT NOT NULL,
    "pdf_url" TEXT NOT NULL,

    CONSTRAINT "Script_pkey" PRIMARY KEY ("id")
);
