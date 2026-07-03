import { pgTable, serial, text, timestamp, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const friendshipsTable = pgTable(
  "friendships",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    friendId: text("friend_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"), // 'pending' | 'accepted'
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Prevent duplicate directional rows (A→B must be unique)
    unique("friendships_pair_unique").on(t.userId, t.friendId),
  ],
);

export type Friendship = typeof friendshipsTable.$inferSelect;
export type FriendshipStatus = "pending" | "accepted";
