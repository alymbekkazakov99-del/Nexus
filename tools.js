// Инструменты: быстрое добавление, поиск, горячие клавиши, знакомство, уведомления, звук, перетаскивание, PWA.
const Fx = {
  ctx: null,
  beep(f, ms, t = "sine") {
    if (S.sound === false) return;
    try {
      this.ctx =
        this.ctx || new (window.AudioContext || window.webkitAudioContext)();
      const o = this.ctx.createOscillator(),
        v = this.ctx.createGain();
      o.type = t;
      o.frequency.value = f;
      v.gain.value = 0.05;
      o.connect(v);
      v.connect(this.ctx.destination);
      o.start();
      o.stop(this.ctx.currentTime + ms / 1000);
    } catch (e) {}
  },
  ok() {
    this.beep(660, 90);
    try {
      if (S.sound !== false && navigator.vibrate) navigator.vibrate(25);
    } catch (e) {}
  },
  up() {
    [523, 659, 784, 1046].forEach((f, i) =>
      setTimeout(() => this.beep(f, 140, "triangle"), i * 120),
    );
  },
};
const _xadd = Xp.add;
Xp.add = function (...a) {
  const l = this.levelOf(S.totalXp),
    r = _xadd.apply(this, a);
  if (a[1] > 0) Fx.ok();
  if (this.levelOf(S.totalXp) > l) Fx.up();
  return r;
};
const QA = {
  open() {
    UI.modal(
      `<h3>Быстро добавить</h3><div class="jgrid" style="grid-template-columns:1fr 1fr">${[
        ["qtask", "◷", "Задание на сегодня"],
        ["qrem", "▦", "Напоминание"],
        ["qjr", "✎", "Запись в журнал"],
      ]
        .map(
          ([a, i, t]) =>
            `<button class="b" data-act="${a}" style="display:grid;gap:4px;justify-items:center"><span style="font-size:22px">${i}</span>${t}</button>`,
        )
        .join("")}</div><button class="b" data-act="close">Закрыть</button>`,
    );
  },
};
const Sr = {
  find(q) {
    q = q.toLowerCase().trim();
    if (q.length < 2) return [];
    const o = [],
      add = (t, tab, ic) => {
        if (t && String(t).toLowerCase().includes(q) && o.length < 30)
          o.push([ic, String(t), tab]);
      };
    S.skills.forEach((k) => add(k.name, "skills", "◆"));
    S.goals.forEach((g) => {
      add(g.title, "goals", "◎");
      g.projects.forEach((p) => {
        add(p.title, "goals", "▣");
        p.stages.forEach((s) => add(s.title, "goals", "·"));
      });
    });
    for (const d in S.journal)
      (S.journal[d] || []).forEach((t) => add(t, "journal", "✎"));
    for (const d in S.cal) S.cal[d].forEach((e) => add(e.title, "cal", "▦"));
    (S.tree || []).forEach((t) => {
      add(t.title, "tree", "⛓");
      t.nodes.forEach((n) => add(n.name, "tree", "·"));
    });
    return o;
  },
  open() {
    UI.modal(
      `<h3>Поиск</h3><input id="sq" placeholder="Навык, цель, запись, событие, контакт…" style="width:100%"><div id="sres"></div><button class="b" data-act="close">Закрыть</button>`,
    );
    setTimeout(() => {
      const i = document.getElementById("sq");
      if (i) i.focus();
    }, 30);
  },
};
document.addEventListener("input", (e) => {
  if (e.target.id === "sq") {
    const r = Sr.find(e.target.value);
    document.getElementById("sres").innerHTML =
      r
        .map(
          ([ic, t, tab]) =>
            `<div class="row go" data-act="sgo" data-id="${tab}"><span>${ic}</span><span class="g">${esc(t.slice(0, 80))}</span><span class="dim">${esc(TABS[tab] || "")}</span></div>`,
        )
        .join("") ||
      (e.target.value.length > 1
        ? '<p class="dim">Ничего не найдено.</p>'
        : "");
  }
});
document.addEventListener("keydown", (e) => {
  const t = e.target,
    m = document.getElementById("modal");
  if (
    /INPUT|TEXTAREA|SELECT/.test(t.tagName) ||
    e.ctrlKey ||
    e.metaKey ||
    e.altKey ||
    (m && !m.hidden) ||
    !Store.user
  )
    return;
  if (e.key === "/") {
    e.preventDefault();
    Sr.open();
  } else if (e.key === "n" || e.key === "т") QA.open();
});
const Onb = {
  shown: false,
  open() {
    UI.modal(
      `<h3>Добро пожаловать</h3><p class="dim">Три шага, чтобы начать:</p>${[
        ["skills", "1", "Добавьте свои навыки"],
        ["goals", "2", "Поставьте цель"],
        ["focus", "3", "Запустите первый фокус"],
      ]
        .map(
          ([t, n, x]) =>
            `<div class="row go" data-act="onbgo" data-id="${t}"><b>${n}</b><span class="g">${x}</span><span>›</span></div>`,
        )
        .join(
          "",
        )}<button class="b" data-act="onbx">Больше не показывать</button>`,
    );
  },
};
const _r6 = UI.render;
UI.render = function () {
  _r6.call(this);
  if (
    !S.onb &&
    !Onb.shown &&
    S.tab === "home" &&
    !S.goals.length &&
    !S.totalXp
  ) {
    Onb.shown = true;
    Onb.open();
  }
};
const Nt = {
  fired: {},
  tick() {
    if (
      !S.notify ||
      !Store.user ||
      !("Notification" in window) ||
      Notification.permission !== "granted"
    )
      return;
    const d = new Date(),
      t = today(),
      hh = p2(d.getHours()) + ":" + p2(d.getMinutes());
    [
      ...evFor(t)
        .filter((e) => e.time === hh)
        .map((e) => [e.id, e.title, CT[e.type]]),
      ...Day.get(t)
        .plan.filter((e) => !e.done && e.time === hh)
        .map((e) => [e.id, e.title, "Задание"]),
    ].forEach(([id, ti, b]) => {
      const k = t + id;
      if (!Nt.fired[k]) {
        Nt.fired[k] = 1;
        try {
          new Notification(ti, { body: b });
        } catch (x) {
          UI.toast("🔔 " + ti);
        }
      }
    });
  },
};
setInterval(() => {
  try {
    Nt.tick();
  } catch (e) {}
}, 20000);
// перетаскивание заданий между днями в «Расписании»
const Dnd = {
  move(id, day) {
    let ent = null;
    for (const d in S.days) {
      const i = S.days[d].plan.findIndex((x) => x.id === id && !x.done);
      if (i >= 0) {
        ent = S.days[d].plan.splice(i, 1)[0];
        break;
      }
    }
    if (ent) {
      Day.get(day).plan.push(ent);
      save();
      UI.render();
      UI.toast("Перенесено на " + day);
    }
    return !!ent;
  },
};
document.addEventListener("dragstart", (e) => {
  const r = e.target.closest && e.target.closest("[data-eid]");
  if (r) {
    e.dataTransfer.setData("text/plain", r.dataset.eid);
    e.dataTransfer.effectAllowed = "move";
  }
});
document.addEventListener("dragover", (e) => {
  if (e.target.closest && e.target.closest("[data-day]")) e.preventDefault();
});
document.addEventListener("drop", (e) => {
  const c = e.target.closest && e.target.closest("[data-day]");
  if (c) {
    e.preventDefault();
    Dnd.move(e.dataTransfer.getData("text/plain"), c.dataset.day);
  }
});
// новые разделы в меню
(() => {
  const L = { ...TABS, tree: "Направления" },
    o = [...NAVMAIN, ...NAVARCH];
  Object.keys(TABS).forEach((k) => delete TABS[k]);
  o.forEach((k) => (TABS[k] = L[k]));
  Object.assign(ICON, { tree: "⛓" });
})();
document.body.insertAdjacentHTML(
  "beforeend",
  '<button id="fab" class="fab" data-act="qadd" title="Быстро добавить (N)">＋</button>',
);
{
  const ta = document.querySelector(".topbar-actions");
  if (ta && !ta.querySelector("[data-act=search]"))
    ta.insertAdjacentHTML(
      "afterbegin",
      '<button class="b" data-act="search" title="Поиск (/)">⌕ Поиск</button>',
    );
}
if ("serviceWorker" in navigator && /^https?:/.test(location.protocol))
  navigator.serviceWorker.register("sw.js").catch(() => {});
Object.assign(PanelActs, {
  qadd: () => {
    QA.open();
    return 1;
  },
  search: () => {
    Sr.open();
    return 1;
  },
  qtask: () => {
    UI.prompt("Задание на сегодня", "Что нужно сделать?", "", (v) => {
      Day.get(today()).plan.push({
        id: uid(),
        skillId: null,
        title: v,
        time: "",
        done: false,
        xp: 0,
      });
    });
    return 1;
  },
  qrem: () => {
    UI.cd = today();
    calModal(today());
    return 1;
  },
  qjr: () => {
    UI.close();
    S.tab = "journal";
  },
  sgo: (id) => {
    UI.close();
    S.tab = id;
  },
  onbgo: (id) => {
    UI.close();
    S.tab = id;
  },
  onbx: () => {
    S.onb = 1;
    UI.close();
  },
  notif: () => {
    if (!("Notification" in window)) {
      UI.toast("Браузер не поддерживает уведомления");
      return 1;
    }
    if (S.notify) {
      S.notify = false;
      UI.toast("Уведомления выключены");
      return;
    }
    Notification.requestPermission().then((p) => {
      S.notify = p === "granted";
      save();
      UI.render();
      UI.toast(S.notify ? "Уведомления включены" : "Разрешение не получено");
    });
    return 1;
  },
  sound: () => {
    S.sound = S.sound === false;
    UI.toast("Звук: " + (S.sound === false ? "выключен" : "включён"));
  },
});
