// Формулы XP (из документа): суммарный XP уровня L = 100·(L-1)·L/2, до следующего = 100·L
const Xp = {
  levelOf(xp, k = 100) {
    return Math.floor((1 + Math.sqrt(1 + (8 * xp) / k)) / 2);
  },
  total(L, k = 100) {
    return (k * (L - 1) * L) / 2;
  },
  info(xp, k = 100) {
    const L = this.levelOf(xp, k),
      a = this.total(L, k),
      b = this.total(L + 1, k);
    return { L, pct: ((xp - a) / (b - a)) * 100, need: b - xp };
  },
  rank(L) {
    return L >= 50
      ? "S"
      : L >= 35
        ? "A"
        : L >= 20
          ? "B"
          : L >= 10
            ? "C"
            : L >= 5
              ? "D"
              : "E";
  },
  // Бонус за серию: максимум +15%, пропуск не обнуляет навык
  streakBonus() {
    let n = 0,
      d = today();
    if (!(S.days[d]?.xp > 0)) d = addDays(d, -1);
    while (S.days[d]?.xp > 0) {
      n++;
      d = addDays(d, -1);
    }
    return n >= 30 ? 0.15 : n >= 14 ? 0.12 : n >= 7 ? 0.1 : n >= 3 ? 0.05 : 0;
  },
  calc(min, diff) {
    return Math.round(min * diff * (1 + this.streakBonus()));
  },
  // Начислить (или снять при отрицательном xp) опыт навыку, характеристике и общему счёту
  add(skill, xp, date = today(), why = ["misc", "Начисление"]) {
    const before = this.levelOf(S.totalXp);
    S.totalXp = Math.max(0, S.totalXp + xp);
    if (skill) {
      S.skillXp[skill.id] = Math.max(0, (S.skillXp[skill.id] || 0) + xp);
      S.statXp[skill.stat] = Math.max(
        0,
        (S.statXp[skill.stat] || 0) + Math.round(xp / 2),
      );
    }
    const d = Day.get(date);
    d.xp = Math.max(0, d.xp + xp);
    const after = this.levelOf(S.totalXp);
    Audit.add(why[1], (xp > 0 ? "+" : "") + xp + " XP");
    if (after > before) UI.levelUp(after);
  },
  weekXp(id, from = 0) {
    let s = 0;
    for (let i = from; i < from + 7; i++)
      s += S.days[addDays(today(), -i)]?.log?.[id] || 0;
    return s;
  },
};
