import React, { useState } from "react";

const MOCK_FRIENDS = [
  { id: "1", name: "Андрей", username: "penguin_4821", xp: 1250, league: 3 },
  { id: "2", name: "Мария", username: "raccoon_1204", xp: 980, league: 2 },
  { id: "3", name: "Дима", username: "bear_7753", xp: 720, league: 2 },
  { id: "4", name: "София", username: "penguin_3391", xp: 340, league: 1 },
];

const ME = { id: "0", name: "Ты", username: "penguin_9001", xp: 1080, league: 2 };

const LEAGUES = ["Бронза", "Серебро", "Золото", "Платина", "Алмаз"];
const LEAGUE_COLORS = ["#CD7F32", "#C0C0C0", "#FFD700", "#E5E4E2", "#B9F2FF"];

export function VariantC() {
  const [tab, setTab] = useState("leaderboard");
  const all = [ME, ...MOCK_FRIENDS].sort((a, b) => b.xp - a.xp);
  const maxXp = Math.max(...all.map((u) => u.xp));

  return (
    <div className="min-h-screen w-full bg-[#FFFBF5] text-[#1F2937] p-4 pb-8 font-sans">
      {/* Header with mascot */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-black text-[#EA580C]">Друзья</h1>
          <p className="text-sm text-[#9CA3AF]">Соревнуйся. Учись. Побеждай.</p>
        </div>
        <div className="text-4xl">🐧</div>
      </div>

      {/* Share card */}
      <div className="bg-[#EA580C] rounded-2xl p-4 mb-5 text-white shadow-lg shadow-[#EA580C]/20">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold opacity-80">ТВОЙ КОД ДРУГА</div>
            <div className="text-2xl font-black">@{ME.username}</div>
          </div>
          <button className="bg-white text-[#EA580C] px-4 py-2 rounded-xl font-bold text-sm">
            Поделиться
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 mb-5 border-b border-[#F3F4F6]">
        {[
          { key: "leaderboard", label: "Рейтинг" },
          { key: "search", label: "Поиск" },
          { key: "requests", label: "Заявки", badge: 2 },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-2 text-sm font-bold border-b-2 transition-colors ${
              tab === t.key
                ? "border-[#EA580C] text-[#EA580C]"
                : "border-transparent text-[#9CA3AF]"
            }`}
          >
            {t.label}
            {t.badge && (
              <span className="ml-1.5 bg-[#EF4444] text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Leaderboard cards */}
      <div className="space-y-3">
        {all.map((u, i) => {
          const isMe = u.id === "0";
          const leagueColor = LEAGUE_COLORS[(u.league ?? 1) - 1];
          const width = `${Math.max(4, (u.xp / maxXp) * 100)}%`;
          return (
            <div
              key={u.id}
              className={`rounded-2xl p-4 border ${
                isMe
                  ? "bg-[#FFF7ED] border-[#EA580C]/40"
                  : "bg-white border-[#F3F4F6]"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 text-center">
                  {i === 0 ? <span className="text-2xl">🥇</span> : i === 1 ? <span className="text-2xl">🥈</span> : i === 2 ? <span className="text-2xl">🥉</span> : <span className="font-black text-[#D1D5DB]">{i + 1}</span>}
                </div>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white"
                  style={{ backgroundColor: isMe ? "#EA580C" : "#6366F1" }}
                >
                  {u.name.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-base truncate">
                    {u.name}{isMe ? " (ты)" : ""}
                  </div>
                  <div className="text-xs text-[#9CA3AF]">@{u.username}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-xl text-[#1F2937]">{u.xp}</div>
                  <div className="text-[10px] text-[#9CA3AF] font-bold">XP</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width, backgroundColor: isMe ? "#EA580C" : "#6366F1" }}
                  />
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-1 rounded-full"
                  style={{ color: leagueColor, backgroundColor: leagueColor + "20" }}
                >
                  {LEAGUES[(u.league ?? 1) - 1]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
