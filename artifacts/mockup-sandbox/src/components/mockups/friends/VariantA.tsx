import React from "react";

const MOCK_FRIENDS = [
  { id: "1", name: "Андрей", username: "penguin_4821", xp: 1250, league: 3 },
  { id: "2", name: "Мария", username: "raccoon_1204", xp: 980, league: 2 },
  { id: "3", name: "Дима", username: "bear_7753", xp: 720, league: 2 },
  { id: "4", name: "София", username: "penguin_3391", xp: 340, league: 1 },
];

const ME = { id: "0", name: "Ты", username: "penguin_9001", xp: 1080, league: 2 };

export function VariantA() {
  const all = [ME, ...MOCK_FRIENDS].sort((a, b) => b.xp - a.xp);
  const maxXp = Math.max(...all.map((u) => u.xp));

  return (
    <div className="min-h-screen w-full bg-[#0F0F1A] text-[#F1F5F9] p-4 pb-8 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold">Друзья</h1>
          <p className="text-sm text-white/50">Соревнуйтесь и мотивируйте друг друга</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-[#6366F1]/20 flex items-center justify-center border-2 border-[#6366F1]/40">
          <span className="text-xl">🐧</span>
        </div>
      </div>

      {/* My username card */}
      <div className="bg-[#16162A] rounded-2xl p-4 border border-[#1E1E32] mb-5">
        <div className="text-xs text-white/40 mb-1 uppercase tracking-wider">Твой username</div>
        <div className="flex items-center gap-2">
          <span className="text-[#6366F1] font-bold text-lg">@</span>
          <span className="text-lg font-bold">{ME.username}</span>
          <button className="ml-auto text-xs bg-[#6366F1] text-white px-3 py-1.5 rounded-full font-semibold">
            Скопировать
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {["Рейтинг", "Поиск", "Заявки"].map((tab, i) => (
          <button
            key={tab}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold ${
              i === 0
                ? "bg-[#6366F1] text-white"
                : "bg-[#16162A] text-white/60 border border-[#1E1E32]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-3 mb-6 h-36">
        {[2, 1, 3].map((pos, idx) => {
          const user = all[pos - 1];
          const heights = ["h-20", "h-28", "h-16"];
          const colors = ["#C0C0C0", "#FFD700", "#CD7F32"];
          return (
            <div key={pos} className="flex flex-col items-center gap-2">
              <div
                className={`w-16 ${heights[idx]} rounded-t-2xl flex items-center justify-center border-2`}
                style={{ backgroundColor: colors[idx] + "20", borderColor: colors[idx] + "60" }}
              >
                <span className="text-2xl">{pos === 1 ? "🥇" : pos === 2 ? "🥈" : "🥉"}</span>
              </div>
              <div className="text-xs font-bold text-center w-20 truncate">{user.name}</div>
              <div className="text-xs text-white/50">{user.xp} XP</div>
            </div>
          );
        })}
      </div>

      {/* List */}
      <div className="space-y-2.5">
        {all.map((u, i) => {
          const isMe = u.id === "0";
          const width = `${Math.max(4, (u.xp / maxXp) * 100)}%`;
          return (
            <div
              key={u.id}
              className={`flex items-center gap-3 p-3.5 rounded-xl border ${
                isMe
                  ? "bg-[#6366F1]/10 border-[#6366F1]/40"
                  : "bg-[#16162A] border-[#1E1E32]"
              }`}
            >
              <div className="w-7 text-center font-bold text-white/40">{i + 1}</div>
              <div className="w-11 h-11 rounded-full bg-[#6366F1]/20 flex items-center justify-center border border-[#6366F1]/30 text-sm font-bold">
                {u.name.slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold truncate">{u.name}{isMe ? " (ты)" : ""}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFD700]/20 text-[#FFD700]">
                    Золото
                  </span>
                </div>
                <div className="h-2 bg-[#1E1E30] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width, backgroundColor: isMe ? "#6366F1" : "#22D3EE" }}
                  />
                </div>
              </div>
              <div className="text-sm font-bold text-white/80">{u.xp}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
