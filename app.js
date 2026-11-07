// События: один обработчик кликов на весь документ (делегирование).
const $ = (id) => document.getElementById(id);
const FOPT = (o) =>
  Object.entries(o)
    .map(([k, v]) => `<option value="${k}">${v}</option>`)
    .join("");
function entryForm(date, e) {
  UI.modal(`<h3>${e ? "Изменить" : "Новое"} задание</h3><input id="et" placeholder="Название" value="${esc(e?.title || "")}"><input id="etm" type="time" value="${e?.time || ""}">
 ${e ? `<button class="b" data-act="epost" data-id="${e.id}">Отложить на завтра</button><button class="b" data-act="edel" data-id="${e.id}">Удалить</button>` : ""}
 <button class="b p" data-act="esave" data-id="${e?.id || ""}" data-date="${date}">Сохранить</button><button class="b" data-act="close">Закрыть</button>`);
}
function skillForm(k) {
  k = k || {
    name: "",
    stat: "Интеллект",
    freq: "e2",
    dur: 45,
    diff: 1,
    prio: 2,
  };
  UI.modal(`<h3>${k.id ? "Изменить" : "Новый"} навык</h3><input id="kn" placeholder="Название" value="${esc(k.name)}">
 <select id="ks">${STATS.map((s) => `<option ${s === k.stat ? "selected" : ""}>${s}</option>`).join("")}</select>
 <select id="kf">${FOPT(FREQ)}</select><input id="kd" type="number" min="5" value="${k.dur}">
 <select id="kdf">${FOPT(DIFF)}</select><select id="kp"><option value="1">Низкий</option><option value="2">Средний</option><option value="3">Высокий</option></select>
 <button class="b p" data-act="sksave" data-id="${k.id || ""}">Сохранить</button><button class="b" data-act="close">Закрыть</button>`);
  $("kf").value = k.freq;
  $("kdf").value = String(k.diff);
  $("kp").value = k.prio;
}
function spiritForm() {
  const d = Day.get(today());
  UI.modal(
    `<h3>Молитва — ${d.spirit.reduce((a, b) => a + b, 0)}/6</h3><p class="dim">Название любого пункта можно изменить: впишите своё — оно сохранится.</p>` +
      S.spirit
        .map(
          (t, i) =>
            `<div class="row"><input type="checkbox" data-act="sptog" data-id="${i}" ${d.spirit[i] ? "checked" : ""}><input id="sp${i}" value="${esc(t)}" style="flex:1"></div>`,
        )
        .join("") +
      '<button class="b p" data-act="spsave">Сохранить пункты</button><button class="b" data-act="close">Закрыть</button>',
  );
}
const A = {
  tab: (id) => {
    S.tab = id;
  },
  tog: (id) => {
    const dt = Object.keys(S.days).find((k) =>
      S.days[k].plan.some((x) => x.id === id),
    );
    Sched.toggle(dt, id);
  },
  close: () => UI.close(),
  eadd: (id) => {
    entryForm(id || today());
    return 1;
  },
  eedit: (id) => {
    const e =
      Day.get(today()).plan.find((x) => x.id === id) ||
      Object.values(S.days)
        .flatMap((d) => d.plan)
        .find((x) => x.id === id);
    entryForm(today(), e);
    return 1;
  },
  esave: (id, el) => {
    const dt = el.dataset.date,
      d = Day.get(dt),
      t = $("et").value.trim();
    if (!t) return 1;
    const e = id && d.plan.find((x) => x.id === id);
    if (e) {
      e.title = t;
      e.time = $("etm").value;
    } else
      d.plan.push({
        id: uid(),
        skillId: null,
        title: t,
        time: $("etm").value,
        done: false,
        xp: 0,
      });
    UI.close();
  },
  edel: (id) => {
    Object.values(S.days).forEach(
      (d) => (d.plan = d.plan.filter((x) => x.id !== id)),
    );
    UI.close();
  },
  epost: (id) => {
    Object.values(S.days).forEach((d) => {
      const e = d.plan.find((x) => x.id === id && !x.done);
      if (e) {
        d.plan = d.plan.filter((x) => x !== e);
        Day.get(addDays(today(), 1)).plan.push(e);
      }
    });
    UI.close();
  },
  skedit: (id) => {
    skillForm(S.skills.find((k) => k.id === id));
    return 1;
  },
  sksave: (id) => {
    const n = $("kn").value.trim();
    if (!n) return 1;
    const v = {
      name: n,
      stat: $("ks").value,
      freq: $("kf").value,
      dur: +$("kd").value || 30,
      diff: +$("kdf").value,
      prio: +$("kp").value,
    };
    const k = S.skills.find((x) => x.id === id);
    k ? Object.assign(k, v) : S.skills.push({ id: uid(), ...v });
    UI.close();
  },
  skdel: (id) => {
    UI.confirm(
      "Удалить навык?",
      "XP останется в общем счёте.",
      () => {
        S.skills = S.skills.filter((k) => k.id !== id);
      },
      "Удалить",
      true,
    );
    return 1;
  },
  spirit: () => {
    spiritForm();
    return 1;
  },
  sptog: (id) => {
    Sched.spirit(today(), +id);
    spiritForm();
    return 0;
  },
  spsave: () => {
    S.spirit = S.spirit.map(
      (_, i) => $("sp" + i).value.trim() || "Пункт " + (i + 1),
    );
    UI.close();
  },
  goto: (id) => {
    if (S.tab !== "hist") {
      S.tab = "hist";
      UI.render();
    }
    Wave.goTo(id);
    Wave.pick(id);
    return 1;
  },
  fgo: () => {
    if (!Focus.run)
      Focus.run = setInterval(() => {
        Focus.sec++;
        Focus.paint();
      }, 1000);
    return 1;
  },
  fpause: () => {
    clearInterval(Focus.run);
    Focus.run = null;
    return 1;
  },
  freset: () => {
    A.fpause();
    Focus.sec = 0;
    Focus.paint();
    return 1;
  },
  fend: () => {
    A.fpause();
    const m = Math.floor(Focus.sec / 60),
      k = S.skills.find((x) => x.id === $("fsk").value);
    if (m < 1 || !k) {
      UI.toast("Меньше минуты — XP не начисляется");
      return 1;
    }
    const xp = Xp.calc(m, k.diff),
      d = Day.get(today());
    d.focus += m;
    d.log[k.id] = (d.log[k.id] || 0) + xp;
    Xp.add(k, xp);
    Focus.sec = 0;
    UI.toast(`+${xp} XP · ${k.name}`);
  },
  psave: () => {
    S.profile.name = $("pn").value;
    S.profile.goal = $("pg").value;
    UI.toast("Сохранено");
  },
  exp: () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([JSON.stringify(S)], { type: "application/json" }),
    );
    a.download = "life-os-backup.json";
    a.click();
    S.lastBackup = Date.now();
    S.bkMin = false;
    save();
    return 1;
  },
  reset: () => {
    UI.confirm(
      "Удалить аккаунт и ВСЕ данные?",
      "Будут удалены профиль, навыки, цели, журнал, календарь и весь прогресс этого аккаунта.",
      () => {
        UI.confirm(
          "Точно удалить?",
          "Это необратимо: данные этого аккаунта на устройстве будут стёрты без возможности восстановления.",
          () => {
            Store.removeUser();
            location.reload();
          },
          "Удалить навсегда",
          true,
        );
      },
      "Продолжить",
      true,
    );
    return 1;
  },
};
Object.assign(A, GoalActs, ExtraActs, AuthActs, MasteryActs, PanelActs);
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-act]");
  if (!t) return;
  try {
    // действия ищем в момент клика — порядок подключения скриптов уже не важен
    const nm = t.dataset.act,
      fn = [PanelActs, MasteryActs, AuthActs, ExtraActs, GoalActs, A]
        .map((o) => o[nm])
        .find(Boolean);
    if (!fn) {
      UI.toast(
        "Не найдено действие «" +
          nm +
          "». Проверьте, что в index.html подключены все файлы js.",
      );
      return;
    }
    const r = fn(t.dataset.id, t);
    if (r === 1) return;
    Ach.check();
    save();
    UI.render();
  } catch (err) {
    console.error(err);
    UI.toast("Ошибка: " + err.message);
  }
});
document.addEventListener("change", (e) => {
  if (e.target.id === "imp") {
    const f = e.target.files[0],
      rd = new FileReader();
    rd.onload = () => {
      try {
        const o = JSON.parse(rd.result);
        if (o && o.enc === 1) {
          Sec.askImport(o);
          return;
        }
        if (!Backup.valid(o)) throw 0;
        UI.confirm(
          "Заменить все данные?",
          "Текущий прогресс будет заменён данными из файла.",
          () => {
            S = o;
            migrate();
            UI.toast("Импортировано");
          },
          "Заменить",
          true,
        );
      } catch (x) {
        UI.toast("Файл не подходит — данные не изменены");
      }
    };
    rd.readAsText(f);
  }
  if (e.target.dataset.act === "tog" || e.target.dataset.act === "sptog") {
  }
});
addEventListener("resize", () => Wave.draw());
Auth.screen();
