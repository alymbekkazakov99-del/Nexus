// Мастерство, доказательства, внешние тесты, журнал XP, универсальные навыки, проверка импорта.
const LVLW = {
  начальный: 0.5,
  средний: 0.7,
  продвинутый: 0.85,
  профессиональный: 1,
};
const Mastery = {
  data(id) {
    return (S.mastery[id] = S.mastery[id] || { ev: [], tests: [] });
  },
  // XP — объём работы. Mastery — подтверждённое качество из 5 показателей.
  calc(k) {
    const m = this.data(k.id),
      lvl = Xp.levelOf(S.skillXp[k.id] || 0, 50),
      gap = Sched.lastDone(k.id, addDays(today(), 1)) - 1;
    const parts = {
      Практика: Math.min(100, lvl * 10),
      Знания: Math.round(
        Math.max(
          0,
          ...m.tests.map((t) => (t.score / t.max) * 100 * LVLW[t.level]),
        ),
      ),
      Применение: Math.min(
        100,
        m.ev.filter((e) => e.type === "проект").length * 25,
      ),
      Сохранность:
        gap >= 98
          ? 0
          : Math.round(clamp(100 - Math.max(0, gap - 3) * 5, 0, 100)),
      Доказательства: Math.min(100, m.ev.length * 20),
    };
    return {
      parts,
      total: Math.round(
        parts["Практика"] * 0.3 +
          parts["Знания"] * 0.25 +
          parts["Применение"] * 0.15 +
          parts["Сохранность"] * 0.1 +
          parts["Доказательства"] * 0.2,
      ),
    };
  },
};
const WHY = {
  Практика: "уровень навыка × 10 (вес 30%)",
  Знания: "лучший внешний тест: балл% × вес уровня теста (25%)",
  Применение: "25 за каждое доказательство типа «проект» (15%)",
  Сохранность:
    "100, если практика была за последние 3 дня, дальше −5 в день (10%)",
  Доказательства: "20 за каждое доказательство (20%)",
};
function masteryForm(id) {
  const k = S.skills.find((x) => x.id === id),
    m = Mastery.data(id),
    c = Mastery.calc(k);
  UI.modal(`<h3>${esc(k.name)} · Мастерство ${c.total}%</h3><p class="dim">XP показывает объём работы, а мастерство — то, что подтверждено результатами.</p>
 ${Object.entries(c.parts)
   .map(
     ([n, v]) =>
       `<div><div class="row"><span class="g">${n}</span><b>${v}%</b></div>${UI.bar(v)}<div class="dim">${WHY[n]}</div></div>`,
   )
   .join("")}
 <h3>Доказательства (+25 XP)</h3>${m.ev.map((e) => `<div class="dim">${e.date} · ${e.type}: ${esc(e.text)} ${e.url ? "· " + esc(e.url) : ""}</div>`).join("") || '<div class="dim">Пока нет.</div>'}
 <select id="et2">${["проект", "ссылка", "сертификат", "заметка"].map((x) => `<option>${x}</option>`).join("")}</select><input id="ex" placeholder="Что сделано"><input id="eu" placeholder="Ссылка (необязательно)">
 <button class="b" data-act="evadd" data-id="${id}">Добавить доказательство</button>
 <h3>Внешние тесты (+30 XP)</h3>${m.tests.map((t) => `<div class="dim">${t.date} · ${t.level}: ${t.score}/${t.max} ${t.url ? "· " + esc(t.url) : ""}</div>`).join("") || '<div class="dim">Пока нет. Пройдите тест на стороннем сайте и внесите результат честно.</div>'}
 <button class="b" data-act="tfind" data-id="${id}">Найти внешний тест</button>
 <select id="tl">${Object.keys(LVLW)
   .map((x) => `<option>${x}</option>`)
   .join(
     "",
   )}</select><input id="ts" type="number" placeholder="Ваш балл"><input id="tm" type="number" placeholder="Максимум баллов"><input id="tu" placeholder="Ссылка на источник">
 <button class="b p" data-act="tsave" data-id="${id}">Сохранить результат</button><button class="b" data-act="close">Закрыть</button>`);
}
const UNI = [
  ["Дисциплина", "Дисциплина"],
  ["Концентрация", "Дисциплина"],
  ["Решение задач", "Интеллект"],
  ["Английский язык", "Интеллект"],
  ["Математика", "Интеллект"],
  ["Коммуникация", "Социальное"],
  ["Публичное выступление", "Социальное"],
  ["Чтение", "Интеллект"],
  ["Физическая подготовка", "Здоровье"],
  ["Управление временем", "Дисциплина"],
  ["Финансовая грамотность", "Богатство"],
  ["Цифровая грамотность", "Интеллект"],
  ["Первая помощь", "Здоровье"],
  ["Личная безопасность", "Здоровье"],
  ["Саморегуляция", "Дисциплина"],
  ["Сон и восстановление", "Здоровье"],
];
const Backup = {
  valid: (o) =>
    !!o &&
    typeof o === "object" &&
    Array.isArray(o.skills) &&
    !!o.days &&
    typeof o.days === "object" &&
    typeof o.totalXp === "number" &&
    o.skills.every((k) => k && k.id && k.name),
};
const _nav = UI.nav;
UI.nav = function () {
  _nav.call(this);
  $("nav").insertAdjacentHTML(
    "beforeend",
    '<button data-act="logout">Выйти</button>',
  );
};
const MasteryActs = {
  mopen: (id) => {
    masteryForm(id);
    return 1;
  },
  evadd: (id) => {
    const t = $("ex").value.trim();
    if (!t) {
      UI.toast("Опишите, что сделано");
      return 1;
    }
    const k = S.skills.find((x) => x.id === id);
    Mastery.data(id).ev.push({
      id: uid(),
      date: today(),
      type: $("et2").value,
      text: t,
      url: $("eu").value.trim(),
    });
    Xp.add(k, 25, today(), ["evidence", "Доказательство «" + t + "»"]);
    save();
    UI.render();
    masteryForm(id);
    return 1;
  },
  tsave: (id) => {
    const s = +$("ts").value,
      mx = +$("tm").value;
    if (!(mx > 0) || s < 0 || s > mx) {
      UI.toast("Проверьте баллы: от 0 до максимума");
      return 1;
    }
    const k = S.skills.find((x) => x.id === id);
    Mastery.data(id).tests.push({
      date: today(),
      level: $("tl").value,
      score: s,
      max: mx,
      url: $("tu").value.trim(),
    });
    Xp.add(k, 30, today(), [
      "test",
      "Внешний тест: " + k.name + " " + s + "/" + mx,
    ]);
    save();
    UI.render();
    masteryForm(id);
    return 1;
  },
  tfind: (id) => {
    const k = S.skills.find((x) => x.id === id);
    window.open(
      "https://www.google.com/search?q=" +
        encodeURIComponent(k.name + " online test skill level"),
      "_blank",
      "noopener",
    );
    return 1;
  },
  uni: () => {
    UI.confirm(
      "Добавить 16 универсальных навыков?",
      "Они попадут в автоплан, лишние можно удалить.",
      () => {
        UNI.forEach(([n, s]) => {
          if (!S.skills.some((k) => k.name === n))
            S.skills.push({
              id: uid(),
              name: n,
              stat: s,
              freq: "w3",
              dur: 30,
              diff: 1,
              prio: 2,
            });
        });
      },
    );
    return 1;
  },
};
