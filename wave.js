// Волна дня: бесконечная лента дней. Высота точки = активность дня (0..1).
const Wave = {
  off: 0,
  sel: null,
  step: 46,
  cv: null,
  score(d) {
    const r = S.days[d];
    return r ? Math.min(1, r.xp / 350) : 0;
  },
  // Импульс: сглаженная активность за 30 дней — один плохой день его не обнуляет
  impulse(d) {
    let v = 0;
    for (let i = 30; i >= 0; i--)
      v = v * 0.85 + this.score(addDays(d, -i)) * 0.15;
    return Math.round(Math.min(1, v / 0.55) * 100);
  },
  init(cv, onPick) {
    this.cv = cv;
    this.onPick = onPick;
    const c = cv;
    let x0 = null,
      moved = 0;
    c.onpointerdown = (e) => {
      x0 = e.clientX;
      moved = 0;
      c.setPointerCapture(e.pointerId);
    };
    c.onpointermove = (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0;
      moved += Math.abs(dx);
      x0 = e.clientX;
      this.off = Math.min(2, this.off - dx / this.step);
      this.draw();
    };
    c.onpointerup = (e) => {
      if (x0 === null) return;
      x0 = null;
      if (moved < 5) {
        const r = c.getBoundingClientRect();
        const i = Math.round(
          (e.clientX - r.left - r.width / 2) / this.step + this.off,
        );
        this.pick(addDays(today(), i));
      }
    };
    if (this.first === undefined) {
      this.first = 1;
      this.off = -(c.clientWidth * 0.3) / this.step;
    }
    this.draw();
  },
  goTo(date) {
    const i = Math.round((new Date(date) - new Date(today())) / 864e5);
    this.off = i;
    this.sel = date;
    this.draw();
  },
  pick(d) {
    this.sel = d;
    this.draw();
    this.onPick && this.onPick(d);
  },
  draw() {
    const c = this.cv;
    if (!c) return;
    const r = devicePixelRatio || 1,
      W = c.clientWidth,
      H = c.clientHeight;
    c.width = W * r;
    c.height = H * r;
    const g = c.getContext("2d");
    g.scale(r, r);
    const n = Math.ceil(W / this.step / 2) + 2,
      mid = Math.round(this.off),
      pts = [];
    for (let i = mid - n; i <= mid + n; i++) {
      const d = addDays(today(), i);
      pts.push({
        i,
        d,
        x: W / 2 + (i - this.off) * this.step,
        y: H - 24 - this.score(d) * (H - 56),
      });
    }
    const path = () => {
      g.beginPath();
      g.moveTo(pts[0].x, pts[0].y);
      for (let k = 1; k < pts.length; k++) {
        const a = pts[k - 1],
          b = pts[k],
          mx = (a.x + b.x) / 2;
        g.bezierCurveTo(mx, a.y, mx, b.y, b.x, b.y);
      }
    };
    const gr = g.createLinearGradient(0, 0, W, 0);
    gr.addColorStop(0, "#9b6bff");
    gr.addColorStop(1, "#5ec8ff");
    path();
    g.lineTo(pts.at(-1).x, H);
    g.lineTo(pts[0].x, H);
    g.closePath();
    g.globalAlpha = 0.15;
    g.fillStyle = gr;
    g.fill();
    g.globalAlpha = 1;
    path();
    g.strokeStyle = gr;
    g.lineWidth = 3;
    g.stroke();
    g.font = "11px sans-serif";
    g.textAlign = "center";
    pts.forEach((p) => {
      const t = p.d === today(),
        s = p.d === this.sel;
      if (t || s || p.d.endsWith("-01")) {
        g.fillStyle = t ? "#5ec8ff" : "#8d94c4";
        g.fillText(p.d.slice(8) + "." + p.d.slice(5, 7), p.x, H - 6);
      }
      if (t || s || S.days[p.d]) {
        g.beginPath();
        g.arc(p.x, p.y, s ? 7 : t ? 6 : 3, 0, 7);
        g.fillStyle = s ? "#fff" : t ? "#5ec8ff" : "#9b6bff";
        g.fill();
      }
    });
  },
};
