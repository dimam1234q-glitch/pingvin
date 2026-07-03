import React, { useState } from "react";

const MOCK_FRIENDS = [
  { id: "1", name: "Андрей", username: "penguin_4821", xp: 1250, streak: 12, league: 3 },
  { id: "2", name: "Мария", username: "raccoon_1204", xp: 980, streak: 8, league: 2 },
  { id: "3", name: "Дима", username: "bear_7753", xp: 720, streak: 5, league: 2 },
];

const ME = { id: "0", name: "Ты", username: "penguin_9001", xp: 1080, streak: 9, league: 2 };

export function VariantB() {
  const [tab, setTab] = useState("leaderboard");
  const all = [ME, ...MOCK_FRIENDS].sort((a, b) => b.xp - a.xp);
  const maxXp = Math.max(...all.map((u) => u.xp));

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-white p-4 pb-8 font-sans">
      {/* Sticky header with streak */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🐧</span>
          <div>
            <h1 className="text-xl font-bold leading-tight">Друзья</h1>
            <div className="flex items-center gap-1 text-xs text-amber-400">
              <span>🔥</span>
              <span>Твой стрик: {ME.streak} дней</span>
            </div>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10">
          <span className="text-xs font-bold">@{ME.username}</span>
        </div>
      </div>

      {/* XP battle card */}
      <div className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-2xl p-4 mb-5 shadow-lg shadow-[#6366F1]/20">
        <div className="text-xs font-bold text-white/80 mb-1">НЕДЕЛЬНАЯ БИТВА</div>
        <div className="text-2xl font-black mb-2">Ты на 2 месте 🥈</div>
        <div className="text-sm text-white/80 mb-3">До 1 места не хватает 170 XP</div>
        <div className="flex gap-1.5">
          {all.slice(0, 3).map((u, i) => (
            <div
              key={u.id}
              className="flex-1 bg-black/20 rounded-lg p-2 text-center"
              style={{ opacity: u.id === "0" ? 1 : 0.7 }}
            >
              <div className="text-xs font-bold truncate">{u.name}</div>
              <div className="text-xs text-white/60">{u.xp}</div>
              <div className="h-1 bg-white/20 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full"
                  style={{ width: `${(u.xp / maxXp) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Segmented tabs */}
      <div className="bg-white/5 rounded-xl p-1 flex mb-4">
        {[
          { key: "leaderboard", label: "Рейтинг" },
          { key: "search", label: "Поиск" },
          { key: "requests", label: "Заявки 2" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === t.key ? "bg-white text-[#0F172A]" : "text-white/50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="space-y-2">
        {all.map((u, i) => {
          const isMe = u.id === "0";
          return (
            <div
              key={u.id}
              className={`flex items-center gap-3 p-4 rounded-2xl ${
                isMe ? "bg-[#6366F1]/20 border border-[#6366F1]/40" : "bg-white/5 border border-white/10"
              }`}
            >
              <div className="w-8 text-center">
                {i === 0 ? <span className="text-xl">🥇</span> : i === 1 ? <span className="text-xl">🥈</span> : i === 2 ? <span className="text-xl">🥉</span> : <span className="font-black text-white/30">{i + 1}</span>}
              </div>
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center font-bold text-white">
                  {u.name.slice(0, 2)}
                </div>
                {u.streak > 5 && (
                  <div className="absolute -top-1 -right-1 bg-amber-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    🔥{u.streak}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{u.name}{isMe ? " (ты)" : ""}</div>
                <div className="text-xs text-white/50">@{u.username}</div>
              </div>
              <div className="text-right">
                <div className="font-black text-lg">{u.xp}</div>
                <div className="text-[10px] text-white/40">XP</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
