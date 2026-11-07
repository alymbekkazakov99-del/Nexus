// Состояние приложения и мелкие помощники по датам.
const p2 = (n) => String(n).padStart(2, "0");
const fmt = (d) =>
  d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate());
const today = () => fmt(new Date());
const addDays = (s, n) => {
  const d = new Date(s + "T12:00");
  d.setDate(d.getDate() + n);
  return fmt(d);
};
const esc = (t) =>
  String(t ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
const uid = () => Math.random().toString(36).slice(2, 9);
const STATS = [
  "Интеллект",
  "Дисциплина",
  "Здоровье",
  "Богатство",
  "Социальное",
  "Творчество",
  "Молитва",
  "Опыт",
];
// Частота: e<N> = раз в N дней, w<N> = N раз в неделю
const FREQ = {
  e1: "каждый день",
  e2: "через день",
  e3: "каждые 3 дня",
  e7: "раз в неделю (w1)",
  w2: "2 раза в неделю",
  w3: "3 раза в неделю",
  w4: "4 раза в неделю",
  w5: "5 раз в неделю",
};
const DIFF = {
  0.8: "Лёгкая",
  1: "Обычная",
  1.25: "Сложная",
  1.5: "Очень сложная",
};
function defaults() {
  const sk = (name, stat, freq, dur, diff, prio) => ({
    id: uid(),
    name,
    stat,
    freq,
    dur,
    diff,
    prio,
  });
  return {
    profile: { name: "", goal: "" },
    totalXp: 0,
    skillXp: {},
    statXp: {},
    skills: [
      sk("Здоровье", "Здоровье", "w3", 30, 1, 2),
      sk("Спорт", "Здоровье", "w3", 45, 1, 2),
    ],
    spirit: ["Пункт 1", "Пункт 2", "Пункт 3", "Пункт 4", "Пункт 5", "Пункт 6"],
    days: {},
    tab: "home",
  };
}
let S = defaults();
// Приведение данных к актуальной структуре (миграции) — вызывается после входа и импорта
function migrate() {
  S.statXp = S.statXp || {};
  S.skillXp = S.skillXp || {};
  S.goals = S.goals || [];
  S.rewards = S.rewards || [];
  S.ach = S.ach || {};
  S.audit = S.audit || [];
  S.jmood = S.jmood || {};
  S.cal = S.cal || {};
  S.theme = S.theme || "dark";
  S.mastery = S.mastery || {};
  S.journal = S.journal || {};
  if (S.statXp["Духовность"]) {
    S.statXp["Молитва"] = (S.statXp["Молитва"] || 0) + S.statXp["Духовность"];
    delete S.statXp["Духовность"];
  }
  S.skills.forEach((k) => {
    if (k.stat === "Духовность") k.stat = "Молитва";
  });
}
const save = () => Store.save(S);
