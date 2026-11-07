// Журнал действий, боковая панель «Полная история», блоки «Следующий шаг» и «Активность».
const Audit = {
  add(a, d = "") {
    S.audit = S.audit || [];
    S.audit.unshift({ t: Date.now(), a, d });
    if (S.audit.length > 1000) S.audit.length = 1000;
  },
};
const hm = (t) => {
  const d = new Date(t);
  return p2(d.getHours()) + ":" + p2(d.getMinutes());
};
const dtm = (t) => {
  const d = new Date(t);
  return p2(d.getDate()) + "." + p2(d.getMonth() + 1) + " " + hm(t);
};
// Рекомендация: приоритет + «пора ли по ритму» + низкое мастерство + давность практики; уже сделанное сегодня — ниже
function nextStep() {
  let best = null,
    bs = -1e9;
  const t = today();
  S.skills.forEach((k) => {
    const gap = Math.min(14, Sched.lastDone(k.id, addDays(t, 1)) - 1),
      m = Mastery.calc(k).total,
      done = (S.days[t]?.plan || []).some((e) => e.skillId === k.id && e.done),
      sc =
        k.prio * 10 +
        (Sched.due(k, t) ? 25 : 0) +
        (100 - m) / 5 +
        gap -
        (done ? 60 : 0);
    if (sc > bs) {
      bs = sc;
      best = { k, m };
    }
  });
  return best;
}
const _home2 = UI.home;
UI.home = function () {
  const b = nextStep(),
    au = (S.audit || []).filter((x) => !x.a.startsWith("Переход")).slice(0, 8);
  return (
    _home2.call(this) +
    `<section class="card"><h3>Следующий шаг · Рекомендуемое действие</h3>` +
    (b
      ? `<div class="row"><div class="g"><b>${esc(b.k.name)} — ${b.k.dur} минут</b>
  <div class="dim">Приоритет: ${["", "низкий", "средний", "высокий"][b.k.prio]}. Мастерство сейчас ${b.m}%.</div><div class="dim">Рекомендация основана на приоритете, ритме навыка и текущем мастерстве.</div></div>
  <button class="b p" data-act="nextgo" data-id="${b.k.id}">Начать</button></div>`
      : '<p class="dim">Добавьте первый навык — и появится рекомендация.</p>') +
    `</section><section class="card"><h3>Активность · Последние действия</h3>${au.map((x) => `<div class="row"><div class="g"><b>${esc(x.a)}</b><div class="dim">${esc(x.d)}</div></div><span class="dim">${hm(x.t)}</span></div>`).join("") || '<p class="dim">Здесь появятся ваши первые действия.</p>'}</section>`
  );
};
const _nav2 = UI.nav;
UI.nav = function () {
  _nav2.call(this);
  const lo = $("nav").querySelector("[data-act=logout]");
  if (lo)
    lo.insertAdjacentHTML(
      "beforebegin",
      '<button data-act="hist">☷ История</button>',
    );
};
document.body.insertAdjacentHTML(
  "beforeend",
  '<div id="hov" class="hov" data-act="hclose"></div><aside id="hdr" class="hdr"></aside>',
);
function renderHistory() {
  $("hdr").innerHTML =
    `<div class="row"><div class="g"><div class="dim">ВСЕ ДЕЙСТВИЯ</div><h2 style="margin:0">Полная история</h2></div><button class="b" data-act="hclose">×</button></div>
 <p class="dim">Здесь сохраняется журнал действий: куда ты перешёл, что открыл, что создал, что завершил и какие изменения произошли.</p>` +
    ((S.audit || [])
      .slice(0, 300)
      .map(
        (x) =>
          `<div class="card" style="margin-bottom:8px;padding:10px"><div class="dim" style="color:var(--a)">${dtm(x.t)}</div><div>${esc(x.a)}</div>${x.d ? `<div class="dim">${esc(x.d)}</div>` : ""}</div>`,
      )
      .join("") || '<p class="dim">История пока пуста.</p>');
}
const PanelActs = {
  tab: (id) => {
    S.tab = id;
    Audit.add("Переход: " + TABS[id]);
  },
  hist: () => {
    renderHistory();
    $("hov").classList.add("open");
    $("hdr").classList.add("open");
    return 1;
  },
  hclose: () => {
    $("hov").classList.remove("open");
    $("hdr").classList.remove("open");
    return 1;
  },
  nextgo: (id) => {
    S.tab = "focus";
    Audit.add(
      "Выбрано рекомендованное действие",
      S.skills.find((k) => k.id === id)?.name || "",
    );
    save();
    UI.render();
    $("fsk").value = id;
    return 1;
  },
};
