// Хранение с аккаунтами. Пароль → PBKDF2 → (ключ AES-GCM + проверочный хэш).
// Данные каждого пользователя лежат в localStorage только в зашифрованном виде.
const Store = {
  user: null,
  key: null,
  q: null,
  users() {
    try {
      return JSON.parse(localStorage.getItem("lifeos.users")) || {};
    } catch (e) {
      return {};
    }
  },
  b64(b) {
    let s = "";
    new Uint8Array(b).forEach((c) => (s += String.fromCharCode(c)));
    return btoa(s);
  },
  unb64: (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)),
  async derive(pw, salt) {
    const m = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(pw),
      "PBKDF2",
      false,
      ["deriveBits"],
    );
    return new Uint8Array(
      await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt, iterations: 200000, hash: "SHA-256" },
        m,
        512,
      ),
    );
  },
  aes(bits) {
    return crypto.subtle.importKey("raw", bits.slice(0, 32), "AES-GCM", false, [
      "encrypt",
      "decrypt",
    ]);
  },
  async register(u, p) {
    const salt = crypto.getRandomValues(new Uint8Array(16)),
      bits = await this.derive(p, salt),
      us = this.users();
    us[u] = { salt: this.b64(salt), ver: this.b64(bits.slice(32)) };
    localStorage.setItem("lifeos.users", JSON.stringify(us));
    this.key = await this.aes(bits);
    this.raw = bits.slice(0, 32);
    this.user = u;
  },
  async login(u, p) {
    const r = this.users()[u];
    if (!r) throw new Error("bad");
    const bits = await this.derive(p, this.unb64(r.salt));
    if (this.b64(bits.slice(32)) !== r.ver) throw new Error("bad");
    this.key = await this.aes(bits);
    this.raw = bits.slice(0, 32);
    this.user = u;
    const raw = localStorage.getItem("lifeos.data." + u);
    if (!raw) return null;
    const o = JSON.parse(raw);
    return JSON.parse(
      new TextDecoder().decode(
        await crypto.subtle.decrypt(
          { name: "AES-GCM", iv: this.unb64(o.iv) },
          this.key,
          this.unb64(o.ct),
        ),
      ),
    );
  },
  async persist(s) {
    if (!this.key) return;
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      this.key,
      new TextEncoder().encode(JSON.stringify(s)),
    );
    localStorage.setItem(
      "lifeos.data." + this.user,
      JSON.stringify({ iv: this.b64(iv), ct: this.b64(ct) }),
    );
  },
  save(s) {
    this.q = (this.q || Promise.resolve())
      .then(() => this.persist(s))
      .catch((e) => console.error("Ошибка сохранения", e));
  },
  lock() {
    this.key = null;
    this.user = null;
  },
  legacy() {
    try {
      return JSON.parse(localStorage.getItem("lifeos.v1"));
    } catch (e) {
      return null;
    }
  },
  removeUser() {
    const us = this.users();
    delete us[this.user];
    localStorage.setItem("lifeos.users", JSON.stringify(us));
    localStorage.removeItem("lifeos.data." + this.user);
    this.lock();
  },
};
