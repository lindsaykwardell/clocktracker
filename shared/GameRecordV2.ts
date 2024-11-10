import type {
  GameV2,
  GameDetails,
  GrimoireV2,
  TokenV2,
  Character,
  DemonBluff,
  Fabled,
  ReminderToken,
  Alignment,
} from "@prisma/client";

export type GameSummary = {
  date: string;
  script: string;
  script_logo: string | null;
  display_name: string;
};

export type GameRecordV2 = GameV2 & {
  user: {
    username: string;
    privacy: PrivacySetting;
  };
  characters: (Character & {
    role: {
      token_url: string;
      type: string;
      initial_alignment: Alignment;
    } | null;
    related_role: { token_url: string } | null;
  })[];
  details: GameDetails & {
    storytellers: {
      username: string;
      display_name: string;
    }[];
    grimoire: (GrimoireV2 & {
      tokens: (TokenV2 & {
        role: {
          token_url: string;
          type: string;
          initial_alignment: "GOOD" | "EVIL" | "NEUTRAL";
          name: string;
        } | null;
        related_role: { token_url: string } | null;
        reminders: ReminderToken[];
        player: {
          username: string;
          display_name: string;
        } | null;
      })[];
    })[];
    demon_bluffs: (DemonBluff & {
      role: {
        token_url: string;
        type: string;
      } | null;
    })[];
    fabled: (Fabled & {
      role: {
        token_url: string;
      } | null;
    })[];
    community: {
      id: number;
      name: string;
      slug: string;
    } | null;
    associated_script: {
      version: string;
      script_id: string;
      is_custom_script: boolean;
      logo: string | null;
    } | null;
  };
};
