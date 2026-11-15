-- CreateTable
CREATE TABLE "ScriptImportState" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "last_version_pk" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ScriptImportState_pkey" PRIMARY KEY ("id")
);
