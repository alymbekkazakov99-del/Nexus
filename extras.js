// Дополнения: таймер с секундами, сон, мягкий возврат, обзоры, достижения, награды, LEVEL UP.
const hms = (s) =>
  p2(Math.floor(s / 3600)) +
  ":" +
  p2(Math.floor((s % 3600) / 60)) +
  ":" +
  p2(s % 60);
const dxp = (d) => S.days[d]?.xp || 0;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// --- Восстановление: сон (цель 8 ч) минус штраф за тяжёлые последние 3 дня
const Recovery = {
  load(d) {
    return (S.days[d]?.plan || []).reduce(
      (s, e) =>
        s + (e.done ? S.skills.find((k) => k.id === e.skillId)?.dur || 0 : 0),
      0,
    );
  },
  calc() {
    const sl = S.days[today()]?.sleep;
    const base = sl ? clamp((sl / 8) * 100, 0, 100) : 85;
    const avg =
      [1, 2, 3].reduce((s, i) => s + this.load(addDays(today(), -i)), 0) / 3;
    return Math.round(clamp(base - Math.max(0, (avg - 150) / 3), 0, 100));
  },
};
// --- Таймер: считаем по времени, а не по тикам — точно даже если вкладка в фоне
Object.assign(Focus, {
  base: 0,
  t0: null,
  tick: null,
  paint() {
    const e = document.getElementById("tm");
    if (e) e.textContent = hms(this.sec);
  },
  stop() {
    if (this.t0) {
      this.base += (Date.now() - this.t0) / 1000;
      this.t0 = null;
    }
    clearInterval(this.tick);
  },
});
Object.defineProperty(Focus, "sec", {
  get() {
    return Math.floor(
      this.base + (this.t0 ? (Date.now() - this.t0) / 1000 : 0),
    );
  },
});
UI.focus = function () {
  const f = Day.get(today()).focusSec || 0;
  return `<section class="card"><h3>Таймер</h3><div class="timer" id="tm">00:00:00</div>
 <p><select id="fsk">${S.skills.map((k) => `<option value="${k.id}">${esc(k.name)}</option>`).join("")}</select></p>
 <p><button class="b p" data-act="fgo">Старт / Продолжить</button> <button class="b" data-act="fpause">Пауза</button> <button class="b" data-act="fend">Завершить</button> <button class="b" data-act="freset">Сбросить</button></p>
 <p class="dim">XP считается по секундам: минута = 1 XP × сложность навыка. Фокус сегодня: ${hms(f)}.</p></section>`;
};
// --- Сон и мягкий возврат на главной и в расписании
UI.sleepCard = function () {
  const d = Day.get(today()),
    r = Recovery.calc();
  return `<section class="card"><h3>Сон</h3><p><input id="slp" type="number" step="0.25" min="0" max="16" value="${d.sleep || ""}" placeholder="Часов сна" style="width:130px"> <button class="b" data-act="slsave">Сохранить</button></p>
 <p>Цель 8 ч · сил <b>${r}%</b></p>${this.bar(r)}<p class="dim">${r < 70 ? "Нагрузка последних дней высокая. Лучше лёгкий день." : "Ресурс в норме — можно работать по плану."}</p>${r < 70 ? '<button class="b p" data-act="light">Сделать день легче</button>' : ""}</section>`;
};
const _home = UI.home,
  _plan = UI.plan;
UI.home = function () {
  const t = today(),
    low =
      dxp(addDays(t, -1)) === 0 &&
      dxp(addDays(t, -2)) === 0 &&
      dxp(t) === 0 &&
      Object.keys(S.days).some((k) => k < addDays(t, -2) && dxp(k) > 0);
  return (
    (low
      ? `<section class="card" style="border-color:var(--warn)"><b>Замечено снижение активности.</b><p class="dim">Следующая задача — вернуться в ритм. Хватит одного маленького шага.</p><button class="b p" data-act="back">Взять мини-задание на 10 минут</button></section>`
      : "") +
    _home.call(this) +
    this.sleepCard()
  );
};
UI.plan = function () {
  return this.sleepCard() + _plan.call(this);
};
// --- Обзоры: неделя и 90 дней
function summary(n, from = 0) {
  let xp = 0,
    fs = 0,
    done = 0,
    plan = 0,
    best = null,
    by = {};
  for (let i = from; i < from + n; i++) {
    const d = addDays(today(), -i),
      r = S.days[d];
    if (!r) continue;
    xp += r.xp;
    fs += r.focusSec || 0;
    plan += r.plan.length;
    done += r.plan.filter((e) => e.done).length;
    if (!best || r.xp > best.xp) best = { d, xp: r.xp };
    for (const k in r.log) by[k] = (by[k] || 0) + r.log[k];
  }
  const arr = S.skills
    .map((k) => [k.name, by[k.id] || 0])
    .sort((a, b) => b[1] - a[1]);
  return { xp, fs, done, plan, best, top: arr[0], low: arr.at(-1) };
}
UI.review = function () {
  const w = summary(7),
    pw = summary(7, 7),
    m = summary(90),
    st = S.goals
      .flatMap((g) => g.projects.flatMap((p) => p.stages))
      .filter((s) => s.done).length;
  const adv = pw.xp
      ? Math.round(((w.xp - pw.xp) / pw.xp) * 100)
      : w.xp
        ? 100
        : 0,
    blk = (t, s, x) =>
      `<section class="card"><h3>${t}</h3><p>XP: <b>+${s.xp}</b>${x || ""}<br>Фокус: ${hms(s.fs)}<br>Задания: выполнено ${s.done} из ${s.plan}<br>Лучший день: ${s.best ? s.best.d + " (+" + s.best.xp + " XP)" : "—"}<br>Сильнейшая область: ${s.top ? esc(s.top[0]) : "—"} · слабейшая: ${s.low ? esc(s.low[0]) : "—"}</p></section>`;
  return `<div class="grid">${blk("Неделя (7 дней)", w, ` · Продвижение к прошлой неделе: ${adv > 0 ? "+" : ""}${adv}% ${this.arrow(adv)}`)}${blk("Цикл 90 дней", m, `<br>Закрыто этапов целей: ${st}<br>Текущий уровень: ${Xp.levelOf(S.totalXp)}`)}</div>`;
};
// --- Достижения и награды
const streakDays = () => {
  let n = 0,
    d = today();
  if (!dxp(d)) d = addDays(d, -1);
  while (dxp(d) > 0) {
    n++;
    d = addDays(d, -1);
  }
  return n;
};
const ACH = [
  ["first", "Первый шаг", "Получить первый XP", () => S.totalXp > 0],
  [
    "lvl",
    "Первый уровень",
    "Достичь уровня 2",
    () => Xp.levelOf(S.totalXp) >= 2,
  ],
  [
    "proj",
    "Первый проект",
    "Создать проект в цели",
    () => S.goals.some((g) => g.projects.length),
  ],
  ["s7", "Неделя в ритме", "7 дней подряд с XP", () => streakDays() >= 7],
  [
    "iron",
    "Железная дисциплина",
    "7 дней подряд молитва 6/6",
    () =>
      [0, 1, 2, 3, 4, 5, 6].every(
        (i) =>
          (S.days[addDays(today(), -i)]?.spirit || []).reduce(
            (a, b) => a + b,
            0,
          ) === 6,
      ),
  ],
  [
    "focus",
    "Мастер концентрации",
    "10 часов фокуса всего",
    () =>
      Object.values(S.days).reduce((s, r) => s + (r.focusSec || 0), 0) >= 36000,
  ],
  [
    "m30",
    "30 дней",
    "30 активных дней",
    () => Object.values(S.days).filter((r) => r.xp > 0).length >= 30,
  ],
  [
    "d90",
    "90 дней",
    "90 активных дней",
    () => Object.values(S.days).filter((r) => r.xp > 0).length >= 90,
  ],
];
const Ach = {
  check() {
    ACH.forEach(([id, n, , f]) => {
      if (!S.ach[id] && f()) {
        S.ach[id] = today();
        UI.toast("Достижение: " + n);
      }
    });
  },
};
UI.rewards = function () {
  return `<section class="card"><h3>Открыто ${Object.keys(S.ach).length} из ${ACH.length}</h3>${ACH.map(([id, n, d]) => `<div class="row" style="opacity:${S.ach[id] ? 1 : 0.45}"><span>${S.ach[id] ? "🏆" : "🔒"}</span><div class="g"><b>${n}</b><div class="dim">${d}${S.ach[id] ? " · " + S.ach[id] : ""}</div></div></div>`).join("")}</section>`;
};
// --- LEVEL UP на весь экран
UI.levelUp = function (L) {
  const R = {
    5: "ранг D",
    10: "ранг C",
    20: "ранг B",
    35: "ранг A",
    50: "ранг S",
  };
  this.modal(
    `<div style="text-align:center"><div class="dim">LEVEL UP</div><div class="big" style="font-size:80px">${L}</div><p>Ранг <b>${Xp.rank(L)}</b>${R[L] ? " — открыт " + R[L] + "!" : ""}</p><p class="dim">Следующий уровень: ${Xp.total(L + 1) - S.totalXp} XP</p><button class="b p" data-act="close">Продолжить</button></div>`,
  );
};
// --- Действия
const ExtraActs = {
  fgo: () => {
    if (!Focus.t0) {
      Focus.t0 = Date.now();
      Focus.tick = setInterval(() => Focus.paint(), 250);
    }
    return 1;
  },
  fpause: () => {
    Focus.stop();
    Focus.paint();
    return 1;
  },
  freset: () => {
    Focus.stop();
    Focus.base = 0;
    Focus.paint();
    return 1;
  },
  fend: () => {
    Focus.stop();
    const s = Focus.sec,
      k = S.skills.find((x) => x.id === $("fsk").value);
    if (s < 10 || !k) {
      UI.toast("Меньше 10 секунд — XP не начисляется");
      return 1;
    }
    const xp = Math.round((s / 60) * k.diff * (1 + Xp.streakBonus())),
      d = Day.get(today());
    d.focusSec = (d.focusSec || 0) + s;
    d.focus = Math.round(d.focusSec / 60);
    d.log[k.id] = (d.log[k.id] || 0) + xp;
    Xp.add(k, xp, today(), [
      "focus",
      "Фокус " + hms(s) + " × " + k.diff + " × бонус серии",
    ]);
    Focus.base = 0;
    UI.toast(`+${xp} XP · ${k.name} · ${hms(s)}`);
  },
  slsave: () => {
    Day.get(today()).sleep = +$("slp").value || 0;
  },
  light: () => {
    const d = Day.get(today()),
      tm = Day.get(addDays(today(), 1));
    let load = 0;
    d.plan
      .filter((e) => !e.done)
      .sort(
        (a, b) =>
          (S.skills.find((k) => k.id === b.skillId)?.prio || 0) -
          (S.skills.find((k) => k.id === a.skillId)?.prio || 0),
      )
      .forEach((e) => {
        const m = S.skills.find((k) => k.id === e.skillId)?.dur || 0;
        if (load + m > 120) {
          d.plan = d.plan.filter((x) => x !== e);
          tm.plan.push(e);
        } else load += m;
      });
    UI.toast("День облегчён: лишнее перенесено на завтра");
  },
  back: () => {
    Day.get(today()).plan.push({
      id: uid(),
      skillId: null,
      title: "Вернуться в ритм: 10 минут любого дела",
      time: "",
      done: false,
      xp: 0,
    });
  },
};
