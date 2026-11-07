// Оболочка: боковое меню, шапка, «Обзор».
// Оформление: боковое меню, шапка, «Обзор» как в REAL PLAYER SYSTEM.
const ICON = {
  home: "⌂",
  skills: "◆",
  plan: "▤",
  focus: "◷",
  hist: "≋",
  goals: "◎",
  journal: "✎",
  review: "▥",
  rewards: "★",
  set: "⚙",
};
const NAVMAIN = ["home", "skills", "tree", "plan", "focus", "cal", "set"],
  NAVARCH = ["hist", "goals", "journal", "review", "rewards"];
UI.nav = function () {
  const nm = S.profile.name || "Гость",
    btn = (k) =>
      `<button class="nav-btn ${S.tab === k ? "active" : ""}" data-act="tab" data-id="${k}"><span>${ICON[k] || "•"}</span>${TABS[k]}</button>`,
    open = S.navArch || NAVARCH.includes(S.tab);
  $("nav").innerHTML =
    NAVMAIN.map(btn).join("") +
    `<button class="nav-btn arch" data-act="narch"><span>${open ? "▾" : "▸"}</span>${open ? "Скрыть архив" : "Архив"}</button>` +
    (open ? NAVARCH.map(btn).join("") : "");
  $("pageTitle").textContent = TABS[S.tab];
  $("topPlayerName").textContent = nm;
  $("topPlayerLevel").textContent = "Уровень " + Xp.levelOf(S.totalXp);
  $("topAvatar").textContent = nm[0].toUpperCase();
  $("sbot").innerHTML =
    `<div class="system-status"><span class="status-dot"></span>ONLINE</div><button class="reset-btn" data-act="logout">Выйти</button>`;
};
const _render = UI.render;
UI.render = function () {
  document.body.classList.remove("auth");
  _render.call(this);
};
const _screen = Auth.screen;
Auth.screen = function (m) {
  document.body.classList.add("auth");
  _screen.call(this, m);
};
UI.home = function () {
  const t = today(),
    d = Day.get(t),
    x = Xp.info(S.totalXp),
    pl = d.plan,
    dn = pl.filter((e) => e.done).length,
    pct = pl.length ? Math.round((dn / pl.length) * 100) : 0,
    sp = d.spirit.reduce((a, b) => a + b, 0),
    b = nextStep(),
    au = (S.audit || []).filter((a) => !a.a.startsWith("Переход")).slice(0, 8),
    low =
      dxp(addDays(t, -1)) === 0 &&
      dxp(addDays(t, -2)) === 0 &&
      dxp(t) === 0 &&
      Object.keys(S.days).some((k) => k < addDays(t, -2) && dxp(k) > 0),
    sc = (i, l, v, k) =>
      `<div class="stat-card go" data-act="tab" data-id="${k}"><span class="stat-icon">${i}</span><div><p>${l}</p><strong>${v}</strong></div></div>`;
  const row = (l, v) =>
    `<div class="state-row"><span>${l}</span><strong>${v}</strong></div>`;
  return (
    (low
      ? `<div class="panel" style="border-color:var(--warn)"><b>Замечено снижение активности.</b><p class="dim">Следующая задача — вернуться в ритм. Хватит одного маленького шага.</p><button class="b p" data-act="back">Мини-задание на 10 минут</button></div>`
      : "") +
    `<div class="stats-grid">${sc("⚡", "Сегодня", "+" + d.xp + " XP", "review") + sc("◈", "Всего", S.totalXp + " XP", "review") + sc("◷", "Фокус", hms(d.focusSec || 0), "focus") + sc("🔥", "Серия", streakDays() + " д.", "hist") + sc("⚔", "Задания", dn + "/" + pl.length, "plan")}</div>
 <div class="hero-card go" data-act="tab" data-id="rewards"><div class="player-info"><div class="big-avatar">${avHtml()}</div><div><h2>${esc(S.profile.name)}</h2><div class="rank">РАНГ: <span>${Xp.rank(x.L)}</span></div></div></div>
  <div class="level-info"><div class="level-number"><span>УРОВЕНЬ</span><strong>${x.L}</strong></div><div class="xp-area"><div class="xp-label"><span>ОПЫТ ДО СЛЕДУЮЩЕГО УРОВНЯ</span><span>${S.totalXp - Xp.total(x.L)} / ${Xp.total(x.L + 1) - Xp.total(x.L)}</span></div>${this.bar(x.pct)}</div></div></div>
 <div class="dashboard-grid"><div class="panel go" data-act="tab" data-id="skills"><h3>Характеристики</h3>${STATS.map(
   (s) => {
     const i = Xp.info(S.statXp[s] || 0);
     return `<div class="attribute"><span>${s}</span>${this.bar(i.pct)}<b>${i.L}</b></div>`;
   },
 ).join("")}</div>
  <div class="panel"><h3>Состояние</h3>${row("Восстановление", Recovery.calc() + "%")}${row("Импульс", Wave.impulse(t) + "%")}${row("Молитва", `<button class="b p" data-act="spirit">${sp} / 6</button>`)}</div></div>
 <div class="panel"><p class="eyebrow">СЕГОДНЯ</p><h3>Ежедневный прогресс</h3><div class="daily"><div class="circle" style="background:radial-gradient(circle,var(--panel) 58%,transparent 60%),conic-gradient(var(--a) ${pct * 3.6}deg,var(--line) 0)">${pct}%</div>
  <div><strong>${pl.length ? dn + " из " + pl.length + " заданий выполнено." : "На сегодня заданий нет — день восстановления."}</strong><p class="dim">Начинай с малого. Главное — реальный прогресс.</p></div></div>${this.rows(t)}<button class="b" data-act="eadd">+ Задание</button></div>
 ${this.sleepCard()}
 <div class="panel"><p class="eyebrow">СЛЕДУЮЩИЙ ШАГ</p><h3>Рекомендуемое действие</h3>${b ? `<div class="next-action-card"><div><strong>${esc(b.k.name)} — ${b.k.dur} минут</strong><p class="dim">Приоритет: ${["", "низкий", "средний", "высокий"][b.k.prio]}. Мастерство сейчас ${b.m}%.<br>Рекомендация основана на приоритете, ритме навыка и текущем мастерстве.</p></div><button class="b p" data-act="nextgo" data-id="${b.k.id}">Начать</button></div>` : '<p class="dim">Добавьте первый навык — и появится рекомендация.</p>'}</div>
 <div class="panel"><div class="row" style="border:0"><div class="g"><p class="eyebrow">АКТИВНОСТЬ</p><h3 style="margin:0">Последние действия</h3></div></div>
  ${au.map((a) => `<div class="row"><div class="activity-icon">⚡</div><div class="g"><b>${esc(a.a)}</b><div class="dim">${esc(a.d)}</div></div><span class="dim">${hm(a.t)}</span></div>`).join("") || '<p class="dim">Здесь появятся ваши первые действия.</p>'}</div>`
  );
};
Object.assign(PanelActs, {
  narch: () => {
    const o = S.navArch || NAVARCH.includes(S.tab);
    if (o) {
      S.navArch = false;
      if (NAVARCH.includes(S.tab)) S.tab = "home";
    } else S.navArch = true;
  },
});
