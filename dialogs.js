// Свои окна вместо окон браузера (подтверждения и ввод).
// ================= Свои окна вместо окон браузера (confirm/prompt) =================
const Dlg = { cb: null, opt: {} };
UI.confirm = function (title, text, cb, ok, danger) {
  Dlg.cb = cb;
  this.modal(
    `<h3>${esc(title)}</h3><p class="dim">${esc(text)}</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="b ${danger ? "dng" : "p"}" data-act="dlgyes">${esc(ok || "Да")}</button><button class="b" data-act="close">Отмена</button></div>`,
  );
};
UI.prompt = function (title, label, value, cb, opt) {
  Dlg.cb = cb;
  Dlg.opt = opt || {};
  this.modal(
    `<h3>${esc(title)}</h3><label class="dim">${esc(label)}<input id="dlgin" value="${esc(value)}" placeholder="${esc((opt || {}).ph || "")}" style="width:100%;margin-top:6px"></label><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="b p" data-act="dlgok">ОК</button><button class="b" data-act="close">Отмена</button></div>`,
  );
  setTimeout(() => {
    const i = document.getElementById("dlgin");
    if (i) {
      i.focus();
      i.select();
    }
  }, 30);
};
Object.assign(PanelActs, {
  dlgyes: () => {
    const f = Dlg.cb;
    Dlg.cb = null;
    UI.close();
    if (f && f() === 1) return 1;
  },
  dlgok: () => {
    const v = document.getElementById("dlgin").value.trim();
    if (!v && !(Dlg.opt || {}).empty) {
      UI.toast("Заполните поле");
      return 1;
    }
    const r = Dlg.cb && Dlg.cb(v);
    if (r === false) return 1;
    Dlg.cb = null;
    UI.close();
  },
});
document.addEventListener("keydown", (e) => {
  const m = document.getElementById("modal");
  if (!m || m.hidden) return;
  if (e.key === "Escape") UI.close();
  else if (e.key === "Enter" && document.getElementById("dlgin"))
    document.querySelector("[data-act=dlgok]").click();
});
document.getElementById("modal").addEventListener("click", (e) => {
  if (e.target.id === "modal") UI.close();
});
