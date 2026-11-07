// Расписание: дни, частота навыков, защита от перегрузки.
const Day = {
  get(date) {
    if (!S.days[date]) {
      S.days[date] = {
        xp: 0,
        focus: 0,
        spirit: [0, 0, 0, 0, 0, 0],
        plan: date >= today() ? Sched.auto(date) : [],
        log: {},
      };
    }
    return S.days[date];
  },
  // Квадрат: d — выполнено, m — запланировано не выполнено, n — не запланировано
  sq(id, date) {
    const r = S.days[date];
    const e = r?.plan.filter((x) => x.skillId === id);
    return !e || !e.length ? "n" : e.some((x) => x.done) ? "d" : "m";
  },
};
const Sched = {
  lastDone(id, date) {
    for (let i = 1; i < 60; i++) {
      if (
        S.days[addDays(date, -i)]?.plan.some((x) => x.skillId === id && x.done)
      )
        return i;
    }
    return 99;
  },
  doneInWeek(id, date) {
    let c = 0;
    for (let i = 1; i <= 6; i++)
      if (
        S.days[addDays(date, -i)]?.plan.some((x) => x.skillId === id && x.done)
      )
        c++;
    return c;
  },
  due(sk, date) {
    const f = sk.freq,
      n = +f.slice(1),
      gap = this.lastDone(sk.id, date);
    if (f[0] === "e") return gap >= n;
    // раз в неделю: если уже достаточно выполнено — отдыхаем; тяжёлые подряд не ставим
    return this.doneInWeek(sk.id, date) < n && (n >= 5 || gap > 1);
  },
  // Автоплан: по приоритету, пока нагрузка ≤ 240 минут (чтобы не перегружать день)
  auto(date) {
    let load = 0,
      out = [];
    const rc = typeof Recovery !== "undefined" ? Recovery.calc() : 100,
      md = (S.jmood || {})[today()] || 3,
      cap = rc < 70 || md <= 2 ? 120 : 240;
    [...S.skills]
      .sort((a, b) => b.prio - a.prio)
      .forEach((sk) => {
        if (this.due(sk, date) && load + sk.dur <= cap) {
          load += sk.dur;
          out.push({
            id: uid(),
            skillId: sk.id,
            title: sk.name,
            time: "",
            done: false,
            xp: 0,
          });
        }
      });
    return out;
  },
  load(date) {
    return Day.get(date).plan.reduce(
      (s, e) => s + (S.skills.find((k) => k.id === e.skillId)?.dur || 0),
      0,
    );
  },
  toggle(date, eid) {
    const d = Day.get(date),
      e = d.plan.find((x) => x.id === eid),
      sk = S.skills.find((k) => k.id === e.skillId);
    if (!e.done) {
      e.xp = sk ? Xp.calc(sk.dur, sk.diff) : 10;
      e.done = true;
      Xp.add(sk, e.xp, date, [
        "task",
        "Задание «" +
          e.title +
          "»" +
          (sk ? ": " + sk.dur + " мин × " + sk.diff + " × бонус серии" : ""),
      ]);
      if (sk) d.log[sk.id] = (d.log[sk.id] || 0) + e.xp;
    } else {
      Xp.add(sk, -e.xp, date, ["task", "Отмена: «" + e.title + "»"]);
      if (sk) d.log[sk.id] = Math.max(0, (d.log[sk.id] || 0) - e.xp);
      e.done = false;
      e.xp = 0;
    }
  },
  spirit(date, i) {
    const d = Day.get(date);
    d.spirit[i] = d.spirit[i] ? 0 : 1;
    Xp.add({ id: "sp", stat: "Молитва" }, d.spirit[i] ? 10 : -10, date, [
      "prayer",
      "Молитва: пункт " + (i + 1),
    ]);
  },
};
