import { Router } from "express";
import { desc, eq } from "drizzle-orm";
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

function publicUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    group: user.group,
    xp: user.xp,
    streak: user.streak,
    league: user.league,
  };
}

// GET /api/ratings?group=1 — leaderboard within a group
router.get("/ratings", async (req, res) => {
  try {
    const db = getDb();
    const { group } = req.query;

    if (!group || typeof group !== "string") {
      res.status(400).json({ error: "group query param required" });
      return;
    }

    const rows = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.group, group.trim()))
      .orderBy(desc(usersTable.xp), desc(usersTable.updatedAt));

    res.json(rows.map(publicUser));
  } catch (err) {
    if (dbGuard(res, err)) return;
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/ratings/all — leaderboard across all users
router.get("/ratings/all", async (req, res) => {
  try {
    const db = getDb();

    const rows = await db
      .select()
      .from(usersTable)
      .orderBy(desc(usersTable.xp), desc(usersTable.updatedAt));

    res.json(rows.map(publicUser));
  } catch (err) {
    if (dbGuard(res, err)) return;
    res.status(500).json({ error: String(err) });
  }
});

export default router;
