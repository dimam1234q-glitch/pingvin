import { Router } from "express";
import { and, eq, or } from "drizzle-orm";
import { getDb, usersTable, friendshipsTable } from "@workspace/db";

const router = Router();

function dbGuard(res: any, err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("DATABASE_URL")) {
    res.status(503).json({ error: "Database not configured" });
    return true;
  }
  return false;
}

/** Send an Expo push notification (fire-and-forget) */
async function sendPush(
  pushToken: string | null | undefined,
  title: string,
  body: string,
  data?: Record<string, unknown>,
) {
  if (!pushToken || !pushToken.startsWith("ExponentPushToken")) return;
  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to: pushToken, title, body, data: data ?? {} }),
    });
  } catch {
    // push errors are non-fatal
  }
}

// GET /api/friends?userId=xxx — accepted friends with their stats
router.get("/friends", async (req, res) => {
  try {
    const db = getDb();
    const { userId } = req.query;

    if (!userId || typeof userId !== "string") {
      res.status(400).json({ error: "userId required" });
      return;
    }

    const rows = await db
      .select()
      .from(friendshipsTable)
      .where(
        and(
          or(
            eq(friendshipsTable.userId, userId),
            eq(friendshipsTable.friendId, userId),
          ),
          eq(friendshipsTable.status, "accepted"),
        ),
      );

    const friendIds = rows.map((r) =>
      r.userId === userId ? r.friendId : r.userId,
    );

    if (friendIds.length === 0) {
      res.json([]);
      return;
    }

    const friends = await Promise.all(
      friendIds.map((fid) =>
        db
          .select({
            id: usersTable.id,
            username: usersTable.username,
            name: usersTable.name,
            xp: usersTable.xp,
            streak: usersTable.streak,
            league: usersTable.league,
          })
          .from(usersTable)
          .where(eq(usersTable.id, fid)),
      ),
    );

    res.json(friends.flat());
  } catch (err) {
    if (dbGuard(res, err)) return;
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/friends/requests?userId=xxx — pending incoming requests
router.get("/friends/requests", async (req, res) => {
  try {
    const db = getDb();
    const { userId } = req.query;

    if (!userId || typeof userId !== "string") {
      res.status(400).json({ error: "userId required" });
      return;
    }

    const rows = await db
      .select()
      .from(friendshipsTable)
      .where(
        and(
          eq(friendshipsTable.friendId, userId),
          eq(friendshipsTable.status, "pending"),
        ),
      );

    if (rows.length === 0) {
      res.json([]);
      return;
    }

    const senders = await Promise.all(
      rows.map((r) =>
        db
          .select({
            id: usersTable.id,
            username: usersTable.username,
            name: usersTable.name,
            xp: usersTable.xp,
            streak: usersTable.streak,
            league: usersTable.league,
          })
          .from(usersTable)
          .where(eq(usersTable.id, r.userId)),
      ),
    );

    res.json(senders.flat());
  } catch (err) {
    if (dbGuard(res, err)) return;
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/friends/request — send a friend request
router.post("/friends/request", async (req, res) => {
  try {
    const db = getDb();
    const { userId, friendId } = req.body as {
      userId: string;
      friendId: string;
    };

    if (!userId || !friendId) {
      res.status(400).json({ error: "userId and friendId required" });
      return;
    }

    if (userId === friendId) {
      res.status(400).json({ error: "Cannot add yourself" });
      return;
    }

    // Check if request or friendship already exists
    const existing = await db
      .select()
      .from(friendshipsTable)
      .where(
        or(
          and(
            eq(friendshipsTable.userId, userId),
            eq(friendshipsTable.friendId, friendId),
          ),
          and(
            eq(friendshipsTable.userId, friendId),
            eq(friendshipsTable.friendId, userId),
          ),
        ),
      );

    if (existing.length > 0) {
      res.status(409).json({ error: "Request already exists" });
      return;
    }

    await db.insert(friendshipsTable).values({
      userId,
      friendId,
      status: "pending",
    });

    // Notify the recipient
    const [recipient] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, friendId));
    const [sender] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (recipient && sender) {
      await sendPush(
        recipient.pushToken,
        "Новый запрос в друзья",
        `${sender.name} (@${sender.username}) хочет добавить тебя в друзья`,
        { type: "friend_request", fromId: userId },
      );
    }

    res.json({ ok: true });
  } catch (err) {
    if (dbGuard(res, err)) return;
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/friends/accept — accept a friend request
router.post("/friends/accept", async (req, res) => {
  try {
    const db = getDb();
    const { userId, friendId } = req.body as {
      userId: string;
      friendId: string;
    };

    if (!userId || !friendId) {
      res.status(400).json({ error: "userId and friendId required" });
      return;
    }

    const updated = await db
      .update(friendshipsTable)
      .set({ status: "accepted" })
      .where(
        and(
          eq(friendshipsTable.userId, friendId),
          eq(friendshipsTable.friendId, userId),
          eq(friendshipsTable.status, "pending"),
        ),
      )
      .returning();

    if (updated.length === 0) {
      res.status(404).json({ error: "No pending request found" });
      return;
    }

    // Notify the sender that their request was accepted
    const [sender] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, friendId));
    const [acceptor] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (sender && acceptor) {
      await sendPush(
        sender.pushToken,
        "Заявка принята!",
        `${acceptor.name} (@${acceptor.username}) принял твой запрос в друзья`,
        { type: "friend_accepted", fromId: userId },
      );
    }

    res.json({ ok: true });
  } catch (err) {
    if (dbGuard(res, err)) return;
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /api/friends — remove friend or decline request
router.delete("/friends", async (req, res) => {
  try {
    const db = getDb();
    const { userId, friendId } = req.body as {
      userId: string;
      friendId: string;
    };

    if (!userId || !friendId) {
      res.status(400).json({ error: "userId and friendId required" });
      return;
    }

    await db
      .delete(friendshipsTable)
      .where(
        or(
          and(
            eq(friendshipsTable.userId, userId),
            eq(friendshipsTable.friendId, friendId),
          ),
          and(
            eq(friendshipsTable.userId, friendId),
            eq(friendshipsTable.friendId, userId),
          ),
        ),
      );

    res.json({ ok: true });
  } catch (err) {
    if (dbGuard(res, err)) return;
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/friends/notify-overtake — called after XP sync to notify overtaken friends
router.post("/friends/notify-overtake", async (req, res) => {
  try {
    const db = getDb();
    const { userId, oldXp, newXp } = req.body as {
      userId: string;
      oldXp: number;
      newXp: number;
    };

    if (!userId || oldXp === undefined || newXp === undefined) {
      res.status(400).json({ error: "userId, oldXp, newXp required" });
      return;
    }

    if (newXp <= oldXp) {
      res.json({ notified: 0 });
      return;
    }

    // Get accepted friends
    const rows = await db
      .select()
      .from(friendshipsTable)
      .where(
        and(
          or(
            eq(friendshipsTable.userId, userId),
            eq(friendshipsTable.friendId, userId),
          ),
          eq(friendshipsTable.status, "accepted"),
        ),
      );

    const friendIds = rows.map((r) =>
      r.userId === userId ? r.friendId : r.userId,
    );

    if (friendIds.length === 0) {
      res.json({ notified: 0 });
      return;
    }

    const [currentUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (!currentUser) {
      res.json({ notified: 0 });
      return;
    }

    // Find friends whose XP was >= oldXp but < newXp (we overtook them)
    let notified = 0;
    for (const fid of friendIds) {
      const [friend] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, fid));

      if (friend && friend.xp >= oldXp && friend.xp < newXp) {
        await sendPush(
          friend.pushToken,
          "Тебя обогнали! 🐧",
          `${currentUser.name} (@${currentUser.username}) обошёл тебя по XP — ${newXp} vs ${friend.xp} XP`,
          { type: "overtaken", byId: userId },
        );
        notified++;
      }
    }

    res.json({ notified });
  } catch (err) {
    if (dbGuard(res, err)) return;
    res.status(500).json({ error: String(err) });
  }
});

export default router;
