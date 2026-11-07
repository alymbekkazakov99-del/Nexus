// Направления: цепочка шагов к большой цели (Linux → Сети → … → профессия). Шаг связан с навыком.
const tr = () => (S.tree = S.tree || []);
const nodeP = (n) => {
  const k = S.skills.find((x) => x.id === n.skillId);
  return k ? Mastery.calc(k).total : n.done ? 100 : 0;
};
UI.tree = function () {
  return (
    `<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="b p" data-act="trnew">+ Направление</button><button class="b" data-act="trtpl">Шаблон: кибербезопасность</button></div>` +
    (tr().length
      ? ""
      : '<p class="dim">Направление показывает путь от маленьких шагов к большой цели. Добавьте своё или возьмите шаблон.</p>') +
    `<div class="grid">${tr()
      .map((t) => {
        const p = t.nodes.length
          ? Math.round(
              t.nodes.reduce((s, n) => s + nodeP(n), 0) / t.nodes.length,
            )
          : 0;
        return `<section class="card"><h3>${esc(t.title)} · ${p}%</h3>${this.bar(p)}${t.nodes.map((n, i) => `${i ? '<div style="text-align:center;color:var(--a)">↓</div>' : ""}<div class="row ${n.skillId ? "" : "go"}" ${n.skillId ? "" : `data-act="trtog" data-id="${n.id}"`}><span class="g"><b>${esc(n.name)}</b><div class="dim">${n.skillId ? "навык: " + esc((S.skills.find((k) => k.id === n.skillId) || {}).name || "удалён") : n.done ? "выполнено" : "нажмите, чтобы отметить"}</div></span><b>${nodeP(n)}%</b><button class="b" data-act="trnd" data-id="${n.id}">✕</button></div>`).join("")}
  <p><button class="b" data-act="trnode" data-id="${t.id}">+ Шаг</button> <button class="b" data-act="trdel" data-id="${t.id}">Удалить</button></p></section>`;
      })
      .join("")}</div>`
  );
};
const trFind = (id) => tr().find((t) => t.nodes.some((n) => n.id === id));
Object.assign(PanelActs, {
  trnew: () => {
    UI.prompt(
      "Новое направление",
      "Название (например, Кибербезопасность)",
      "",
      (v) => {
        tr().push({ id: uid(), title: v, nodes: [] });
      },
    );
    return 1;
  },
  trtpl: () => {
    tr().push({
      id: uid(),
      title: "Кибербезопасность",
      nodes: [
        "Linux",
        "Сети",
        "Защита систем",
        "SOC",
        "DFIR",
        "Анализ инцидентов",
        "Специалист по кибербезопасности",
      ].map((n) => ({ id: uid(), name: n, skillId: "", done: false })),
    });
    UI.toast("Шаблон добавлен");
  },
  trnode: (id) => {
    UI.modal(
      `<h3>Новый шаг</h3><input id="tnn" placeholder="Название шага"><select id="tns"><option value="">Без навыка (отмечать вручную)</option>${S.skills.map((k) => `<option value="${k.id}">${esc(k.name)}</option>`).join("")}</select><button class="b p" data-act="trnsave" data-id="${id}">Добавить</button><button class="b" data-act="close">Отмена</button>`,
    );
    return 1;
  },
  trnsave: (id) => {
    const n = $("tnn").value.trim();
    if (!n) {
      UI.toast("Введите название");
      return 1;
    }
    tr()
      .find((t) => t.id === id)
      .nodes.push({ id: uid(), name: n, skillId: $("tns").value, done: false });
    UI.close();
  },
  trtog: (id) => {
    const t = trFind(id),
      n = t.nodes.find((x) => x.id === id);
    n.done = !n.done;
  },
  trnd: (id) => {
    const t = trFind(id);
    t.nodes = t.nodes.filter((n) => n.id !== id);
  },
  trdel: (id) => {
    UI.confirm(
      "Удалить направление?",
      "Шаги будут удалены, навыки останутся.",
      () => {
        S.tree = tr().filter((t) => t.id !== id);
      },
      "Удалить",
      true,
    );
    return 1;
  },
});
