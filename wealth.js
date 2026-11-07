// Богатство: операции, баланс, цель накоплений, шаблон «Найти онлайн-работу».
const fin = () => (S.fin = S.fin || { tx: [], goal: null, cur: "" });
const money = (n) =>
  Math.round(n).toLocaleString("ru-RU") + (fin().cur ? " " + fin().cur : "");
const FC = [
  "Зарплата",
  "Фриланс",
  "Подарок",
  "Еда",
  "Жильё",
  "Транспорт",
  "Учёба",
  "Здоровье",
  "Развлечения",
  "Другое",
];
const Wl = {
  txForm() {
    UI.modal(
      `<h3>Новая операция</h3><select id="txt"><option value="exp">Расход</option><option value="inc">Доход</option></select><input id="txa" type="number" min="0" step="any" placeholder="Сумма"><select id="txc">${FC.map((c) => `<option>${c}</option>`).join("")}</select><input id="txn" placeholder="Заметка (необязательно)"><input id="txd" type="date" value="${today()}"><button class="b p" data-act="txsave">Сохранить</button><button class="b" data-act="close">Отмена</button>`,
    );
  },
};
UI.wealth = function () {
  const f = fin(),
    m = today().slice(0, 7),
    mt = f.tx.filter((t) => t.d.startsWith(m)),
    sum = (a, ty) => a.filter((t) => t.t === ty).reduce((s, t) => s + t.a, 0),
    bal = sum(f.tx, "inc") - sum(f.tx, "exp"),
    cats = {},
    g = f.goal;
  mt.filter((t) => t.t === "exp").forEach(
    (t) => (cats[t.c] = (cats[t.c] || 0) + t.a),
  );
  const cm = Math.max(1, ...Object.values(cats)),
    card = (i, l, v) =>
      `<div class="stat-card"><span class="stat-icon">${i}</span><div><p>${l}</p><strong>${v}</strong></div></div>`;
  return `<div class="stats-grid">${card("◈", "Баланс", money(bal)) + card("↗", "Доходы за месяц", money(sum(mt, "inc"))) + card("↘", "Расходы за месяц", money(sum(mt, "exp")))}</div>
 <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="b p" data-act="txadd">+ Операция</button><button class="b" data-act="wjob">Шаблон: найти онлайн-работу</button><button class="b" data-act="wcur">Валюта${f.cur ? ": " + esc(f.cur) : ""}</button></div>
 <div class="dashboard-grid"><div class="panel"><h3>Накопления</h3>${g ? `<b>${esc(g.title)}</b>${this.bar(Math.min(100, (g.saved / g.target) * 100))}<p class="dim">${money(g.saved)} из ${money(g.target)}</p><button class="b" data-act="wadd">Пополнить</button> <button class="b" data-act="wgoal">Изменить цель</button>` : '<p class="dim">Цели накоплений пока нет.</p><button class="b p" data-act="wgoal">Поставить цель</button>'}</div>
 <div class="panel"><h3>Расходы по категориям</h3>${
   Object.entries(cats)
     .sort((a, b) => b[1] - a[1])
     .map(
       ([c, v]) =>
         `<div class="attribute"><span>${c}</span>${this.bar((v / cm) * 100)}<b>${Math.round(v)}</b></div>`,
     )
     .join("") || '<p class="dim">В этом месяце расходов нет.</p>'
 }</div></div>
 <div class="panel"><h3>Операции</h3>${
   [...f.tx]
     .sort((a, b) => b.d.localeCompare(a.d))
     .slice(0, 30)
     .map(
       (t) =>
         `<div class="row"><span class="g"><b>${esc(t.c)}</b> <span class="dim">${t.d}${t.n ? " · " + esc(t.n) : ""}</span></span><b style="color:${t.t === "inc" ? "var(--ok)" : "var(--warn)"}">${t.t === "inc" ? "+" : "−"}${money(t.a)}</b><button class="b" data-act="txdel" data-id="${t.id}">✕</button></div>`,
     )
     .join("") || '<p class="dim">Операций пока нет.</p>'
 }</div>`;
};
Object.assign(PanelActs, {
  txadd: () => {
    Wl.txForm();
    return 1;
  },
  txsave: () => {
    const a = +$("txa").value;
    if (!(a > 0)) {
      UI.toast("Введите сумму больше нуля");
      return 1;
    }
    fin().tx.push({
      id: uid(),
      t: $("txt").value,
      a,
      c: $("txc").value,
      n: $("txn").value.trim(),
      d: $("txd").value || today(),
    });
    UI.close();
  },
  txdel: (id) => {
    fin().tx = fin().tx.filter((t) => t.id !== id);
  },
  wgoal: () => {
    const g = fin().goal || {};
    UI.modal(
      `<h3>Цель накоплений</h3><input id="wgt" placeholder="На что копим" value="${esc(g.title || "")}"><input id="wga" type="number" min="1" placeholder="Сколько нужно" value="${g.target || ""}"><button class="b p" data-act="wgsave">Сохранить</button><button class="b" data-act="close">Отмена</button>`,
    );
    return 1;
  },
  wgsave: () => {
    const t = $("wgt").value.trim(),
      a = +$("wga").value;
    if (!t || !(a > 0)) {
      UI.toast("Заполните название и сумму");
      return 1;
    }
    const g = fin().goal;
    fin().goal = { title: t, target: a, saved: g ? g.saved : 0 };
    UI.close();
  },
  wadd: () => {
    UI.prompt("Пополнить накопления", "Сумма", "", (v) => {
      const a = +v;
      if (!(a > 0)) {
        UI.toast("Нужна сумма больше нуля");
        return false;
      }
      fin().goal.saved += a;
    });
    return 1;
  },
  wcur: () => {
    UI.prompt(
      "Валюта",
      "Как подписывать суммы (например, сом). Пусто — без подписи",
      fin().cur,
      (v) => {
        fin().cur = v;
      },
      { empty: true },
    );
    return 1;
  },
  wjob: () => {
    if (S.goals.some((g) => g.title === "Найти онлайн-работу")) {
      UI.toast("Такая цель уже есть в «Целях»");
      return 1;
    }
    S.goals.push({
      id: uid(),
      title: "Найти онлайн-работу",
      skillId: "",
      url: "",
      projects: [
        {
          id: uid(),
          title: "Поиск работы",
          stages: [
            "Создать резюме",
            "Подготовить портфолио",
            "Найти вакансии",
            "Отправить 10 заявок",
            "Пройти собеседование",
            "Получить первую оплату",
          ].map((t) => ({ id: uid(), title: t, done: false })),
        },
      ],
    });
    UI.toast("Цель добавлена в «Цели»");
  },
});
