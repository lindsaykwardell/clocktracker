export type PlayerSummary = {
  user_id: string | null;
  username: string;
  display_name?: string;
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

export const COMMUNITY_STATS_MIN_GAMES = 3;
export const COMMUNITY_STATS_BAYESIAN_ALPHA = 2;
export const COMMUNITY_STATS_BAYESIAN_BETA = 2;
export const COMMUNITY_STATS_BAYESIAN_TOOLTIP =
  "<div class='w-[250px]'>Ranking uses a small sample-size adjustment (Bayesian) so tiny samples don't outrank larger ones.</div>";
