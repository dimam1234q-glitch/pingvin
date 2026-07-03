import { Router } from "express";
import { eq } from "drizzle-orm";
import { getDb, usersTable } from "@workspace/db";

const router = Router();

function dbGuard(res: any, err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("DATABASE_URL")) {
    res.status(503).json({ error: "Database not configured" });
    return true;
  }
  return false;
}

// POST /api/users/sync — create or update user record
router.post("/users/sync", async (req, res) => {
  try {
    const db = getDb();
    const { id, username, name, xp, streak, league, pushToken } = req.body as {
      id: string;
      username: string;
      name: string;
      xp?: number;
      streak?: number;
      league?: number;
      pushToken?: string | null;
    };

    if (!id || !username || !name) {
      res.status(400).json({ error: "id, username and name are required" });
      return;
    }

    const normalizedUsername = username.toLowerCase().trim();

    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id));

    if (existing.length > 0) {
      await db
        .update(usersTable)
        .set({
          name,
          xp: xp ?? 0,
          streak: streak ?? 0,
          league: league ?? 1,
          pushToken: pushToken ?? null,
          updatedAt: new Date(),
        })
        .where(eq(usersTable.id, id));
    } else {
      // Check username uniqueness for new users
      const byUsername = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.username, normalizedUsername));

      if (byUsername.length > 0) {
        res.status(409).json({ error: "username_taken" });
        return;
      }

      await db.insert(usersTable).values({
        id,
        username: normalizedUsername,
        name,
        xp: xp ?? 0,
        streak: streak ?? 0,
        league: league ?? 1,
        pushToken: pushToken ?? null,
      });
    }

    res.json({ ok: true });
  } catch (err) {
    if (dbGuard(res, err)) return;
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/users/search?username=xxx
router.get("/users/search", async (req, res) => {
  try {
    const db = getDb();
    const { username } = req.query;

    if (!username || typeof username !== "string") {
      res.status(400).json({ error: "username query param required" });
      return;
    }

    const users = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        name: usersTable.name,
        xp: usersTable.xp,
        streak: usersTable.streak,
        league: usersTable.league,
      })
      .from(usersTable)
      .where(eq(usersTable.username, username.toLowerCase().trim()));

    if (users.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(users[0]);
  } catch (err) {
    if (dbGuard(res, err)) return;
    res.status(500).json({ error: String(err) });
  }
});

export default router;
