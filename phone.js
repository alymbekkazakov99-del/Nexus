// Режим телефона: время в соцсетях, отвлечения, лимит. Влияет на дисциплину.
const ph = () => (S.phone = S.phone || { limit: 120, d: {} });
UI.phone = function () {
  const p = ph(),
    t = today(),
    d = p.d[t] || { m: 0, n: 0 },
    days = [...Array(7)].map((_, i) => addDays(t, i - 6)),
    mx = Math.max(p.limit, 1, ...days.map((x) => (p.d[x] || {}).m || 0)),
    ok = d.m <= p.limit,
    card = (i, l, v) =>
      `<div class="stat-card"><span class="stat-icon">${i}</span><div><p>${l}</p><strong>${v}</strong></div></div>`;
  return `<div class="stats-grid">${card("▤", "В соцсетях", d.m + " из " + p.limit + " мин") + card("⚡", "Отвлечений", d.n) + card(ok ? "✓" : "!", "Лимит", ok ? "в пределах" : "превышен")}</div>
 <div class="panel"><h3>Сегодня</h3><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><input id="phm" type="number" min="0" value="${d.m || ""}" placeholder="Минут в соцсетях" style="width:190px"><button class="b p" data-act="phsave">Сохранить</button><button class="b" data-act="phdist">+1 отвлечение</button><button class="b" data-act="phlim">Лимит: ${p.limit} мин</button></div><p class="dim">Уложились в лимит — +10 XP к дисциплине (раз в день).</p></div>
 <div class="panel"><h3>Неделя</h3><div class="chart">${days
   .map((x) => {
     const m = (p.d[x] || {}).m || 0;
     return `<i title="${x}: ${m} мин" style="height:${Math.max(2, (m / mx) * 100)}%;${m > p.limit ? "background:linear-gradient(180deg,var(--bad),var(--warn))" : ""}"></i>`;
   })
   .join("")}</div></div>`;
};
Object.assign(PanelActs, {
  phsave: () => {
    const m = +$("phm").value;
    if (!(m >= 0) || $("phm").value === "") {
      UI.toast("Введите минуты");
      return 1;
    }
    const p = ph(),
      t = today(),
      d = (p.d[t] = p.d[t] || { m: 0, n: 0 }),
      u = { id: "ph", stat: "Дисциплина" };
    d.m = m;
    if (m <= p.limit && !d.r) {
      d.r = 1;
      Xp.add(u, 10, t, ["phone", "Телефон в пределах лимита: " + m + " мин"]);
    } else if (m > p.limit && d.r) {
      d.r = 0;
      Xp.add(u, -10, t, ["phone", "Лимит телефона превышен"]);
    }
  },
  phdist: () => {
    const p = ph(),
      t = today(),
      d = (p.d[t] = p.d[t] || { m: 0, n: 0 });
    d.n++;
  },
  phlim: () => {
    UI.prompt("Лимит в день", "Минут в соцсетях", ph().limit, (v) => {
      const n = +v;
      if (!(n > 0)) {
        UI.toast("Нужно число больше нуля");
        return false;
      }
      ph().limit = n;
    });
    return 1;
  },
});
