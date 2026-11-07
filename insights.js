// Умные подсказки: цикл 90 дней, разбор недели, слабые места, напоминание о резервной копии.
const Ins = {
  weak() {
    const t = today(),
      o = [];
    S.skills.forEach((k) => {
      const g = Sched.lastDone(k.id, addDays(t, 1)) - 1;
      if (g >= 7 && g < 98) o.push(`«${k.name}» не практиковался ${g} дн.`);
      else if (g >= 98 && S.totalXp > 0)
        o.push(`«${k.name}» ещё ни разу не практиковался`);
    });
    const w = {};
    for (let i = 0; i < 56; i++) {
      const d = addDays(t, -i),
        k = new Date(d + "T12:00").getDay();
      (w[k] = w[k] || []).push(S.days[d]?.xp || 0);
    }
    const WD = [
        "воскресеньям",
        "понедельникам",
        "вторникам",
        "средам",
        "четвергам",
        "пятницам",
        "субботам",
      ],
      av = Object.entries(w)
        .map(([k, a]) => [+k, a.reduce((s, x) => s + x, 0) / a.length])
        .sort((a, b) => a[1] - b[1]);
    if (S.totalXp > 0 && av.length && av[0][1] < av[av.length - 1][1] * 0.5)
      o.push(
        "Хуже всего идёт по " + WD[av[0][0]] + " — планируйте в эти дни легче",
      );
    const a = summary(7).xp,
      b = summary(7, 7).xp;
    if (b > 0 && a < b * 0.7)
      o.push(
        "Активность за неделю упала на " +
          Math.round((1 - a / b) * 100) +
          "% — выберите один лёгкий шаг, чтобы вернуться в ритм",
      );
    return o;
  },
  digest() {
    const w = summary(7),
      p = summary(7, 7),
      adv = p.xp ? Math.round(((w.xp - p.xp) / p.xp) * 100) : 0;
    return `За неделю: +${w.xp} XP (${adv >= 0 ? "+" : ""}${adv}% к прошлой), фокус ${hms(w.fs)}, задач ${w.done} из ${w.plan}. ${w.best ? "Лучший день — " + w.best.d + ". " : ""}${w.top && w.top[1] ? "Сильнее всего: " + w.top[0] + ". " : ""}${w.low && w.top && w.low[0] !== w.top[0] ? "Слабее всего: " + w.low[0] + " — следующий шаг: 20 минут на него." : ""}`;
  },
  cyc() {
    const c = (S.cycle = S.cycle || { start: today(), n: 1 }),
      day = Math.min(
        90,
        Math.round((new Date(today()) - new Date(c.start)) / 864e5) + 1,
      );
    return { c, day };
  },
};
const _rev2 = UI.review;
UI.review = function () {
  const { c, day } = Ins.cyc(),
    end = addDays(c.start, 89);
  let xp = 0,
    fs = 0,
    act = 0;
  for (let i = 0; i < day; i++) {
    const r = S.days[addDays(c.start, i)];
    if (r) {
      xp += r.xp;
      fs += r.focusSec || 0;
      if (r.xp > 0) act++;
    }
  }
  const wk = Ins.weak();
  return (
    `<div class="panel"><h3>Цикл 90 дней № ${c.n}</h3>${this.bar((day / 90) * 100)}<p class="dim">День ${day} из 90 · ${c.start} — ${end}</p><div class="stats-grid"><div class="stat-card"><div><p>XP</p><strong>+${xp}</strong></div></div><div class="stat-card"><div><p>Фокус</p><strong>${hms(fs)}</strong></div></div><div class="stat-card"><div><p>Активных дней</p><strong>${act}</strong></div></div></div>
 ${day >= 90 ? '<p><b style="color:var(--ok)">Цикл завершён — вот ваши итоги выше.</b></p>' : ""}<button class="b" data-act="cycnew">Начать новый цикл</button></div>
 <div class="dashboard-grid"><div class="panel"><h3>Разбор недели</h3><p>${Ins.digest()}</p></div><div class="panel"><h3>Слабые места</h3>${wk.map((x) => `<div class="row"><span class="g">${esc(x)}</span></div>`).join("") || '<p class="dim">Заметных провалов нет — так держать.</p>'}</div></div>` +
    _rev2.call(this)
  );
};
const _home5 = UI.home;
UI.home = function () {
  const wk = Ins.weak().slice(0, 2),
    old =
      S.totalXp > 0 && (!S.lastBackup || Date.now() - S.lastBackup > 7 * 864e5);
  const bk = old
    ? S.bkMin
      ? '<button class="bkline" data-act="bkopen" title="Напоминание о резервной копии" aria-label="Показать напоминание о резервной копии"></button>'
      : `<div class="panel" style="border-color:var(--warn)"><b>Пора сделать резервную копию.</b><p class="dim">Данные хранятся только на этом устройстве. Копия раз в неделю убережёт от потери.</p><button class="b p" data-act="exp">Скачать копию</button> <button class="b" data-act="bkmin">Потом</button></div>`
    : "";
  return (
    bk +
    _home5.call(this) +
    (wk.length
      ? `<div class="panel"><h3>Рекомендации</h3>${wk.map((x) => `<div class="row"><span class="g">${esc(x)}</span></div>`).join("")}</div>`
      : "")
  );
};
Object.assign(PanelActs, {
  cycnew: () => {
    UI.confirm(
      "Начать новый цикл?",
      "Отсчёт 90 дней начнётся с сегодняшнего дня. Старые данные сохранятся.",
      () => {
        const c = S.cycle || { n: 0 };
        S.cycle = { start: today(), n: c.n + 1 };
      },
      "Начать",
    );
    return 1;
  },
});
Object.assign(PanelActs, {
  bkmin: () => {
    S.bkMin = true;
  },
  bkopen: () => {
    S.bkMin = false;
  },
});
