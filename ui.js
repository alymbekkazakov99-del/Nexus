// Интерфейс: каждая вкладка — функция, возвращающая HTML.
const TABS = {
  home: "Обзор",
  skills: "Навыки",
  plan: "Расписание",
  focus: "Фокус",
  hist: "Путь",
  goals: "Цели",
  journal: "Журнал",
  review: "Итоги",
  rewards: "Достижения",
  set: "Настройки",
};
const UI = {
  toast(t) {
    const e = document.getElementById("toast");
    e.textContent = t;
    e.hidden = false;
    setTimeout(() => (e.hidden = true), 2600);
  },
  modal(h) {
    const m = document.getElementById("modal");
    m.innerHTML = "<div>" + h + "</div>";
    m.hidden = false;
  },
  close() {
    document.getElementById("modal").hidden = true;
  },
  bar: (p) =>
    `<div class="bar"><i style="width:${Math.max(0, Math.min(100, p))}%"></i></div>`,
  arrow: (v) => (v > 2 ? "↗" : v < -2 ? "↘" : "→"),
  nav() {
    document.getElementById("nav").innerHTML = Object.entries(TABS)
      .map(
        ([k, v]) =>
          `<button data-act="tab" data-id="${k}" class="${S.tab === k ? "on" : ""}">${v}</button>`,
      )
      .join("");
  },
  render() {
    this.nav();
    const v = document.getElementById("view");
    v.innerHTML = this[S.tab]();
    if (S.tab === "hist") {
      Wave.init(document.getElementById("wave"), (d) => this.dayInfo(d));
      this.dayInfo(Wave.sel || today());
    }
    if (S.tab === "focus") Focus.paint();
  },
  rows(date) {
    const d = Day.get(date);
    return d.plan.length
      ? d.plan
          .map(
            (
              e,
            ) => `<div class="row ${e.done ? "done" : ""}" ${e.done ? "" : `draggable="true" data-eid="${e.id}"`}><input type="checkbox" data-act="tog" data-id="${e.id}" ${e.done ? "checked" : ""}>
   <div class="g"><div class="t">${esc(e.title)}</div><div class="dim">${e.time || "без времени"} · ${S.skills.find((k) => k.id === e.skillId)?.dur || ""} мин</div></div>
   <button class="b" data-act="eedit" data-id="${e.id}">⋯</button></div>`,
          )
          .join("")
      : '<p class="dim">На сегодня ничего не запланировано — это нормальный день восстановления. Добавьте задание, если хочется.</p>';
  },
  dayInfo(date) {
    const r = S.days[date],
      el = document.getElementById("dayinfo");
    if (!el) return;
    if (!r) {
      el.innerHTML = `<b>${date}</b><p class="dim">Записей за этот день нет.</p>`;
      return;
    }
    const pl = r.plan,
      sp = r.spirit.reduce((a, b) => a + b, 0);
    el.innerHTML = `<b>${date}</b> · выполнено ${pl.filter((e) => e.done).length}/${pl.length} · фокус ${Math.floor(r.focus / 60)} ч ${r.focus % 60} мин · XP +${r.xp} · молитва ${sp}/6 · импульс ${Wave.impulse(date)}%
   <div class="dim">${pl.map((e) => (e.done ? "✓ " : "✗ ") + esc(e.title)).join(" · ")}</div>`;
  },
  home() {
    const x = Xp.info(S.totalXp),
      d = Day.get(today()),
      sp = d.spirit.reduce((a, b) => a + b, 0),
      im = Wave.impulse(today()),
      dl = im - Wave.impulse(addDays(today(), -1));
    return `<section class="card hero"><div><div class="dim">Уровень</div><div class="big">${x.L}</div></div><div><div class="dim">Ранг</div><div class="big">${Xp.rank(x.L)}</div></div>
   <div style="flex:1;min-width:200px"><div class="dim">Опыт: ${S.totalXp} XP · до уровня ${x.need}</div>${this.bar(x.pct)}<p style="margin:8px 0 0">🔥 Импульс ${im}% ${this.arrow(dl)} · ${esc(S.profile.name)}</p></div></section>
  <section class="card"><h3>Волна дня — тяните, чтобы листать историю</h3><canvas id="wave"></canvas><div id="dayinfo" class="dim"></div></section>
  <div class="grid"><section class="card"><h3>Сегодня</h3>${this.rows(today())}<button class="b" data-act="eadd">+ Задание</button></section>
  <section class="card"><h3>Молитва</h3><button class="b p" data-act="spirit" style="width:100%;font-size:20px">${sp} / 6</button>
   <h3 style="margin-top:16px">Характеристики</h3>${STATS.map((s) => {
     const i = Xp.info(S.statXp[s] || 0);
     return `<div class="row"><span style="width:110px">${s}</span><div class="g">${this.bar(i.pct)}</div><b>${i.L}</b></div>`;
   }).join("")}</section></div>`;
  },
  skills() {
    return `<button class="b p" data-act="skedit">+ Новый навык</button>${typeof UNI !== "undefined" && UNI.every(([n]) => S.skills.some((k) => k.name === n)) ? "" : ' <button class="b" data-act="uni">Добавить универсальные навыки</button>'}<div class="grid">${S.skills
      .map((k) => {
        const i = Xp.info(S.skillXp[k.id] || 0, 50),
          w = Xp.weekXp(k.id),
          pw = Xp.weekXp(k.id, 7),
          adv = pw ? Math.round(((w - pw) / pw) * 100) : w ? 100 : 0;
        const sq = [...Array(7)]
          .map((_, j) => {
            const dt = addDays(today(), j - 6),
              s = Day.sq(k.id, dt);
            return `<span class="sq ${s}" data-act="goto" data-id="${dt}">${s === "d" ? "✓" : s === "m" ? "□" : "—"}</span>`;
          })
          .join("");
        return `<section class="card go" data-act="mopen" data-id="${k.id}"><h3>${esc(k.name)} · ${k.stat}</h3><div class="row"><b>Ур. ${i.L}</b><div class="g">${this.bar(i.pct)}</div></div>
   <p class="dim">Прогресс: ${Math.round(i.pct)}% до след. уровня · Продвижение: ${adv > 0 ? "+" : ""}${adv}% за неделю ${this.arrow(adv)}<br>${FREQ[k.freq] || k.freq} · ${k.dur} мин · ${DIFF[k.diff]}</p>
   <div>${sq}</div><p><button class="b" data-act="mopen" data-id="${k.id}">Мастерство ${Mastery.calc(k).total}%</button> <button class="b" data-act="skedit" data-id="${k.id}">Изменить</button> <button class="b" data-act="skdel" data-id="${k.id}">Удалить</button></p></section>`;
      })
      .join("")}</div>`;
  },
  plan() {
    const t = today();
    return `<div class="grid">${[0, 1, 2]
      .map((i) => {
        const dt = addDays(t, i);
        return `<section class="card" data-day="${dt}"><h3>${dt}${i ? "" : " (сегодня)"} · нагрузка ${Sched.load(dt)} мин</h3>${this.rows(dt)}<button class="b" data-act="eadd" data-id="${dt}">+ Добавить</button></section>`;
      })
      .join("")}</div>`;
  },
  focus() {
    return `<section class="card"><h3>Фокус-таймер</h3><div class="timer" id="tm">00:00</div>
  <p><select id="fsk">${S.skills.map((k) => `<option value="${k.id}">${esc(k.name)}</option>`).join("")}</select></p>
  <p><button class="b p" data-act="fgo">Старт / Продолжить</button> <button class="b" data-act="fpause">Пауза</button> <button class="b" data-act="fend">Завершить</button> <button class="b" data-act="freset">Сбросить</button></p>
  <p class="dim">1 минута фокуса = 1 XP × сложность навыка. Фокус сегодня: ${Day.get(today()).focus} мин.</p></section>`;
  },
  hist() {
    return `<section class="card"><h3>Лента дней — тяните мышью</h3><canvas id="wave"></canvas><div id="dayinfo"></div></section>
  <section class="card"><h3>Квадраты за 14 дней</h3>${S.skills
    .map(
      (k) =>
        `<div class="row"><span style="width:130px">${esc(k.name)}</span><div>${[
          ...Array(14),
        ]
          .map((_, j) => {
            const dt = addDays(today(), j - 13),
              s = Day.sq(k.id, dt);
            return `<span class="sq ${s}" data-act="goto" data-id="${dt}">${s === "d" ? "✓" : s === "m" ? "□" : "—"}</span>`;
          })
          .join("")}</div></div>`,
    )
    .join("")}
  <p class="dim">✓ выполнено · □ запланировано, не выполнено · — не планировалось</p></section>`;
  },
  set() {
    return `<section class="card"><h3>Профиль</h3><p><input id="pn" value="${esc(S.profile.name)}" placeholder="Имя"></p><p><input id="pg" value="${esc(S.profile.goal)}" placeholder="Текущая цель"></p>
  <button class="b p" data-act="psave">Сохранить</button></section>
  <section class="card"><h3>Данные</h3><button class="b" data-act="exp">Экспорт</button> <label class="b" style="padding:9px 12px;border-radius:10px;cursor:pointer">Импорт<input type="file" id="imp" accept=".json" hidden></label>
  <button class="b" data-act="reset">Полный сброс</button></section>`;
  },
};
const Focus = {};
