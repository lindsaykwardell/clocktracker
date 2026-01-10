export type PlayerSummary = {
  user_id: string | null;
  username: string;
  avatar: string | null;
  priority?: number;
  plays: number;
  wins: number;
  losses: number;
  good_plays: number;
  evil_plays: number;
  traveler_plays?: number;
  storyteller_plays?: number;
  drunk_plays?: number;
  lunatic_plays?: number;
  mutant_plays?: number;
  damsel_plays?: number;
  role_details: Record<
    string,
    {
      token_url: string | null;
      type: string | null;
      initial_alignment: string | null;
    }
  >;
  role_tokens?: Record<string, string | null>;
  role_games?: Record<string, string[]>;
  roles: Record<string, number>;
};
