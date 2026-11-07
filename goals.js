// Цели → проекты → этапы, а также журнал и итог дня.
const Goals = {
  pct(g) {
    const st = g.projects.flatMap((p) => p.stages);
    return st.length
      ? Math.round((st.filter((s) => s.done).length / st.length) * 100)
      : 0;
  },
};
const JQ = [
  "Что сделал?",
  "Что не сделал?",
  "Что помешало?",
  "Что понял?",
  "Что нужно изменить?",
  "Что сделать завтра?",
];
UI.goals = function () {
  return (
    `<button class="b p" data-act="gform">+ Цель</button>` +
    (S.goals.length
      ? ""
      : '<p class="dim">Целей пока нет. Цель придаёт смысл заданиям, например: «Стать специалистом по кибербезопасности».</p>') +
    `<div class="grid">${S.goals
      .map((g) => {
        const sk = S.skills.find((k) => k.id === g.skillId);
        return `<section class="card"><h3>${esc(g.title)}${sk ? " · " + esc(sk.name) : ""}</h3>${g.url ? `<p><a class="lnk" href="${esc(g.url)}" target="_blank" rel="noopener noreferrer">🔗 Открыть ссылку цели</a></p>` : ""}${this.bar(Goals.pct(g))}<p class="dim">Прогресс: ${Goals.pct(g)}% · за каждый этап +50 XP</p>${g.done ? '<p><b style="color:var(--ok)">✔ Цель завершена ' + g.doneAt + "</b></p>" : Goals.pct(g) === 100 ? '<button class="b p" data-act="gfin" data-id="' + g.id + '">Завершить цель</button>' : ""}
  ${g.projects.map((p) => `<b>${esc(p.title)}</b>${p.stages.map((s) => `<div class="row ${s.done ? "done" : ""}"><input type="checkbox" data-act="stog" data-id="${s.id}" ${s.done ? "checked" : ""}><span class="t g">${esc(s.title)}</span></div>`).join("")}<p><button class="b" data-act="sadd" data-id="${p.id}">+ Этап</button></p>`).join("")}
  <p><button class="b" data-act="padd" data-id="${g.id}">+ Проект</button> <button class="b" data-act="glink" data-id="${g.id}">🔗 Ссылка</button> <button class="b" data-act="gdel" data-id="${g.id}">Удалить цель</button></p></section>`;
      })
      .join("")}</div>`
  );
};
UI.journal = function () {
  const t = today(),
    d = Day.get(t),
    j = S.journal[t] || [],
    pl = d.plan,
    sp = d.spirit.reduce((a, b) => a + b, 0);
  return `<section class="card"><h3>Итог дня · ${t}</h3><p>Выполнено ${pl.filter((e) => e.done).length}/${pl.length} · фокус ${Math.floor(d.focus / 60)} ч ${d.focus % 60} мин · XP +${d.xp} · молитва ${sp}/6 · импульс ${Wave.impulse(t)}%</p></section>
 <section class="card"><h3>Журнал</h3>${JQ.map((q, i) => `<p class="dim" style="margin:8px 0 4px">${q}</p><textarea id="j${i}" rows="2" style="width:100%">${esc(j[i] || "")}</textarea>`).join("")}<p><button class="b p" data-act="jsave">Сохранить запись</button></p></section>
 <section class="card"><h3>Прошлые записи</h3>${
   Object.keys(S.journal)
     .sort()
     .reverse()
     .filter((k) => k !== t)
     .slice(0, 7)
     .map(
       (k) =>
         `<p><b>${k}</b><br><span class="dim">${S.journal[k].filter(Boolean).map(esc).join(" · ")}</span></p>`,
     )
     .join("") || '<p class="dim">Пока пусто.</p>'
 }</section>`;
};
const GoalActs = {
  gform: () => {
    UI.modal(
      `<h3>Новая цель</h3><input id="gt" placeholder="Например: Стать специалистом по кибербезопасности"><input id="gl" placeholder="Ссылка на цель (необязательно): https://…"><select id="gs"><option value="">Без связи с навыком</option>${S.skills.map((k) => `<option value="${k.id}">${esc(k.name)}</option>`).join("")}</select><button class="b p" data-act="gsave">Создать</button><button class="b" data-act="close">Закрыть</button>`,
    );
    return 1;
  },
  gsave: () => {
    const t = $("gt").value.trim();
    if (!t) return 1;
    const u = $("gl").value.trim();
    if (u && !/^https?:\/\//i.test(u)) {
      UI.toast("Ссылка должна начинаться с http:// или https://");
      return 1;
    }
    S.goals.push({
      id: uid(),
      title: t,
      skillId: $("gs").value,
      url: u,
      projects: [],
    });
    UI.close();
  },
  padd: (id) => {
    UI.prompt("Новый проект", "Название проекта", "", (v) => {
      S.goals
        .find((g) => g.id === id)
        .projects.push({ id: uid(), title: v, stages: [] });
    });
    return 1;
  },
  sadd: (id) => {
    UI.prompt("Новый этап", "Название этапа", "", (v) => {
      S.goals
        .flatMap((g) => g.projects)
        .find((p) => p.id === id)
        .stages.push({ id: uid(), title: v, done: false });
    });
    return 1;
  },
  stog: (id) => {
    for (const g of S.goals)
      for (const p of g.projects) {
        const s = p.stages.find((x) => x.id === id);
        if (s) {
          s.done = !s.done;
          Xp.add(
            S.skills.find((k) => k.id === g.skillId),
            s.done ? 50 : -50,
            today(),
            ["stage", "Этап «" + s.title + "»"],
          );
        }
      }
  },
  glink: (id) => {
    const g = S.goals.find((x) => x.id === id);
    UI.prompt(
      "Ссылка на цель",
      "Адрес (https://…). Пусто — убрать ссылку",
      g.url || "",
      (v) => {
        if (v && !/^https?:\/\//i.test(v)) {
          UI.toast("Нужна ссылка, начинающаяся с http:// или https://");
          return false;
        }
        g.url = v;
      },
      { empty: true, ph: "https://" },
    );
    return 1;
  },
  gdel: (id) => {
    UI.confirm(
      "Удалить цель?",
      "Вместе с целью будут удалены все её проекты и этапы.",
      () => {
        S.goals = S.goals.filter((g) => g.id !== id);
      },
      "Удалить",
      true,
    );
    return 1;
  },
  jsave: () => {
    S.journal[today()] = JQ.map((_, i) => $("j" + i).value.trim());
    UI.toast("Запись сохранена");
  },
};
