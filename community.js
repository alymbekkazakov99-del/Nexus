// Сообщество: люди и связи, напоминание «давно не общались».
const cmt = () => (S.contacts = S.contacts || []);
const Cm = {
  form() {
    UI.modal(
      `<h3>Новый контакт</h3><input id="cn" placeholder="Имя"><select id="cg">${["Друг", "Коллега", "Наставник", "Сообщество", "Семья"].map((g) => `<option>${g}</option>`).join("")}</select><input id="ce" type="number" min="0" placeholder="Связываться раз в N дней (необязательно)"><input id="cnt" placeholder="Заметка"><button class="b p" data-act="cmsave">Добавить</button><button class="b" data-act="close">Отмена</button>`,
    );
  },
};
UI.comm = function () {
  const L = cmt(),
    t = today(),
    ago = (c) =>
      c.last ? Math.round((new Date(t) - new Date(c.last)) / 864e5) : null,
    due = (c) => !!c.every && (ago(c) === null || ago(c) >= c.every),
    wk = L.filter((c) => c.last && ago(c) < 7).length,
    s = [...L].sort(
      (a, b) => due(b) - due(a) || (ago(b) ?? 999) - (ago(a) ?? 999),
    ),
    card = (i, l, v) =>
      `<div class="stat-card"><span class="stat-icon">${i}</span><div><p>${l}</p><strong>${v}</strong></div></div>`;
  return `<div class="stats-grid">${card("☺", "Людей", L.length) + card("!", "Ждут связи", L.filter(due).length) + card("✓", "На этой неделе", wk)}</div><div><button class="b p" data-act="qct">+ Контакт</button></div>
 <div class="panel"><h3>Люди</h3>${s.map((c) => `<div class="row"><span class="g"><b style="${due(c) ? "color:var(--warn)" : ""}">${esc(c.name)}</b> <span class="dim">${esc(c.g)}${c.every ? " · каждые " + c.every + " дн." : ""}</span><div class="dim">${ago(c) === null ? "ещё не связывались" : "связь " + ago(c) + " дн. назад"}${c.note ? " · " + esc(c.note) : ""}</div></span><button class="b" data-act="cmdone" data-id="${c.id}">Связался</button><button class="b" data-act="cmdel" data-id="${c.id}">✕</button></div>`).join("") || '<p class="dim">Добавьте людей, с которыми хотите поддерживать связь: друзей, наставников, коллег.</p>'}</div>`;
};
Object.assign(PanelActs, {
  qct: () => {
    UI.close();
    S.tab = "comm";
    save();
    UI.render();
    Cm.form();
    return 1;
  },
  cmsave: () => {
    const n = $("cn").value.trim();
    if (!n) {
      UI.toast("Введите имя");
      return 1;
    }
    cmt().push({
      id: uid(),
      name: n,
      g: $("cg").value,
      every: +$("ce").value || 0,
      note: $("cnt").value.trim(),
      last: "",
    });
    UI.close();
  },
  cmdone: (id) => {
    const c = cmt().find((x) => x.id === id);
    c.last = today();
    Audit.add("Связь: " + c.name, today());
    UI.toast("Отмечено: " + c.name);
  },
  cmdel: (id) => {
    const c = cmt().find((x) => x.id === id);
    UI.confirm(
      "Удалить контакт?",
      c.name,
      () => {
        S.contacts = cmt().filter((x) => x.id !== id);
      },
      "Удалить",
      true,
    );
    return 1;
  },
});
