// Безопасность: смена пароля, ключ восстановления, шифрованный экспорт и импорт.
Object.assign(Store, {
  async changePass(op, np) {
    const u = this.user,
      us = this.users(),
      r = us[u],
      ob = await this.derive(op, this.unb64(r.salt));
    if (this.b64(ob.slice(32)) !== r.ver) throw new Error("bad");
    const salt = crypto.getRandomValues(new Uint8Array(16)),
      nb = await this.derive(np, salt);
    us[u] = { salt: this.b64(salt), ver: this.b64(nb.slice(32)) };
    localStorage.setItem("lifeos.users", JSON.stringify(us));
    this.key = await this.aes(nb);
    this.raw = nb.slice(0, 32);
    localStorage.removeItem("lifeos.rec." + u);
    await this.persist(S);
  },
  async wrap(obj, pw) {
    const salt = crypto.getRandomValues(new Uint8Array(16)),
      iv = crypto.getRandomValues(new Uint8Array(12)),
      k = await this.aes(await this.derive(pw, salt));
    return {
      enc: 1,
      salt: this.b64(salt),
      iv: this.b64(iv),
      ct: this.b64(
        await crypto.subtle.encrypt(
          { name: "AES-GCM", iv },
          k,
          new TextEncoder().encode(JSON.stringify(obj)),
        ),
      ),
    };
  },
  async unwrap(o, pw) {
    const k = await this.aes(await this.derive(pw, this.unb64(o.salt)));
    return JSON.parse(
      new TextDecoder().decode(
        await crypto.subtle.decrypt(
          { name: "AES-GCM", iv: this.unb64(o.iv) },
          k,
          this.unb64(o.ct),
        ),
      ),
    );
  },
  async recover(u, rk, np) {
    const rr = localStorage.getItem("lifeos.rec." + u),
      dr = localStorage.getItem("lifeos.data." + u);
    if (!rr || !dr || np.length < 6) throw new Error("x");
    const o = await this.unwrap(JSON.parse(rr), Sec.norm(rk)),
      key = await crypto.subtle.importKey(
        "raw",
        this.unb64(o.k),
        "AES-GCM",
        false,
        ["decrypt"],
      ),
      b = JSON.parse(dr),
      data = JSON.parse(
        new TextDecoder().decode(
          await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: this.unb64(b.iv) },
            key,
            this.unb64(b.ct),
          ),
        ),
      ),
      salt = crypto.getRandomValues(new Uint8Array(16)),
      nb = await this.derive(np, salt),
      us = this.users();
    us[u] = { salt: this.b64(salt), ver: this.b64(nb.slice(32)) };
    localStorage.setItem("lifeos.users", JSON.stringify(us));
    this.user = u;
    this.key = await this.aes(nb);
    this.raw = nb.slice(0, 32);
    localStorage.removeItem("lifeos.rec." + u);
    await this.persist(data);
    return data;
  },
});
const Sec = {
  norm: (k) =>
    (
      k
        .replace(/[^A-Za-z0-9]/g, "")
        .toUpperCase()
        .match(/.{1,4}/g) || []
    ).join("-"),
  dl(txt, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([txt], { type: "application/json" }));
    a.download = name;
    a.click();
  },
  async mkRec() {
    const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789",
      r = crypto.getRandomValues(new Uint8Array(20)),
      k = this.norm([...r].map((x) => A[x % 32]).join(""));
    localStorage.setItem(
      "lifeos.rec." + Store.user,
      JSON.stringify(await Store.wrap({ k: Store.b64(Store.raw) }, k)),
    );
    UI.modal(
      `<h3>Ключ восстановления</h3><p class="dim">Он показывается один раз. Запишите и храните отдельно от пароля.</p><div class="panel" style="font-size:19px;letter-spacing:.06em;text-align:center">${k}</div><button class="b p" data-act="close">Я сохранил(а)</button>`,
    );
  },
  askImport(o) {
    UI.prompt(
      "Пароль файла",
      "Введите пароль, которым зашифрован файл",
      "",
      (v) => {
        Store.unwrap(o, v)
          .then((d) => {
            if (!Backup.valid(d)) throw 0;
            UI.confirm(
              "Заменить все данные?",
              "Текущий прогресс будет заменён данными из файла.",
              () => {
                S = d;
                migrate();
                UI.toast("Импортировано");
              },
              "Заменить",
              true,
            );
          })
          .catch(() => UI.toast("Неверный пароль или файл повреждён"));
      },
    );
  },
};
Object.assign(PanelActs, {
  spass: () => {
    UI.modal(
      `<h3>Смена пароля</h3><input id="po" type="password" placeholder="Текущий пароль"><input id="pn1" type="password" placeholder="Новый пароль (от 6 символов)"><input id="pn2" type="password" placeholder="Повторите новый пароль"><button class="b p" data-act="passok">Сменить</button><button class="b" data-act="close">Отмена</button>`,
    );
    return 1;
  },
  passok: () => {
    const n = $("pn1").value;
    if (n.length < 6 || n !== $("pn2").value) {
      UI.toast("Новый пароль — от 6 символов, оба поля должны совпасть");
      return 1;
    }
    Store.changePass($("po").value, n)
      .then(() => {
        UI.close();
        UI.toast("Пароль изменён. Ключ восстановления создайте заново.");
      })
      .catch(() => UI.toast("Неверный текущий пароль"));
    return 1;
  },
  reckey: () => {
    UI.confirm(
      "Создать ключ восстановления?",
      "Прежний ключ перестанет работать. Новый покажется один раз.",
      () => {
        Sec.mkRec();
        return 1;
      },
      "Создать",
    );
    return 1;
  },
  forgot: () => {
    UI.modal(
      `<h3>Восстановление доступа</h3><input id="fu" placeholder="Имя пользователя"><input id="fk" placeholder="Ключ восстановления"><input id="fp" type="password" placeholder="Новый пароль (от 6 символов)"><button class="b p" data-act="recok">Восстановить</button><button class="b" data-act="close">Отмена</button>`,
    );
    return 1;
  },
  recok: () => {
    const u = $("fu").value.trim().toLowerCase();
    Store.recover(u, $("fk").value, $("fp").value)
      .then((d) => {
        UI.close();
        Auth.start(d, u);
        UI.toast("Доступ восстановлен. Создайте новый ключ в настройках.");
      })
      .catch(() => UI.toast("Не подошло: проверьте имя, ключ и пароль"));
    return 1;
  },
  expenc: () => {
    UI.prompt(
      "Пароль для файла",
      "Придумайте пароль (понадобится при импорте)",
      "",
      (v) => {
        if (v.length < 4) {
          UI.toast("Пароль — от 4 символов");
          return false;
        }
        Store.wrap(S, v).then((o) => {
          Sec.dl(JSON.stringify(o), "nexus-backup-encrypted.json");
          S.lastBackup = Date.now();
          save();
        });
      },
    );
    return 1;
  },
});
