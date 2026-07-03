import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { AppState } from "react-native";
import { getApiBase, useApp } from "./AppContext";

export interface FriendUser {
  id: string;
  username: string;
  name: string;
  xp: number;
  streak: number;
  league: number;
}

interface FriendsContextValue {
  friends: FriendUser[];
  pendingRequests: FriendUser[];
  isLoading: boolean;
  isBackendAvailable: boolean;
  refresh: () => Promise<void>;
  searchUser: (username: string) => Promise<FriendUser | null>;
  sendRequest: (friendId: string) => Promise<{ ok: boolean; error?: string }>;
  acceptRequest: (friendId: string) => Promise<void>;
  declineRequest: (friendId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
}

const FriendsContext = createContext<FriendsContextValue | null>(null);

export function FriendsProvider({ children }: { children: ReactNode }) {
  const { userStats } = useApp();
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendAvailable, setIsBackendAvailable] = useState(true);
  const hasFetched = useRef(false);

  const userId = userStats.userId;

  const refresh = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const base = getApiBase();
      const [friendsRes, requestsRes] = await Promise.all([
        fetch(`${base}/friends?userId=${encodeURIComponent(userId)}`),
        fetch(`${base}/friends/requests?userId=${encodeURIComponent(userId)}`),
      ]);

      if (!friendsRes.ok && !requestsRes.ok) {
        setIsBackendAvailable(false);
        return;
      }

      setIsBackendAvailable(true);

      if (friendsRes.ok) {
        const data = await friendsRes.json();
        setFriends(Array.isArray(data) ? data : []);
      }
      if (requestsRes.ok) {
        const data = await requestsRes.json();
        setPendingRequests(Array.isArray(data) ? data : []);
      }
    } catch {
      setIsBackendAvailable(false);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Refresh on mount and when app comes to foreground
  useEffect(() => {
    if (!userId || hasFetched.current) return;
    hasFetched.current = true;
    refresh();
  }, [userId, refresh]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && userId) {
        refresh();
      }
    });
    return () => sub.remove();
  }, [userId, refresh]);

  async function searchUser(username: string): Promise<FriendUser | null> {
    try {
      const base = getApiBase();
      const res = await fetch(
        `${base}/users/search?username=${encodeURIComponent(username.trim().toLowerCase())}`
      );
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async function sendRequest(
    friendId: string
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/friends/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, friendId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { ok: false, error: data.error ?? "Ошибка" };
      }
      return { ok: true };
    } catch {
      return { ok: false, error: "Нет соединения с сервером" };
    }
  }

  async function acceptRequest(friendId: string): Promise<void> {
    try {
      const base = getApiBase();
      await fetch(`${base}/friends/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, friendId }),
      });
      await refresh();
    } catch {}
  }

  async function declineRequest(friendId: string): Promise<void> {
    try {
      const base = getApiBase();
      await fetch(`${base}/friends`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, friendId }),
      });
      setPendingRequests((prev) => prev.filter((f) => f.id !== friendId));
    } catch {}
  }

  async function removeFriend(friendId: string): Promise<void> {
    try {
      const base = getApiBase();
      await fetch(`${base}/friends`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, friendId }),
      });
      setFriends((prev) => prev.filter((f) => f.id !== friendId));
    } catch {}
  }

  return (
    <FriendsContext.Provider
      value={{
        friends,
        pendingRequests,
        isLoading,
        isBackendAvailable,
        refresh,
        searchUser,
        sendRequest,
        acceptRequest,
        declineRequest,
        removeFriend,
      }}
    >
      {children}
    </FriendsContext.Provider>
  );
}

export function useFriends(): FriendsContextValue {
  const ctx = useContext(FriendsContext);
  if (!ctx) throw new Error("useFriends must be used within FriendsProvider");
  return ctx;
}
