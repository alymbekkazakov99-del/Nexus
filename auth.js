// Регистрация и вход. Ключ шифрования живёт только в памяти: после перезагрузки нужен пароль.
const Auth = {
  err: "",
  mode: "login",
  screen(mode = this.mode) {
    document.body.classList.add("auth");
    this.mode = mode;
    $("nav").innerHTML = "";
    const reg = mode === "reg",
      old = !!localStorage.getItem("lifeos.v1");
    $("view").innerHTML =
      `<section class="card auth-card"><div class="logo-icon" style="margin:0 auto">S</div><h2 style="text-align:center">${reg ? "Регистрация" : "Вход"}</h2>
  <input id="au" placeholder="Имя пользователя" autocomplete="username"><input id="ap" type="password" placeholder="Пароль (от 6 символов)">
  ${reg ? '<input id="ap2" type="password" placeholder="Повторите пароль">' + (old ? '<label class="dim"><input type="checkbox" id="aold" checked> Перенести прежние данные</label>' : "") + '<p class="dim" style="font-size:11px">Пароль восстановить нельзя.</p>' : ""}
  <div style="color:var(--warn)">${esc(this.err)}</div><button class="b p" data-act="${reg ? "areg" : "alogin"}">${reg ? "Зарегистрироваться" : "Войти"}</button>
  <button class="b" data-act="aswitch">${reg ? "У меня есть аккаунт" : "Создать аккаунт"}</button>${reg ? "" : '<button class="b" data-act="forgot">Забыли пароль?</button>'}</section>`;
  },
  fail(m) {
    const u = $("au")?.value || "";
    this.err = m;
    this.screen();
    $("au").value = u;
  },
  start(d, u) {
    S = d || defaults();
    if (!S.profile || !S.profile.name)
      S.profile = { ...(S.profile || { goal: "" }), name: u };
    document.body.classList.remove("auth");
    migrate();
    Day.get(today());
    Ach.check();
    save();
    UI.render();
  },
  async reg() {
    const u = $("au").value.trim().toLowerCase(),
      p = $("ap").value;
    if (!window.crypto?.subtle)
      return this.fail(
        "Шифрование недоступно. Откройте через Live Server (127.0.0.1) или https.",
      );
    if (u.length < 3) return this.fail("Имя — минимум 3 символа.");
    if (p.length < 6) return this.fail("Пароль — минимум 6 символов.");
    if (p !== $("ap2").value) return this.fail("Пароли не совпадают.");
    if (Store.users()[u]) return this.fail("Такое имя уже занято.");
    const old = $("aold")?.checked;
    try {
      await Store.register(u, p);
      let d = null;
      if (old) {
        d = Store.legacy();
        localStorage.removeItem("lifeos.v1");
      }
      this.err = "";
      this.start(d, u);
    } catch (e) {
      this.fail("Ошибка: " + e.message);
    }
  },
  async login() {
    const u = $("au").value.trim().toLowerCase(),
      p = $("ap").value;
    if (!window.crypto?.subtle)
      return this.fail(
        "Шифрование недоступно. Откройте через Live Server (127.0.0.1) или https.",
      );
    try {
      const d = await Store.login(u, p);
      this.err = "";
      this.start(d, u);
    } catch (e) {
      this.fail("Неверное имя или пароль.");
    }
  },
};
const AuthActs = {
  aswitch: () => {
    Auth.err = "";
    Auth.screen(Auth.mode === "reg" ? "login" : "reg");
    return 1;
  },
  areg: () => {
    Auth.reg();
    return 1;
  },
  alogin: () => {
    Auth.login();
    return 1;
  },
  logout: () => {
    UI.confirm(
      "Выйти из аккаунта?",
      "Чтобы вернуться, понадобится пароль.",
      () => {
        Focus.stop();
        S.focusRun =
          Focus.base > 0
            ? { pick: Focus.pick, base: Focus.base, t0: null }
            : null;
        Store.persist(S).then(() => {
          Focus.clear();
          Store.lock();
          S = defaults();
          Wave.sel = null;
          Auth.err = "";
          Auth.screen("login");
        });
        return 1;
      },
      "Выйти",
    );
    return 1;
  },
};
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && $("au")) document.querySelector(".card .p").click();
});
