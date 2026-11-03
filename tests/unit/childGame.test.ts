import { test } from "node:test";
import assert from "node:assert/strict";
import type { Prisma } from "../../server/generated/prisma/client";
import {
  findOrCreatePlayerChildGame,
  findOrCreateStorytellerChildGame,
} from "../../server/utils/childGame";

const game={
  id: "parent",parent_game_id: null,date: new Date("2026-01-01"),
  script: "Trouble Brewing",script_id: null,location_type: "ONLINE",
  location: "",community_name: "",community_id: null,
  player_count: 10,traveler_count: 0,storyteller: "@storyteller",
  co_storytellers: [],win_v2: "GOOD_WINS",is_storyteller: true,
  grimoire: [{ id: 1 }],demon_bluffs: [],fabled: [],
  end_trigger: "CHARACTER_ABILITY" as const,
  end_trigger_type: "EXECUTION" as const,
  end_trigger_cause: "ABILITY" as const,
  end_trigger_role_id: "saint",end_trigger_note: "Final execution",
  end_trigger_participant_id: "participant",ls_game_id: null,
  grimoire_events: [],
};

for(const kind of ["player","storyteller"] as const) {
  for(const existing of [false,true]) {
    test(`${kind} child ${existing? "update":"creation"} retains game-end data in the supplied transaction`,async () => {
      const writes: any[]=[];
      const db={
        game: {
          findFirst: async () => null,
          create: async (args: any) => { writes.push(args); return { id: "child" }; },
          update: async (args: any) => { writes.push(args); return { id: "child" }; },
        }
      } as unknown as Prisma.TransactionClient;
      const relatedGames=existing? [{
        id: "child",user_id: "tagged",demon_bluffs: [],fabled: [],player_characters: [],
      }]:[];
      const result=kind==="player"
        ? await findOrCreatePlayerChildGame({ db,game,playerId: "tagged",playerCharacters: [],relatedGames })
        :await findOrCreateStorytellerChildGame({ db,game,storytellerUserId: "tagged",childGames: relatedGames });
      assert.equal(result,"child");
      assert.equal(writes.length,1);
      const data=writes[0].data;
      assert.equal(data.end_trigger,game.end_trigger);
      assert.equal(data.end_trigger_type,game.end_trigger_type);
      assert.equal(data.end_trigger_cause,game.end_trigger_cause);
      assert.equal(data.end_trigger_role_id,game.end_trigger_role_id);
      assert.equal(data.end_trigger_participant_id,game.end_trigger_participant_id);
      assert.equal(data.end_trigger_note,game.end_trigger_note);
      assert.deepEqual(data.grimoire_events,existing? { deleteMany: {},create: [] }:{ create: [] });
    });
  }
}

test("child updates preserve events when a bulk edit does not supply them",async () => {
  let data: any;
  const db={ game: { update: async (args: any) => { data=args.data; } } } as unknown as Prisma.TransactionClient;
  await findOrCreatePlayerChildGame({
    db,game: { ...game,grimoire_events: undefined,end_trigger_role_id: null },
    playerId: "tagged",playerCharacters: [],
    relatedGames: [{ id: "child",user_id: "tagged",demon_bluffs: [],fabled: [],player_characters: [] }],
  });
  assert.equal(data.grimoire_events,undefined);
  assert.equal(data.end_trigger_role_id,null);
});
