-- AlterTable
ALTER TABLE "Chart" ADD COLUMN     "storyteller_only" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "_CommunityAdmin" ADD CONSTRAINT "_CommunityAdmin_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_CommunityAdmin_AB_unique";

-- AlterTable
ALTER TABLE "_CommunityBanned" ADD CONSTRAINT "_CommunityBanned_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_CommunityBanned_AB_unique";

-- AlterTable
ALTER TABLE "_CommunityJoinRequest" ADD CONSTRAINT "_CommunityJoinRequest_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_CommunityJoinRequest_AB_unique";

-- AlterTable
ALTER TABLE "_CommunityMember" ADD CONSTRAINT "_CommunityMember_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_CommunityMember_AB_unique";

-- AlterTable
ALTER TABLE "_Deaths" ADD CONSTRAINT "_Deaths_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_Deaths_AB_unique";

-- AlterTable
ALTER TABLE "_FeatureFlagToUserSettings" ADD CONSTRAINT "_FeatureFlagToUserSettings_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_FeatureFlagToUserSettings_AB_unique";

-- AlterTable
ALTER TABLE "_GameToGrimoire" ADD CONSTRAINT "_GameToGrimoire_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_GameToGrimoire_AB_unique";

-- AlterTable
ALTER TABLE "_Games" ADD CONSTRAINT "_Games_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_Games_AB_unique";

-- AlterTable
ALTER TABLE "_LSCampaignToRole" ADD CONSTRAINT "_LSCampaignToRole_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_LSCampaignToRole_AB_unique";

-- AlterTable
ALTER TABLE "_Retire" ADD CONSTRAINT "_Retire_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_Retire_AB_unique";

-- AlterTable
ALTER TABLE "_RoleToScript" ADD CONSTRAINT "_RoleToScript_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_RoleToScript_AB_unique";
