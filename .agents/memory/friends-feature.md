---
name: Friends feature & storage key
description: Details about the Friends competition feature added to Пингвин ОГЭ
---

## Storage key
App storage key changed from `oge_app_v2` to `oge_app_v3` when adding userId/username fields. Migration code in `AppContext.tsx` reads old key and migrates automatically.

## Architecture
- Friends/leaderboard requires running API server (artifacts/api-server) + PostgreSQL (`DATABASE_URL` secret)
- Mobile works fully offline for core learning; friends feature degrades gracefully (shows "server unavailable" banner)
- Push notifications: native Expo only, not web; requires EAS projectId in app.json

## Username
- Auto-generated as `{mascot}_{4digits}` (e.g. `penguin_4821`) during onboarding
- Users can edit; stored in AsyncStorage under `oge_app_v3` key
- Server-side: unique constraint on `users.username`; 409 = username taken → client retries with new suffix

**Why:** Users need a unique handle to be findable by friends without any login system.

## DB schema
- `users`: id (client UUID), username, name, xp, streak, league, push_token
- `friendships`: userId, friendId, status (pending/accepted); unique constraint on (userId, friendId)

## Notifications
- Expo push token registered after onboarding completes (native only)
- Server sends push via `https://exp.host/--/api/v2/push/send` (Expo push service)
- Overtake detection: after XP sync, `/friends/notify-overtake` checks if any friend was passed

## Known limitation
API endpoints have no auth (no existing auth system in app). All routes trust caller-supplied userId. Auth is a separate feature to add.
