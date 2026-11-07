// Экраны: журнал, итоги, календарь, темы и узоры.
// ---------- Журнал: выбор дня, состояние дня, шесть вопросов, список записей ----------
const JQ6 = [
  ["✔", "Что сделал?", "var(--ok)"],
  ["✖", "Что не сделал?", "var(--bad)"],
  ["⛔", "Что помешало?", "var(--warn)"],
  ["💡", "Что понял?", "var(--a)"],
  ["↻", "Что нужно изменить?", "var(--b)"],
  ["➜", "Что сделать завтра?", "var(--silver)"],
];
const jcap = () => {
  if ($("j0"))
    S.journal[UI.jd || today()] = JQ6.map((_, i) => $("j" + i).value.trim());
};
UI.journal = function () {
  const t = today(),
    dt = this.jd || t,
    r = S.days[dt],
    j = S.journal[dt] || [],
    mood = S.jmood[dt] || 0,
    pl = r?.plan || [],
    sp = (r?.spirit || []).reduce((a, b) => a + b, 0);
  const chip = (i, l, v, k) =>
    `<div class="stat-card go" data-act="tab" data-id="${k}"><span class="stat-icon">${i}</span><div><p>${l}</p><strong>${v}</strong></div></div>`;
  const list = [
    ...new Set([
      ...Object.keys(S.journal).filter((k) => S.journal[k].some(Boolean)),
      ...Object.keys(S.jmood),
    ]),
  ]
    .sort()
    .reverse()
    .slice(0, 30);
  return `<div class="panel"><div class="row" style="border:0"><button class="b" data-act="jgo" data-id="-1">‹</button><div class="g" style="text-align:center"><p class="eyebrow">ЗАПИСЬ ДНЯ</p><h2>${dt}${rel(dt)}</h2></div><button class="b" data-act="jgo" data-id="1" style="${dt >= t ? "opacity:.4" : ""}">›</button></div>
 <div class="stats-grid">${chip("⚡", "XP", r?.xp || 0, "review") + chip("◷", "Фокус", hms(r?.focusSec || 0), "focus") + chip("⚔", "Задания", pl.filter((e) => e.done).length + "/" + pl.length, "plan") + chip("◈", "Молитва", sp + "/6", "home") + chip("≋", "Импульс", Wave.impulse(dt) + "%", "hist")}</div></div>
 <div class="panel"><p class="eyebrow">СОСТОЯНИЕ ДНЯ</p><div style="display:flex;gap:8px;flex-wrap:wrap">${[1, 2, 3, 4, 5].map((n) => `<button class="b ${n === mood ? "p" : ""}" data-act="jmood" data-id="${n}">${n}</button>`).join("")}<span class="dim" style="align-self:center">${mood ? "Выбрано: " + mood + " — " + MOODS[mood] + " (сохранено)" : "1 — тяжело, 5 — отлично"}</span></div></div>
 <div class="jgrid">${JQ6.map(([ic, q, c], i) => `<div class="jq" style="border-left-color:${c}"><label style="color:${c}">${ic} ${q}</label><textarea id="j${i}" rows="3" style="width:100%">${esc(j[i] || "")}</textarea></div>`).join("")}</div>
 <div><button class="b p" data-act="jsave">Сохранить запись</button></div>
 <div class="panel"><div class="row" style="border:0"><p class="eyebrow g">ПРЕДЫДУЩИЕ ДНИ</p><button class="b" data-act="jall">Все записи</button></div>${list.map((k) => `<div class="row go" data-act="jday" data-id="${k}"><b>${k}</b><span class="dim g">${esc(((S.journal[k] || []).find(Boolean) || "").slice(0, 70))}</span><span>${"●".repeat(S.jmood[k] || 0)}</span></div>`).join("") || '<p class="dim">Записей пока нет.</p>'}</div>`;
};
// ---------- Итоги: период, показатели, график XP по дням, навыки ----------
UI.rp = 30;
UI.review = function () {
  const n = this.rp,
    w = summary(n),
    pw = summary(n, n),
    adv = pw.xp ? Math.round(((w.xp - pw.xp) / pw.xp) * 100) : w.xp ? 100 : 0,
    nb = Math.min(n, 30),
    sz = n / nb,
    by = {},
    bars = [];
  const days = [...Array(n)].map((_, i) => {
    const d = addDays(today(), -(n - 1 - i)),
      r = S.days[d];
    if (r) for (const k in r.log) by[k] = (by[k] || 0) + r.log[k];
    return { d, xp: r?.xp || 0 };
  });
  for (let i = 0; i < nb; i++) {
    const s = days.slice(Math.round(i * sz), Math.round((i + 1) * sz));
    bars.push({ xp: s.reduce((a, x) => a + x.xp, 0), l: s[0].d });
  }
  const mx = Math.max(1, ...bars.map((b) => b.xp)),
    sk = S.skills
      .map((k) => [k.name, by[k.id] || 0])
      .sort((a, b) => b[1] - a[1]),
    smx = Math.max(1, sk[0]?.[1] || 1),
    act = days.filter((x) => x.xp > 0).length;
  const card = (i, l, v, k) =>
    `<div class="stat-card go" data-act="tab" data-id="${k}"><span class="stat-icon">${i}</span><div><p>${l}</p><strong>${v}</strong></div></div>`;
  return `<div class="panel"><p class="eyebrow">ПЕРИОД · ${days[0].d} — ${days[n - 1].d}</p><div style="display:flex;gap:8px;flex-wrap:wrap">${[
    [7, "Неделя"],
    [30, "Месяц"],
    [60, "60 дней"],
    [90, "90 дней"],
  ]
    .map(
      ([v, l]) =>
        `<button class="b ${v === n ? "p" : ""}" data-act="rp" data-id="${v}">${l}</button>`,
    )
    .join("")}</div></div>
 <div class="stats-grid">${card("⚡", "XP за период", "+" + w.xp + " " + this.arrow(adv), "hist") + card("◷", "Фокус", hms(w.fs), "focus") + card("⚔", "Выполнено", w.done + "/" + w.plan, "plan") + card("📅", "Активных дней", act + " из " + n, "cal")}</div>
 <p class="dim">Сравнение с предыдущим периодом: ${adv > 0 ? "+" : ""}${adv}%</p>
 <div class="panel"><p class="eyebrow">XP ПО ДНЯМ</p><div class="chart">${bars.map((b) => `<i title="${b.l}: ${b.xp} XP" style="height:${Math.max(2, (b.xp / mx) * 100)}%"></i>`).join("")}</div></div>
 <div class="dashboard-grid"><div class="panel"><p class="eyebrow">НАВЫКИ</p>${
   sk
     .slice(0, 8)
     .map(
       ([nm, v]) =>
         `<div class="attribute"><span>${esc(nm)}</span><div class="bar"><i style="width:${(v / smx) * 100}%"></i></div><b>${v}</b></div>`,
     )
     .join("") || '<p class="dim">Нет данных.</p>'
 }</div>
 <div class="panel"><p class="eyebrow">ВЫВОДЫ</p><div class="state-row"><span>Сильнейшая область</span><strong>${w.top && w.top[1] ? esc(w.top[0]) : "—"}</strong></div><div class="state-row"><span>Слабейшая область</span><strong>${w.low ? esc(w.low[0]) : "—"}</strong></div><div class="state-row"><span>Лучший день</span><strong>${w.best ? w.best.d + " · +" + w.best.xp : "—"}</strong></div></div></div>`;
};
Object.assign(PanelActs, {
  jgo: (id) => {
    jcap();
    const d = addDays(UI.jd || today(), +id);
    if (d > today()) {
      UI.toast("Завтрашний день ещё не наступил");
      return 1;
    }
    UI.modal(
      `<h3>Перейти в ${+id > 0 ? "следующий" : "предыдущий"} день?</h3><p class="dim">${d}</p><div style="display:flex;gap:8px"><button class="b p" data-act="jyes" data-id="${d}">Да</button><button class="b" data-act="close">Нет</button></div>`,
    );
    return 1;
  },
  jyes: (id) => {
    UI.close();
    UI.jd = id;
  },
  jday: (id) => {
    jcap();
    UI.jd = id;
  },
  jmood: (id) => {
    jcap();
    S.jmood = S.jmood || {};
    S.jmood[UI.jd || today()] = +id;
    UI.toast("Состояние дня сохранено: " + id + " — " + MOODS[+id]);
  },
  jsave: () => {
    jcap();
    UI.toast("Запись сохранена");
  },
  rp: (id) => {
    UI.rp = +id;
    UI.toast(
      "Период: " +
        { 7: "неделя", 30: "месяц", 60: "60 дней", 90: "90 дней" }[+id],
    );
  },
});
// ---------- Все записи журнала (окно с фильтром по вопросам) ----------
UI.jf = -1;
function jAll() {
  const f = UI.jf,
    ks = Object.keys(S.journal)
      .filter((k) => S.journal[k].some(Boolean))
      .sort()
      .reverse();
  UI.modal(
    `<h3>Все записи</h3><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="b ${f < 0 ? "p" : ""}" data-act="jf" data-id="-1">Все</button>${JQ6.map((q, i) => `<button class="b ${f === i ? "p" : ""}" data-act="jf" data-id="${i}">${q[1]}</button>`).join("")}</div>` +
      (ks
        .map((k) => {
          const a = S.journal[k],
            pt = (
              f < 0 ? JQ6.map((q, i) => [q, a[i]]) : [[JQ6[f], a[f]]]
            ).filter((x) => x[1]);
          return pt.length
            ? `<div class="jq"><b>${k}</b>${S.jmood[k] ? " · " + "●".repeat(S.jmood[k]) : ""}${pt.map(([q, v]) => `<div><span style="color:${q[2]}">${q[0]} ${q[1]}</span><div class="dim">${esc(v)}</div></div>`).join("")}</div>`
            : "";
        })
        .join("") || '<p class="dim">Записей нет.</p>') +
      '<button class="b" data-act="close">Закрыть</button>',
  );
}
document.addEventListener("change", (e) => {
  if (/^j[0-5]$/.test(e.target.id)) {
    jcap();
    save();
  }
});
// ---------- Календарь: активные дни и напоминания ----------
const MN = [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
  ],
  CT = { rem: "🔔 Напоминание", hol: "🎉 Праздник", ev: "📌 Событие" };
delete TABS.set;
TABS.cal = "Календарь";
TABS.set = "Настройки";
ICON.cal = "▦";
UI.cm = today().slice(0, 7);
UI.cd = null;
UI.cal = function () {
  const [y, m] = this.cm.split("-").map(Number),
    t = today(),
    sel = this.cd || t,
    first = (new Date(y, m - 1, 1).getDay() + 6) % 7,
    n = new Date(y, m, 0).getDate();
  let c = "",
    act = 0,
    past = 0;
  for (let i = 0; i < first; i++) c += "<span></span>";
  for (let d = 1; d <= n; d++) {
    const ds = `${y}-${p2(m)}-${p2(d)}`,
      xp = dxp(ds),
      st = ds > t ? "fut" : xp > 0 ? "act" : "off";
    if (ds <= t) {
      past++;
      if (xp > 0) act++;
    }
    c += `<button class="cd ${st} ${ds === t ? "today" : ""} ${ds === sel ? "sel" : ""}" data-act="cday" data-id="${ds}" style="--k:${Math.min(1, xp / 350)}"><b>${d}</b>${evFor(ds).length ? "<i></i>" : ""}</button>`;
  }
  const ev = evFor(sel),
    r = S.days[sel],
    up = [];
  for (let i = 0; i < 60 && up.length < 6; i++) {
    const k = addDays(t, i);
    evFor(k).forEach((e) => up.push([k, e]));
  }
  return `<div class="panel"><div class="row" style="border:0"><button class="b" data-act="cm" data-id="-1">‹</button><div class="g" style="text-align:center"><h2>${MN[m - 1]} ${y}</h2><span class="dim">Активных дней: ${act} из ${past}</span></div><button class="b" data-act="cm" data-id="1">›</button></div>
 <div class="cal">${["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((x) => `<span class="cw">${x}</span>`).join("")}${c}</div><p class="dim" style="margin-top:10px">Яркий — день с активностью, пунктир — без активности, точка — есть напоминание.</p><button class="b" data-act="cm" data-id="0">Сегодня</button></div>
 <div class="dashboard-grid"><div class="panel"><p class="eyebrow">${sel}</p><h3>${r ? `XP +${r.xp} · задания ${r.plan.filter((e) => e.done).length}/${r.plan.length}` : "Записей за день нет"}</h3>
  ${ev.map((e) => `<div class="row"><span class="g"><b>${esc(e.title)}</b><div class="dim">${CT[e.type]}${e.rep ? " 🔁" : ""}${e.time ? " · " + e.time : ""}</div></span><button class="b" data-act="cdel" data-id="${e.id}">✕</button></div>`).join("") || '<p class="dim">На этот день ничего нет.</p>'}
  <button class="b p" data-act="cmodal" data-id="${sel}" style="margin-top:8px">+ Добавить на этот день</button></div>
  <div class="panel"><p class="eyebrow">БЛИЖАЙШИЕ</p>${up.map(([k, e]) => `<div class="row go" data-act="cday" data-id="${k}"><b>${k}</b><span class="g">${esc(e.title)}</span></div>`).join("") || '<p class="dim">Напоминаний нет.</p>'}</div></div>`;
};
Object.assign(PanelActs, {
  cm: (id) => {
    if (+id === 0) {
      UI.cm = today().slice(0, 7);
      UI.cd = today();
      return;
    }
    const [y, m] = UI.cm.split("-").map(Number),
      d = new Date(y, m - 1 + +id, 1);
    UI.cm = d.getFullYear() + "-" + p2(d.getMonth() + 1);
  },
  cday: (id) => {
    UI.cd = id;
    UI.cm = id.slice(0, 7);
    S.tab = "cal";
  },
  cadd: () => {
    const t = $("ct").value.trim();
    if (!t) {
      UI.toast("Напишите, что произойдёт");
      return 1;
    }
    const d = UI.cd || today();
    (S.cal[d] = S.cal[d] || []).push({
      id: uid(),
      title: t,
      time: $("ctm").value,
      type: $("cty").value,
      rep: ($("cre") || {}).value || "",
    });
    Audit.add("Календарь: " + t, d);
  },
  cdel: (id) => {
    for (const k in S.cal) S.cal[k] = S.cal[k].filter((e) => e.id !== id);
  },
  jall: () => {
    UI.jf = -1;
    jAll();
    return 1;
  },
  jf: (id) => {
    UI.jf = +id;
    jAll();
    return 1;
  },
  theme: (id) => {
    S.theme = id;
  },
});
// напоминания на сегодня — в «Обзоре»
const _home3 = UI.home;
UI.home = function () {
  const e = evFor(today());
  return (
    (e.length
      ? `<div class="panel go" data-act="cday" data-id="${today()}"><p class="eyebrow">СЕГОДНЯ В КАЛЕНДАРЕ</p>${e.map((x) => `<div class="row"><b class="g">${esc(x.title)}</b><span class="dim">${CT[x.type]}${x.time ? " · " + x.time : ""}</span></div>`).join("")}</div>`
      : "") + _home3.call(this)
  );
};
// ---------- Оформление в «Настройках» ----------
// ---------- Календарь: окно выбранного дня ----------
function calModal(d) {
  const ev = evFor(d),
    r = S.days[d];
  UI.modal(`<h3>${d}</h3><p class="dim">${r ? `XP +${r.xp} · задания ${r.plan.filter((e) => e.done).length}/${r.plan.length}` : "Активности в этот день нет"}</p>
 ${ev.map((e) => `<div class="row"><span class="g"><b>${esc(e.title)}</b><div class="dim">${CT[e.type]}${e.rep ? " 🔁" : ""}${e.time ? " · " + e.time : ""}</div></span><button class="b" data-act="cdel" data-id="${e.id}">✕</button></div>`).join("") || '<p class="dim">Пока ничего не добавлено.</p>'}
 <input id="ct" placeholder="Праздник, дело или напоминание" style="width:100%"><div style="display:flex;gap:8px"><input id="ctm" type="time"><select id="cty">${Object.entries(
   CT,
 )
   .map(([k, v]) => `<option value="${k}">${v}</option>`)
   .join("")}</select></div>
 <select id="cre" style="width:100%"><option value="">Без повтора</option><option value="w">Каждую неделю</option><option value="m">Каждый месяц</option><option value="y">Каждый год</option></select><button class="b p" data-act="cadd">Добавить</button><button class="b" data-act="close">Готово</button>`);
}
// ---------- Темы, свои цвета и узор фона ----------
const hx = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixc = (a, b, t) => {
  const x = hx(a),
    y = hx(b);
  return (
    "#" +
    x
      .map((v, i) =>
        Math.round(v + (y[i] - v) * t)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
};
const BASE = {
  dark: {
    n: "Тёмная",
    bg: "#04060f",
    panel: "#0a0f26",
    a: "#3fc8ff",
    b: "#a463ff",
    tx: "#e9eeff",
  },
  light: {
    n: "Светлая",
    bg: "#ffffff",
    panel: "#f1f2f5",
    a: "#111827",
    b: "#4b5563",
    tx: "#0a0a0f",
  },
};
const PAT = {
  squares: ["Квадраты", "<rect x='.5' y='.5' width='47' height='47'/>"],
  triangles: ["Треугольники", "<path d='M24 6L42 40H6Z'/>"],
  circles: ["Круги", "<circle cx='24' cy='24' r='14'/>"],
  diamonds: ["Ромбы", "<path d='M24 4L44 24L24 44L4 24Z'/>"],
  pentagons: ["Пятиугольники", "<path d='M24 5L42 18.5L35 40H13L6 18.5Z'/>"],
  none: ["Без узора", ""],
};
document.body.insertAdjacentHTML("afterbegin", '<div id="bgp"></div>');
function applyTheme() {
  const t =
      BASE[S.theme] ||
      (S.customThemes || []).find((x) => x.id === S.theme) ||
      BASE.dark,
    a = hx(t.a),
    v = {
      "--bg": t.bg,
      "--panel": t.panel,
      "--panel2": mixc(t.panel, t.a, 0.12),
      "--line": mixc(t.panel, t.a, 0.35),
      "--tx": t.tx,
      "--dim": mixc(t.tx, t.bg, 0.42),
      "--silver": mixc(t.tx, t.a, 0.15),
      "--a": t.a,
      "--b": t.b,
      "--onp":
        (a[0] * 299 + a[1] * 587 + a[2] * 114) / 1000 > 140
          ? "#05091a"
          : "#ffffff",
    };
  [
    ["--ar", t.a],
    ["--br", t.b],
    ["--sr", v["--silver"]],
  ].forEach(([k, c]) => (v[k] = hx(c).join(" ")));
  for (const k in v) document.body.style.setProperty(k, v[k]);
  const sh = patShape(S.bgp || "squares"),
    mk = (o) =>
      sh
        ? `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' fill='none' stroke='rgb(${a.join(",")})' stroke-opacity='${o}'>${sh.replace(/COL/g, "rgb(" + a.join(",") + ")")}</svg>`)}")`
        : "none";
  document.getElementById("bgp").style.backgroundImage = mk(0.22);
  document.body.style.setProperty("--pat", mk(0.1));
}

const _r3 = UI.render;
UI.render = function () {
  applyTheme();
  _r3.call(this);
};
const _scr2 = Auth.screen;
Auth.screen = function (m) {
  applyTheme();
  _scr2.call(this, m);
};
Object.assign(PanelActs, {
  cday: (id) => {
    UI.cd = id;
    UI.cm = id.slice(0, 7);
    S.tab = "cal";
    save();
    UI.render();
    calModal(id);
    return 1;
  },
  cmodal: (id) => {
    UI.cd = id;
    calModal(id);
    return 1;
  },
  cadd: () => {
    const t = $("ct").value.trim();
    if (!t) {
      UI.toast("Напишите, что произойдёт");
      return 1;
    }
    const d = UI.cd || today();
    (S.cal[d] = S.cal[d] || []).push({
      id: uid(),
      title: t,
      time: $("ctm").value,
      type: $("cty").value,
      rep: ($("cre") || {}).value || "",
    });
    Audit.add("Календарь: " + t, d);
    save();
    UI.render();
    calModal(d);
    return 1;
  },
  cdel: (id) => {
    for (const k in S.cal) S.cal[k] = S.cal[k].filter((e) => e.id !== id);
    save();
    UI.render();
    calModal(UI.cd || today());
    return 1;
  },
  tnew: () => {
    UI.modal(
      `<h3>Новая тема</h3><input id="tn" placeholder="Название темы"><div class="jgrid">${[
        ["tc1", "Фон", "#0b0b14"],
        ["tc2", "Панели", "#16162a"],
        ["tc3", "Акцент 1", "#ff5e9e"],
        ["tc4", "Акцент 2", "#ffb347"],
        ["tc5", "Текст", "#f2f2f8"],
      ]
        .map(
          ([i, l, c]) =>
            `<label class="dim">${l}<br><input id="${i}" type="color" value="${c}" style="width:100%;height:42px;padding:2px"></label>`,
        )
        .join(
          "",
        )}</div><button class="b p" data-act="tok">ОК</button><button class="b" data-act="close">Отмена</button>`,
    );
    return 1;
  },
  tok: () => {
    const t = {
      id: "c" + uid(),
      n: $("tn").value.trim() || "Моя тема",
      bg: $("tc1").value,
      panel: $("tc2").value,
      a: $("tc3").value,
      b: $("tc4").value,
      tx: $("tc5").value,
    };
    (S.customThemes = S.customThemes || []).push(t);
    S.theme = t.id;
    UI.close();
  },
  theme: (id) => {
    S.theme = id;
  },
  tdel: (id) => {
    S.customThemes = (S.customThemes || []).filter((c) => c.id !== id);
    if (S.theme === id) S.theme = "dark";
  },
  bgp: (id) => {
    S.bgp = id;
  },
});
// ================= Дополнения: состояние дня, итоги, календарь, оформление =================
const MOODS = ["", "тяжело", "так себе", "нормально", "хорошо", "отлично"],
  MON = [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ];
const rel = (d) => {
  const k = Math.round((new Date(today()) - new Date(d)) / 864e5);
  return k <= 0
    ? " · сегодня"
    : k === 1
      ? " · вчера"
      : " · " + k + " дн. назад";
};
// на случай старых данных
const _r4 = UI.render;
UI.render = function () {
  S.jmood = S.jmood || {};
  S.cal = S.cal || {};
  S.audit = S.audit || [];
  S.journal = S.journal || {};
  S.customThemes = S.customThemes || [];
  _r4.call(this);
};
// переименование пунктов молитвы сохраняется сразу
document.addEventListener("change", (e) => {
  if (/^sp[0-5]$/.test(e.target.id)) {
    const i = +e.target.id.slice(2);
    S.spirit[i] = e.target.value.trim() || "Пункт " + (i + 1);
    save();
    UI.toast("Название сохранено");
  }
});
// «Итоги»: что произошло по дням (неделя) или по неделям (месяц, 60, 90 дней)
const _rev = UI.review;
UI.review = function () {
  const n = this.rp,
    days = [...Array(n)].map((_, i) => addDays(today(), -(n - 1 - i))),
    gs = n <= 7 ? 1 : 7,
    grp = [];
  for (let e = n; e > 0; e -= gs)
    grp.unshift(days.slice(Math.max(0, e - gs), e));
  const what = `<div class="panel"><p class="eyebrow">ЧТО ПРОИЗОШЛО</p>${grp
    .reverse()
    .map((g) => {
      const rr = g.map((d) => S.days[d]).filter(Boolean),
        xp = rr.reduce((s, r) => s + r.xp, 0),
        dn = rr.reduce((s, r) => s + r.plan.filter((e) => e.done).length, 0),
        pn = rr.reduce((s, r) => s + r.plan.length, 0),
        fs = rr.reduce((s, r) => s + (r.focusSec || 0), 0),
        sp = rr.reduce((s, r) => s + r.spirit.reduce((a, b) => a + b, 0), 0);
      return `<div class="row"><b style="min-width:${gs === 1 ? 90 : 130}px">${g.length === 1 ? g[0] : g[0].slice(5) + " — " + g[g.length - 1].slice(5)}</b><span class="g"><div class="bar"><i style="width:${Math.min(100, (xp / (350 * g.length)) * 100)}%"></i></div></span><span class="dim">+${xp} XP · ${dn}/${pn} задач · ${hms(fs)} · молитва ${sp}</span></div>`;
    })
    .join("")}</div>`;
  const mark =
    '<div class="dashboard-grid"><div class="panel"><p class="eyebrow">НАВЫКИ</p>';
  return _rev.call(this).replace(mark, what + mark);
};
// «Календарь»: подсказка внизу при наведении на число
const _cal = UI.cal;
UI.cal = function () {
  const s = this.cd || today(),
    [y, m, d] = s.split("-").map(Number);
  return _cal
    .call(this)
    .replace(
      '<button class="b" data-act="cm" data-id="0">Сегодня</button>',
      `<button class="b p" id="chover" data-act="cmodal" data-id="${s}" style="width:100%;margin:10px 0">+ Добавить на этот день: ${d} ${MON[m - 1]}</button><button class="b" data-act="cm" data-id="0">Сегодня</button>`,
    );
};
document.addEventListener("mouseover", (e) => {
  const c = e.target.closest && e.target.closest(".cd[data-id]"),
    h = document.getElementById("chover");
  if (c && h) {
    const [y, m, d] = c.dataset.id.split("-").map(Number);
    h.textContent = "+ Добавить на этот день: " + d + " " + MON[m - 1];
    h.dataset.id = c.dataset.id;
  }
});
// ---------- Оформление: одна карточка, выбор узора окном, свой узор 8×8 ----------
const patShape = (k) =>
  k === "custom"
    ? (S.cpat || [])
        .map((v, i) =>
          v
            ? `<rect x='${(i % 8) * 6}' y='${Math.floor(i / 8) * 6}' width='6' height='6' fill='COL' fill-opacity='.5' stroke='none'/>`
            : "",
        )
        .join("")
    : (PAT[k] || PAT.squares)[1];
const patName = (k) =>
  k === "custom" ? "Свой узор" : (PAT[k] || PAT.squares)[0];

function patPicker() {
  const cur = S.bgp || "squares",
    ks = [...Object.keys(PAT), "custom"];
  UI.modal(
    `<h3>Фон — узор</h3><div class="jgrid" style="grid-template-columns:repeat(auto-fit,minmax(120px,1fr))">${ks.map((k) => `<button class="b ${cur === k ? "p" : ""}" data-act="${k === "custom" ? "pedit" : "bgp"}" data-id="${k}" style="display:grid;gap:4px;justify-items:center"><svg width="44" height="44" viewBox="0 0 48 48" fill="none" stroke="currentColor">${patShape(k).replace(/COL/g, "currentColor")}</svg>${k === "custom" ? "Нарисовать свой" : patName(k)}</button>`).join("")}</div><button class="b" data-act="close">Закрыть</button>`,
  );
}
function patEditor() {
  const c = (S.cpat =
    S.cpat && S.cpat.length === 64 ? S.cpat : Array(64).fill(0));
  UI.modal(`<h3>Нарисуйте свой узор</h3><p class="dim">Нажимайте на клетки — узор будет повторяться по всему фону.</p><div style="display:grid;grid-template-columns:repeat(8,1fr);gap:3px">${c.map((v, i) => `<button class="pc ${v ? "on" : ""}" data-act="pcell" data-id="${i}"></button>`).join("")}</div>
 <button class="b p" data-act="pok">Применить</button><button class="b" data-act="pclr">Очистить</button><button class="b" data-act="close">Закрыть</button>`);
}
Object.assign(PanelActs, {
  cm: (id) => {
    if (+id === 0) {
      UI.cm = today().slice(0, 7);
      UI.cd = today();
      return;
    }
    const [y, m] = UI.cm.split("-").map(Number),
      d = new Date(y, m - 1 + +id, 1);
    UI.cm = d.getFullYear() + "-" + p2(d.getMonth() + 1);
    UI.toast(MN[d.getMonth()] + " " + d.getFullYear());
  },
  patpick: () => {
    patPicker();
    return 1;
  },
  pedit: () => {
    patEditor();
    return 1;
  },
  bgp: (id) => {
    S.bgp = id;
    UI.close();
  },
  pcell: (id) => {
    S.cpat[+id] = S.cpat[+id] ? 0 : 1;
    save();
    patEditor();
    return 1;
  },
  pclr: () => {
    S.cpat = Array(64).fill(0);
    patEditor();
    return 1;
  },
  pok: () => {
    S.bgp = "custom";
    UI.close();
  },
  theme: (id) => {
    S.theme = id;
    UI.toast(
      "Тема: " +
        ({ dark: "Тёмная", light: "Светлая" }[id] ||
          ((S.customThemes || []).find((c) => c.id === id) || {}).n ||
          ""),
    );
  },
});
// События с повтором (неделя / месяц / год): все события, попадающие на дату
function evFor(ds) {
  const out = [];
  for (const k in S.cal) {
    if (k > ds) continue;
    for (const e of S.cal[k]) {
      if (k === ds) {
        out.push(e);
        continue;
      }
      if (!e.rep) continue;
      const a = new Date(k + "T12:00"),
        b = new Date(ds + "T12:00"),
        ok =
          e.rep === "w"
            ? Math.round((b - a) / 864e5) % 7 === 0
            : e.rep === "m"
              ? a.getDate() === b.getDate()
              : a.getDate() === b.getDate() && a.getMonth() === b.getMonth();
      if (ok) out.push(e);
    }
  }
  return out;
}
