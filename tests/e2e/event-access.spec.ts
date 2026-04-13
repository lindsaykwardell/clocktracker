import { test, expect } from "@playwright/test";
import { PrismaClient } from "../../server/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { nanoid } from "nanoid";

const oneDay = 1000 * 60 * 60 * 24;
const oneHour = 1000 * 60 * 60;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

type CommunityType = "public" | "private" | "none";
type WhoCanRegister = "ANYONE" | "PRIVATE" | "COMMUNITY_MEMBERS";

type Fixture = {
  id: string;
  title: string;
  shortCode: string;
  communityType: CommunityType;
  whoCanRegister: WhoCanRegister;
  expectVisible: boolean;
};

const fixtures: Fixture[] = [];
let publicCommunityId: number;
let privateCommunityId: number;

// COMMUNITY_MEMBERS events are only accessible to unauthenticated users when the
// community is public (open to everyone). For private communities the user must be
// a member, and for no-community events the user must be a friend of the creator.
// ANYONE and PRIVATE (direct link) events are always accessible regardless of community privacy.
function expectVisible(ct: CommunityType, wcr: WhoCanRegister): boolean {
  if (wcr === "COMMUNITY_MEMBERS" && ct !== "public") return false;
  return true;
}

test.beforeAll(async () => {
  const tag = nanoid(6);

  const publicCommunity = await prisma.community.create({
    data: {
      name: `E2E Public ${tag}`,
      slug: `e2e-pub-${tag}`,
      description: "Test community",
      icon: "/img/default.png",
      is_private: false,
    },
  });
  publicCommunityId = publicCommunity.id;

  const privateCommunity = await prisma.community.create({
    data: {
      name: `E2E Private ${tag}`,
      slug: `e2e-priv-${tag}`,
      description: "Test community",
      icon: "/img/default.png",
      is_private: true,
    },
  });
  privateCommunityId = privateCommunity.id;

  const communityIds: Record<CommunityType, number | null> = {
    public: publicCommunityId,
    private: privateCommunityId,
    none: null,
  };

  const communityTypes: CommunityType[] = ["public", "private", "none"];
  const registerTypes: WhoCanRegister[] = [
    "ANYONE",
    "PRIVATE",
    "COMMUNITY_MEMBERS",
  ];

  for (const ct of communityTypes) {
    for (const wcr of registerTypes) {
      const sc = nanoid(8);
      const title = `E2E-${ct}-${wcr}-${tag}`;
      const start = new Date(Date.now() + oneDay);
      const end = new Date(Date.now() + oneDay + oneHour);

      const event = await prisma.event.create({
        data: {
          title,
          description: "Test event",
          start,
          end,
          location: "Test Location",
          community_id: communityIds[ct],
          who_can_register: wcr,
          short_link: sc,
        },
      });

      fixtures.push({
        id: event.id,
        title,
        shortCode: sc,
        communityType: ct,
        whoCanRegister: wcr,
        expectVisible: expectVisible(ct, wcr),
      });
    }
  }
});

test.afterAll(async () => {
  for (const f of fixtures) {
    await prisma.event.delete({ where: { id: f.id } }).catch(() => {});
  }
  await prisma.community
    .delete({ where: { id: publicCommunityId } })
    .catch(() => {});
  await prisma.community
    .delete({ where: { id: privateCommunityId } })
    .catch(() => {});
  await prisma.$disconnect();
});

test.describe("Event access - unauthenticated", () => {
  test("event detail API returns correct status for each combination", async ({
    request,
  }) => {
    for (const f of fixtures) {
      const expected = f.expectVisible ? 200 : 404;
      await test.step(`${f.communityType} + ${f.whoCanRegister} → ${expected}`, async () => {
        const res = await request.get(`/api/event/${f.id}`);
        expect(res.status()).toBe(expected);
      });
    }
  });

  test("short code API resolves all events regardless of access", async ({
    request,
  }) => {
    for (const f of fixtures) {
      await test.step(`${f.communityType} + ${f.whoCanRegister}`, async () => {
        const res = await request.get(`/api/e/${f.shortCode}`);
        expect(res.status()).toBe(200);
        expect(await res.text()).toContain(`/event/${f.id}/`);
      });
    }
  });

  test("invalid short code returns 404, not 500", async ({ request }) => {
    const res = await request.get("/api/e/nonexistent_code");
    expect(res.status()).toBe(404);
  });

  test("accessible events render via short link", async ({ page }) => {
    for (const f of fixtures.filter((f) => f.expectVisible)) {
      await test.step(`${f.communityType} + ${f.whoCanRegister}`, async () => {
        await page.goto(`/e/${f.shortCode}`);
        await expect(page.getByText(f.title).first()).toBeVisible({
          timeout: 15000,
        });
      });
    }
  });

  test("inaccessible COMMUNITY_MEMBERS events do not render via short link", async ({
    page,
  }) => {
    for (const f of fixtures.filter((f) => !f.expectVisible)) {
      await test.step(`${f.communityType} + ${f.whoCanRegister}`, async () => {
        await page.goto(`/e/${f.shortCode}`);
        await page.waitForURL(/\/event\//);
        await page.waitForLoadState("networkidle");
        await expect(page.getByText(f.title)).not.toBeVisible();
      });
    }
  });
});
