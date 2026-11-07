// Профиль и аватар, настройки, анимация слов, завершение цели.
// ================= Профиль и аватар, настройки, анимация слов, завершение цели =================
function avHtml() {
  const a = S.avatar || { t: "letter" },
    nm = S.profile.name || "?";
  if (a.t === "img" || a.t === "draw") return `<img alt="" src="${esc(a.v)}">`;
  if (a.t === "emoji") return esc(a.v);
  return esc((a.v || nm[0] || "?").toUpperCase());
}
const _nav3 = UI.nav;
UI.nav = function () {
  _nav3.call(this);
  document.title = "Nexus";
  const q = (s) => document.querySelector(s),
    set = (s, t) => {
      const e = q(s);
      if (e) e.textContent = t;
    };
  set(".logo strong", "NEXUS");
  set(".logo span", "PERSONAL OS");
  set(".topbar .eyebrow", "ИНТЕРФЕЙС");
  const av = document.getElementById("topAvatar");
  if (av) av.innerHTML = avHtml();
  const pm = q(".player-mini");
  if (pm) {
    pm.dataset.act = "tab";
    pm.dataset.id = "set";
    pm.classList.add("go");
  }
};
const EMO = [
    "🦊",
    "🐺",
    "🦅",
    "🐉",
    "🚀",
    "🛰️",
    "⚡",
    "🔥",
    "🌙",
    "⭐",
    "🧠",
    "🛡️",
    "⚔️",
    "🎯",
    "🧭",
    "🌊",
    "🏔️",
    "🦁",
    "🐼",
    "👾",
  ],
  COLS = [
    "#0b1020",
    "#3fc8ff",
    "#a463ff",
    "#ff5e9e",
    "#ffc83d",
    "#4ff3c0",
    "#e9eeff",
    "#ff5b5b",
  ];
const Av = { m: "letter", name: "", goal: "", color: "#3fc8ff", cells: [] };
const avCap = () => {
  const n = document.getElementById("pfn"),
    g = document.getElementById("pfg");
  if (n) Av.name = n.value;
  if (g) Av.goal = g.value;
};
function profEdit() {
  const tabs = [
      ["letter", "Буква"],
      ["emoji", "Галерея"],
      ["draw", "Рисунок"],
      ["img", "Фото"],
    ],
    c = Av.cells.length === 144 ? Av.cells : (Av.cells = Array(144).fill(""));
  let body = "";
  if (Av.m === "letter")
    body = `<label class="dim">Буква или символ<input id="avl" maxlength="2" value="${esc((S.avatar && S.avatar.t === "letter" && S.avatar.v) || (Av.name || "?")[0].toUpperCase())}" style="width:100%"></label>`;
  else if (Av.m === "emoji")
    body = `<div class="jgrid" style="grid-template-columns:repeat(5,1fr)">${EMO.map((e) => `<button class="b" data-act="avpick" data-id="${e}" style="font-size:22px">${e}</button>`).join("")}</div>`;
  else if (Av.m === "draw")
    body = `<div style="display:flex;gap:6px;flex-wrap:wrap">${COLS.map((k) => `<button class="b ${Av.color === k ? "p" : ""}" data-act="avcol" data-id="${k}" style="background:${k};width:34px;height:34px;padding:0"></button>`).join("")}<button class="b ${Av.color === "" ? "p" : ""}" data-act="avcol" data-id="">Ластик</button></div>
  <div style="display:grid;grid-template-columns:repeat(12,1fr);gap:1px;margin:8px 0">${c.map((k, i) => `<button class="pc" data-act="avcell" data-id="${i}" style="background:${k || "var(--bg)"}"></button>`).join("")}</div><button class="b p" data-act="avdraw">Сделать аватаром</button>`;
  else
    body = `<label class="dim">Выберите картинку с устройства<input id="avf" type="file" accept="image/*" style="width:100%"></label>`;
  UI.modal(`<h3>Профиль</h3><div class="row" style="border:0"><div class="avatar" style="width:64px;height:64px;font-size:26px">${avHtml()}</div><div class="g"><input id="pfn" placeholder="Имя" maxlength="24" value="${esc(Av.name)}" style="width:100%;margin-bottom:6px"><input id="pfg" placeholder="Текущая цель" value="${esc(Av.goal)}" style="width:100%"></div></div>
 <div style="display:flex;gap:6px;flex-wrap:wrap">${tabs.map(([k, v]) => `<button class="b ${Av.m === k ? "p" : ""}" data-act="avtab" data-id="${k}">${v}</button>`).join("")}</div>${body}<button class="b p" data-act="profsave">Сохранить</button><button class="b" data-act="close">Закрыть</button>`);
}
document.addEventListener("change", (e) => {
  if (e.target.id === "avf" && e.target.files[0]) {
    const r = new FileReader();
    r.onload = () => {
      const im = new Image();
      im.onload = () => {
        const c = document.createElement("canvas");
        c.width = c.height = 96;
        const x = c.getContext("2d"),
          s = Math.min(im.width, im.height);
        x.drawImage(
          im,
          (im.width - s) / 2,
          (im.height - s) / 2,
          s,
          s,
          0,
          0,
          96,
          96,
        );
        S.avatar = { t: "img", v: c.toDataURL("image/jpeg", 0.85) };
        save();
        UI.render();
        profEdit();
        UI.toast("Фото установлено");
      };
      im.src = r.result;
    };
    r.readAsDataURL(e.target.files[0]);
  }
});
UI.set = function () {
  const cu = S.customThemes || [],
    id = S.theme || "dark",
    nm = S.profile.name || "Гость";
  return `<section class="card go" data-act="profile"><div class="row" style="border:0"><div class="big-avatar">${avHtml()}</div><div class="g"><h2>${esc(nm)}</h2><p class="dim">Уровень ${Xp.levelOf(S.totalXp)}${S.profile.goal ? " · " + esc(S.profile.goal) : ""}</p></div><button class="b p" data-act="profile">Изменить профиль</button></div></section>
 <section class="card"><h3>Оформление</h3><p class="dim">Тема</p><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">${[["dark", "Тёмная"], ["light", "Светлая"], ...cu.map((c) => [c.id, c.n])].map(([k, v]) => `<button class="b ${id === k ? "p" : ""}" data-act="theme" data-id="${k}">${esc(v)}</button>${cu.some((c) => c.id === k) ? `<button class="b" data-act="tdel" data-id="${k}">✕</button>` : ""}`).join("")}<button class="b" data-act="tnew" title="Своя тема">＋</button></div>
 <p class="dim" style="margin-top:14px">Фон — узор</p><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span>Сейчас: <b>${patName(S.bgp || "squares")}</b></span><button class="b p" data-act="patpick">Выбрать</button></div></section>
 <section class="card"><h3>Анимация</h3><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button class="b ${S.wordAnim ? "p" : ""}" data-act="wanim">Слова: ${S.wordAnim ? "включена" : "выключена"}</button><span class="dim">При наведении слово, шкала и цифра в одной строке оживают вместе.</span></div></section>
 <section class="card"><h3>Безопасность</h3><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="b" data-act="spass">Сменить пароль</button><button class="b" data-act="reckey">Ключ восстановления</button></div><p class="dim">Ключ нужен, если забудете пароль: без него данные не вернуть.</p></section>
 <section class="card"><h3>Уведомления и звук</h3><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="b ${S.notify ? "p" : ""}" data-act="notif">Уведомления: ${S.notify ? "включены" : "выключены"}</button><button class="b ${S.sound === false ? "" : "p"}" data-act="sound">Звук: ${S.sound === false ? "выключен" : "включён"}</button></div><p class="dim">Уведомления приходят, пока приложение открыто.</p></section>
 <section class="card"><h3>Данные</h3><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="b" data-act="exp">Экспорт</button><button class="b" data-act="expenc">Экспорт с паролем</button><label class="b" style="cursor:pointer">Импорт<input type="file" id="imp" accept=".json" hidden></label><button class="b" data-act="reset">Полный сброс</button></div></section>`;
};
const _r5 = UI.render;
UI.render = function () {
  document.body.classList.toggle("wa", !!S.wordAnim);
  _r5.call(this);
};
Object.assign(PanelActs, {
  profile: () => {
    const a = S.avatar || {};
    Av.name = S.profile.name || "";
    Av.goal = S.profile.goal || "";
    Av.m = ["emoji", "draw", "img"].includes(a.t) ? a.t : "letter";
    profEdit();
    return 1;
  },
  avtab: (id) => {
    avCap();
    Av.m = id;
    profEdit();
    return 1;
  },
  avcol: (id) => {
    avCap();
    Av.color = id;
    profEdit();
    return 1;
  },
  avcell: (id) => {
    avCap();
    Av.cells[+id] = Av.color;
    profEdit();
    return 1;
  },
  avpick: (id) => {
    avCap();
    S.avatar = { t: "emoji", v: id };
    save();
    UI.render();
    profEdit();
    return 1;
  },
  avdraw: () => {
    avCap();
    const r = Av.cells
      .map((k, i) =>
        k
          ? `<rect x='${i % 12}' y='${Math.floor(i / 12)}' width='1' height='1' fill='${k}'/>`
          : "",
      )
      .join("");
    S.avatar = {
      t: "draw",
      v:
        "data:image/svg+xml," +
        encodeURIComponent(
          `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' shape-rendering='crispEdges'><rect width='12' height='12' fill='#0b1020'/>${r}</svg>`,
        ),
    };
    save();
    UI.render();
    profEdit();
    UI.toast("Рисунок установлен");
    return 1;
  },
  profsave: () => {
    avCap();
    S.profile.name = Av.name.trim() || S.profile.name || "Гость";
    S.profile.goal = Av.goal.trim();
    if (Av.m === "letter") {
      const l = (document.getElementById("avl") || {}).value;
      S.avatar = {
        t: "letter",
        v: (l || S.profile.name[0] || "?").trim().slice(0, 2),
      };
    }
    UI.close();
    UI.toast("Профиль сохранён");
  },
  wanim: () => {
    S.wordAnim = !S.wordAnim;
    UI.toast("Анимация слов: " + (S.wordAnim ? "включена" : "выключена"));
  },
  gfin: (id) => {
    const g = S.goals.find((x) => x.id === id),
      sk = S.skills.find((k) => k.id === g.skillId);
    UI.confirm(
      "Завершить цель?",
      "«" + g.title + "» будет отмечена выполненной (+100 XP).",
      () => {
        g.done = true;
        g.doneAt = today();
        Xp.add(sk, 100, today(), ["stage", "Цель выполнена «" + g.title + "»"]);
        UI.toast("Цель завершена");
      },
      "Завершить",
    );
    return 1;
  },
});
