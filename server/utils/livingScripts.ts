import { UploadedScript } from "./customScript";

export type LSCampaignResponse = {
  title: string;
  author: string;
  campaign_options: {
    end_condition: string;
    max_townsfolk: number;
    max_outsider: number;
    max_minion: number;
    max_demon: number;
    end_value: string;
    process_mode: string;
    script_growth_speed: string;
    script_truncate_speed: string;
    custom_datasets: "";
    reserved_characters: string[];
    like_surprises: 0 | 1;
    eliminate_linked: 0 | 1;
    show_evil_winning: 0 | 1;
    show_graveyard: 0 | 1;
  };
  maxGameNum: number;
  error?: string;
};

export type LSGameResponse = {
  gameNum: number;
  game_id: number;
  characters: string;
  deaths: string;
  retire: string | null;
  created: string;
  submitted: string | null;
  goodWon: number | null;
  notes: string | null;
};

const LS_URL = "https://chillclocktower.com/living-script" as const;

export async function getLSCampaign(
  view_code: string
): Promise<LSCampaignResponse> {
  const url = `${LS_URL}/api/api_campaign.php?view_code=${view_code}`;
  console.log(`Fetching ${url}`);
  const res = await fetch(url);
  return res.json();
}

export async function getLSGameInfo(
  view_code: string,
  game_number: number
): Promise<LSGameResponse> {
  const res = await fetch(
    `${LS_URL}/api/api_game.php?view_code=${view_code}&gameNum=${game_number}`
  );
  return res.json().then((data) => data[0]);
}

export async function getAllLSGameInfo(
  view_code: string
): Promise<LSGameResponse[]> {
  const url = `${LS_URL}/api/api_game.php?view_code=${view_code}`;
  console.log(`Fetching ${url}`);
  const res = await fetch(url);
  return res.json();
}

export async function getLSGameJson(game_id: number): Promise<UploadedScript> {
  const res = await fetch(`${LS_URL}/script.php?g=${game_id}&nodl=true`);
  return res.json();
}

export function getLSBackgroundImageURL(game_id: number): string {
  return `${LS_URL}/bg.php?g=${game_id}`;
}
