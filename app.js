/* Hôm nay ngồi đâu? — gợi ý quán cafe làm việc */
(function () {
  "use strict";

  const ORIGINS = {
    hotay: { name: "Hồ Tây", lat: 21.0585, lng: 105.823 },
    chualang: { name: "Chùa Láng", lat: 21.0235, lng: 105.8065 }
  };
  const ROAD_FACTOR = 1.3;

  // Đặc điểm của quán và trọng số khởi điểm. Trọng số rút ra từ 17 quán hai bạn đã chấm:
  // quán điểm cao đều rộng, vắng, bàn to; quán điểm thấp hẹp, đông hoặc sát mặt đường.
  const FEATURES = {
    rong:       { label: "rộng rãi",        w: 0.12 },
    vang:       { label: "vắng, yên tĩnh",  w: 0.12 },
    ban_rong:   { label: "bàn rộng",        w: 0.12 },
    coworking:  { label: "chuyên làm việc", w: 0.06 },
    view_ho:    { label: "view hồ",         w: 0.05 },
    o_dien:     { label: "nhiều ổ điện",    w: 0.03 },
    wifi:       { label: "wifi tốt",        w: 0.03 },
    dieu_hoa:   { label: "có điều hòa",     w: 0.03 },
    do_uong:    { label: "đồ uống ngon",    w: 0.02 },
    ngoai_troi: { label: "chủ yếu ngoài trời", w: -0.04 },
    dong:       { label: "hay đông",        w: -0.12 },
    ban_chat:   { label: "bàn hoặc chỗ chật", w: -0.15 },
    mat_duong:  { label: "sát mặt đường, ồn", w: -0.08 },
    wifi_yeu:   { label: "wifi yếu",        w: -0.06 },
    nong:       { label: "nóng, thiếu điều hòa", w: -0.06 },
    do_uong_do: { label: "đồ uống dở",      w: -0.02 }
  };
  // Lựa chọn trong form feedback. Mỗi lựa chọn gắn với một đặc điểm ở trên.
  const CHIPS_POS = [
    ["rong", "Rộng rãi"], ["vang", "Vắng"], ["ban_rong", "Bàn rộng"], ["o_dien", "Nhiều ổ điện"],
    ["wifi", "Wifi tốt"], ["view_ho", "View đẹp"], ["do_uong", "Đồ uống ngon"]
  ];
  const CHIPS_NEG = [
    ["dong", "Đông"], ["mat_duong", "Ồn"], ["ban_chat", "Bàn chật"], ["wifi_yeu", "Wifi yếu"],
    ["nong", "Nóng"], ["do_uong_do", "Đồ uống dở"], ["xa", "Xa quá"]
  ];
  const OPPOSITE = { rong: "ban_chat", ban_chat: "rong", vang: "dong", dong: "vang", wifi: "wifi_yeu", wifi_yeu: "wifi", do_uong: "do_uong_do", do_uong_do: "do_uong", dieu_hoa: "nong", nong: "dieu_hoa" };

  const MODES = {
    hotay:    { origin: "hotay",    near: true, min: 1, max: 8,  step: 0.5, def: 4 },
    chualang: { origin: "chualang", near: true, min: 1, max: 8,  step: 0.5, def: 4 },
    khac:     { origin: "custom",   near: true, min: 1, max: 10, step: 0.5, def: 3 },
    xa:       { origin: null,       near: false, min: 15, max: 45, step: 5, def: 40, floor: 10 }
  };

  // Khu vực gõ nhanh, dùng được cả khi không có mạng tra địa chỉ.
  const AREAS = [
    ["Cầu Giấy", 21.0333, 105.7940], ["Duy Tân", 21.0310, 105.7830], ["Trần Quốc Vượng", 21.0345, 105.7840],
    ["Đống Đa", 21.0170, 105.8250], ["Thái Hà", 21.0125, 105.8200], ["Láng Hạ", 21.0150, 105.8140],
    ["Ba Đình", 21.0340, 105.8140], ["Kim Mã", 21.0315, 105.8180], ["Ngọc Khánh", 21.0270, 105.8130],
    ["Hoàn Kiếm", 21.0285, 105.8525], ["Hồ Gươm", 21.0288, 105.8520], ["Phố cổ", 21.0340, 105.8500],
    ["Hai Bà Trưng", 21.0090, 105.8560], ["Times City", 20.9955, 105.8680], ["Bạch Mai", 21.0010, 105.8500],
    ["Thanh Xuân", 20.9940, 105.8100], ["Royal City", 21.0030, 105.8150], ["Ngã Tư Sở", 21.0030, 105.8200],
    ["Hoàng Mai", 20.9760, 105.8600], ["Linh Đàm", 20.9650, 105.8280],
    ["Nam Từ Liêm", 21.0120, 105.7650], ["Mỹ Đình", 21.0280, 105.7720], ["Bắc Từ Liêm", 21.0700, 105.7650],
    ["Hà Đông", 20.9710, 105.7790], ["Long Biên", 21.0360, 105.8880], ["Gia Lâm", 21.0170, 105.9380],
    ["Tây Hồ", 21.0700, 105.8200], ["Xuân Diệu", 21.0610, 105.8300], ["Lạc Long Quân", 21.0600, 105.8100],
    ["Chùa Láng", 21.0235, 105.8065], ["Nguyễn Chí Thanh", 21.0230, 105.8100],
    ["Ecopark", 20.9530, 105.9400], ["Đông Anh", 21.1360, 105.8480], ["Sóc Sơn", 21.2550, 105.8300],
    ["Hòa Lạc", 21.0100, 105.5300], ["Thạch Thất", 21.0500, 105.5700]
  ];
  const fold = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").trim();

  // Icon nét mảnh cho đặc điểm quán.
  const P = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const ICONS = {
    rong: P('<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>'),
    vang: P('<path d="M11 5 6 9H2v6h4l5 4z"/><path d="m22 9-6 6M16 9l6 6"/>'),
    ban_rong: P('<rect x="2" y="7" width="20" height="4" rx="1"/><path d="M5 11v8M19 11v8"/>'),
    coworking: P('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M2 20h20"/>'),
    view_ho: P('<path d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><circle cx="17" cy="6" r="2"/>'),
    o_dien: P('<path d="M12 22v-5M9 8V2M15 8V2M18 8v5a6 6 0 0 1-12 0V8z"/>'),
    wifi: P('<path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M2 9a15 15 0 0 1 20 0"/><circle cx="12" cy="19.5" r=".5"/>'),
    dieu_hoa: P('<path d="M12 2v20M4.9 4.9l14.2 14.2M2 12h20M4.9 19.1 19.1 4.9"/>'),
    do_uong: P('<path d="M17 8h1a4 4 0 0 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"/>'),
    ngoai_troi: P('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2"/>'),
    dong: P('<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 4a3 3 0 0 1 0 6M21 20a6 6 0 0 0-4-5.6"/>'),
    ban_chat: P('<path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/>'),
    mat_duong: P('<path d="M4 19 8 5M20 19 16 5M12 6v2M12 11v2M12 16v2"/>'),
    wifi_yeu: P('<path d="M2 2l20 20M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r=".5"/>'),
    nong: P('<path d="M14 14.8V4a2 2 0 0 0-4 0v10.8a4 4 0 1 0 4 0z"/>'),
    do_uong_do: P('<path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4zM2 2l20 20"/>'),
    pin: P('<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>'),
    clock: P('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    star: P('<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>')
  };

  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* bỏ qua */ } }
  };

  const state = {
    cafes: [],
    feedback: [],              // tất cả feedback: từ sheet + bản lưu máy
    users: LS.get("cf_users", ["Thịnh", "Bạn gái"]),
    who: LS.get("cf_who", 0),
    mode: LS.get("cf_mode", "hotay"),
    origin: LS.get("cf_origin", "hotay"),
    ranges: LS.get("cf_ranges", {}),
    custom: LS.get("cf_custom", null),
    openNow: false, onlyNew: false, showHidden: false,
    remoteOk: false
  };

  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") n.className = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) n.setAttribute(k, v === true ? "" : v);
    }
    for (const k of kids.flat()) if (k != null) n.append(k.nodeType ? k : document.createTextNode(k));
    return n;
  };

  // ---------- tiện ích ----------
  function haversine(a, b) {
    const R = 6371, toR = x => x * Math.PI / 180;
    const dLa = toR(b.lat - a.lat), dLo = toR(b.lng - a.lng);
    const h = Math.sin(dLa / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLo / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  const roadKm = (o, c) => haversine(o, c) * ROAD_FACTOR;
  const fmtKm = k => (k < 10 ? k.toFixed(1) : Math.round(k)).toString().replace(".", ",") + " km";
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  function openStatus(hours) {
    if (!hours) return null;
    if (/24h/i.test(hours)) return true;
    const m = hours.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);
    if (!m) return null;
    const now = new Date();
    const t = now.getHours() * 60 + now.getMinutes();
    const a = +m[1] * 60 + +m[2];
    let b = +m[3] * 60 + +m[4];
    if (b <= a) return t >= a || t < b; // đóng sau nửa đêm
    return t >= a && t < b;
  }

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 2600);
  }

  // ---------- học từ feedback ----------
  // Mỗi quán: điểm trung bình hai bạn chấm, đặc điểm được báo thêm hoặc bớt, cờ ẩn.
  function cafeSignals() {
    const by = {};
    for (const f of state.feedback) {
      if (f.type !== "feedback") continue;
      const s = by[f.place_id] || (by[f.place_id] = { stars: [], chips: {}, hide: false, hideBy: "", notes: [] });
      if (f.stars) s.stars.push(+f.stars);
      for (const c of f.chips || []) s.chips[c] = (s.chips[c] || 0) + 1;
      if (f.hide) { s.hide = true; s.hideBy = f.who; }
      if (f.unhide) s.hide = false;
      if (f.note || f.stars) s.notes.push(f);
    }
    return by;
  }

  // Trọng số học được: đặc điểm của quán được chấm cao thì tăng, quán bị chấm thấp thì giảm.
  // Lựa chọn trong form cũng cho biết hai bạn để ý điều gì. Mỗi thay đổi bị chặn ở ±0,08.
  function learnedWeights(signals) {
    const delta = {};
    for (const k in FEATURES) delta[k] = 0;
    const cafeById = Object.fromEntries(state.cafes.map(c => [c.id, c]));
    for (const f of state.feedback) {
      if (f.type !== "feedback") continue;
      const c = cafeById[f.place_id];
      if (c && f.stars) {
        const feats = effectiveFeatures(c, signals[c.id]);
        for (const k of feats) if (k in delta) delta[k] += 0.01 * (+f.stars - 3);
      }
      for (const ch of f.chips || []) if (ch in delta) delta[ch] += 0.004 * Math.sign(FEATURES[ch].w);
    }
    const w = {};
    for (const k in FEATURES) {
      const d = clamp(delta[k], -0.08, 0.08);
      w[k] = { base: FEATURES[k].w, delta: d, now: FEATURES[k].w + d };
    }
    return w;
  }

  function effectiveFeatures(c, sig) {
    const set = new Set(c.features || []);
    if (!sig) return set;
    for (const [ch, n] of Object.entries(sig.chips)) {
      if (!(ch in FEATURES)) continue;
      const opp = OPPOSITE[ch];
      const oppN = opp ? (sig.chips[opp] || 0) : 0;
      if (n > oppN) { set.add(ch); if (opp) set.delete(opp); }
    }
    return set;
  }

  // ---------- chấm điểm ----------
  function scoreCafe(c, ctx) {
    const sig = ctx.signals[c.id];
    const feats = effectiveFeatures(c, sig);
    const parts = [];
    let s = 0;

    const work = c.work != null ? c.work : (c.myScore ? c.myScore / 2 : 3);
    s += 0.35 * (work / 5);

    const rel = c.reviews / (c.reviews + 40);
    s += 0.1 * clamp((c.rating - 4) / 1, 0, 1) * rel;

    for (const k of feats) {
      const w = ctx.weights[k] ? ctx.weights[k].now : 0;
      s += w;
      parts.push([k, w]);
    }

    if (c.myScore) s += (c.myScore - 8) * 0.08;
    if (sig && sig.stars.length) {
      const avg = sig.stars.reduce((a, b) => a + b, 0) / sig.stars.length;
      s += (avg - 3) * 0.08 * Math.min(sig.stars.length, 3) / 1.5;
    }
    if (sig && sig.chips.xa) s -= 0.04 * sig.chips.xa * (ctx.near ? 1 : 0.3);

    s -= ctx.near ? 0.025 * c.km : 0.004 * c.km;
    if (!c.visited && !(sig && sig.stars.length)) s += 0.02; // khuyến khích thử quán mới

    parts.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
    return { score: s, parts, feats, sig };
  }

  function rank() {
    const m = MODES[state.mode];
    const originKey = m.origin || state.origin;
    const origin = originKey === "custom" ? state.custom : ORIGINS[originKey];
    if (!origin) return { rows: [], origin: null, range: 0, weights: learnedWeights(cafeSignals()), needArea: true };
    const range = state.ranges[state.mode] || m.def;
    const signals = cafeSignals();
    const weights = learnedWeights(signals);
    const ctx = { signals, weights, near: m.near };
    const visitedByFb = new Set(state.feedback.filter(f => f.type === "feedback" && f.stars).map(f => f.place_id));

    let rows = state.cafes.map(c => Object.assign({}, c, { km: roadKm(origin, c) }));
    rows = rows.filter(c => m.near ? c.km <= range : (c.km >= m.floor && c.km <= range));
    rows = rows.map(c => Object.assign(c, scoreCafe(c, ctx), { beenThere: c.visited || visitedByFb.has(c.id) }));
    if (!state.showHidden) rows = rows.filter(c => !(c.sig && c.sig.hide));
    if (state.onlyNew) rows = rows.filter(c => !c.beenThere);
    if (state.openNow) rows = rows.filter(c => openStatus(c.hours) !== false);
    rows.sort((a, b) => b.score - a.score);
    return { rows, origin, range, weights };
  }

  // ---------- giao diện ----------
  function renderWho() {
    const seg = $("#whoSeg");
    seg.replaceChildren(...state.users.map((u, i) =>
      el("button", { type: "button", "aria-pressed": String(i === state.who), onclick: () => { state.who = i; LS.set("cf_who", i); renderWho(); } }, u)));
  }

  function renderControls() {
    document.querySelectorAll(".mode").forEach(b => b.setAttribute("aria-selected", String(b.dataset.mode === state.mode)));
    const m = MODES[state.mode];
    const r = $("#range");
    r.min = m.min; r.max = m.max; r.step = m.step;
    r.value = state.ranges[state.mode] || m.def;
    $("#rangeLabel").textContent = m.near ? "Bán kính" : "Xa tối đa";
    $("#rangeOut").textContent = fmtKm(+r.value);
    $("#originRow").hidden = m.near;
    $("#areaRow").hidden = state.mode !== "khac";
    $("#khacSub").textContent = state.custom ? state.custom.name : "gõ tên khu vực";
    document.querySelectorAll("#originSeg button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.origin === state.origin)));
  }

  function reasonText(c) {
    const good = c.parts.filter(p => p[1] > 0).slice(0, 3).map(p => FEATURES[p[0]].label);
    const bad = c.parts.filter(p => p[1] < 0).slice(0, 2).map(p => FEATURES[p[0]].label);
    const bits = [];
    if (c.myScore) bits.push("hai bạn từng chấm " + String(c.myScore).replace(".", ",") + "/10");
    if (good.length) bits.push(good.join(", "));
    let t = bits.length ? "Gợi ý vì: " + bits.join("; ") + "." : "";
    if (bad.length) t += " Lưu ý: " + bad.join(", ") + ".";
    return t;
  }

  function renderList() {
    const { rows, origin, range, weights, needArea } = rank();
    const list = $("#list");
    renderMap(rows.slice(0, 8), origin);
    if (needArea) {
      list.replaceChildren(el("p", { class: "empty" }, "Gõ tên khu vực ở trên, ví dụ Cầu Giấy hoặc Times City, hoặc dùng vị trí hiện tại."));
    } else if (!rows.length) {
      list.replaceChildren(el("p", { class: "empty" }, "Không có quán nào trong phạm vi này. Thử kéo bán kính rộng hơn."));
    } else {
      const cards = rows.map((c, i) => card(c, i, origin));
      const m = MODES[state.mode];
      if (m.near && rows.length < 4 && range < m.max) cards.unshift(el("p", { class: "hint" }, `Chỉ có ${rows.length} quán trong ${fmtKm(range)}. Kéo bán kính rộng hơn để xem thêm.`));
      list.replaceChildren(...cards);
    }
    renderModel(weights);
  }

  function card(c, i, origin) {
    const open = openStatus(c.hours);
    const badges = [];
    if (c.beenThere) badges.push(el("span", { class: "badge me" }, c.myScore ? "Đã đi · " + String(c.myScore).replace(".", ",") + "/10" : "Đã đi"));
    else badges.push(el("span", { class: "badge" }, "Chưa đi"));
    if (open === true) badges.push(el("span", { class: "badge good" }, "Đang mở"));
    if (open === false) badges.push(el("span", { class: "badge warn" }, "Đã đóng"));
    for (const k of c.feats) {
      const w = FEATURES[k] ? FEATURES[k].w : 0;
      const b = el("span", { class: "badge " + (w < 0 ? "warn" : "good") });
      b.innerHTML = (ICONS[k] || "") + "<span></span>";
      b.lastChild.textContent = FEATURES[k] ? FEATURES[k].label : k;
      badges.push(b);
    }
    const scoreShown = Math.round(clamp(c.score, 0, 1) * 100);
    const dir = `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}&destination_place_id=${c.id}`;
    const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.name)}&query_place_id=${c.id}`;

    const fbs = c.sig ? c.sig.notes.slice(-3) : [];
    const strip = el("div", { class: "card-strip" });
    strip.innerHTML = `<span>${ICONS.pin}<b></b></span><span>${ICONS.clock}<i></i></span><span>${ICONS.star}<em></em></span>`;
    strip.querySelector("b").textContent = fmtKm(c.km);
    strip.querySelector("i").textContent = c.hours || "chưa rõ giờ";
    strip.querySelector("em").textContent = String(c.rating).replace(".", ",") + " · " + c.reviews;
    strip.querySelectorAll("b,i,em").forEach(n => { n.style.fontStyle = "normal"; n.style.fontWeight = "500"; });
    return el("article", { class: "card" + (c.sig && c.sig.hide ? " hidden-cafe" : ""), id: "c-" + c.id },
      el("div", { class: "card-head" },
        el("div", { class: "rank" }, String(i + 1)),
        el("div", { class: "card-title" },
          el("h3", {}, c.name),
          el("div", { class: "meta" }, `${c.area} · cách ${origin.name}`),
          strip
        ),
        el("div", { class: "score" }, el("b", {}, String(scoreShown)), el("small", {}, "điểm hợp"))
      ),
      el("div", { class: "badges" }, badges),
      el("p", { class: "why" }, reasonText(c)),
      c.note ? el("p", { class: "note" }, c.note) : null,
      c.myNote ? el("p", { class: "note" }, "Ghi chú của hai bạn: " + c.myNote) : null,
      fbs.length ? el("div", { class: "fb-list" }, fbs.map(f =>
        el("p", {}, `${f.who}: ${f.stars ? "★".repeat(+f.stars) : ""} ${(f.chips || []).map(chipLabel).join(", ")}${f.note ? " · " + f.note : ""}`))) : null,
      el("div", { class: "actions" },
        el("a", { class: "btn", href: dir, target: "_blank", rel: "noopener" }, "Chỉ đường"),
        el("a", { class: "btn", href: maps, target: "_blank", rel: "noopener" }, "Xem trên Maps"),
        c.phone ? el("a", { class: "btn", href: "tel:" + c.phone.replace(/\s/g, "") }, "Gọi") : null,
        c.sig && c.sig.hide
          ? el("button", { class: "btn", type: "button", onclick: () => unhide(c) }, "Gợi ý lại")
          : el("button", { class: "btn primary", type: "button", onclick: () => openFeedback(c) }, "Feedback")
      )
    );
  }

  const chipLabel = k => (CHIPS_POS.concat(CHIPS_NEG).find(x => x[0] === k) || [k, k])[1];

  function renderModel(weights) {
    const n = state.feedback.filter(f => f.type === "feedback").length;
    const rowsW = Object.entries(weights)
      .sort((a, b) => Math.abs(b[1].now) - Math.abs(a[1].now))
      .map(([k, v]) => {
        const d = v.delta;
        const dTxt = Math.abs(d) < 0.0005 ? "" : (d > 0 ? " ↑" : " ↓");
        return el("tr", {},
          el("td", {}, FEATURES[k].label),
          el("td", { class: d > 0 ? "delta-up" : d < 0 ? "delta-down" : "" }, (v.now >= 0 ? "+" : "") + v.now.toFixed(2).replace(".", ",") + dTxt));
      });
    $("#modelBody").replaceChildren(
      el("p", { class: "muted" }, `Điểm hợp = mức phù hợp để làm việc + điểm Google + cộng trừ theo đặc điểm dưới đây − khoảng cách. ` +
        `Feedback hai bạn chấm cao làm tăng trọng số đặc điểm của quán đó, chấm thấp thì giảm. Đã có ${n} feedback.`),
      el("table", { class: "weights" }, el("tbody", {}, rowsW))
    );
  }

  // ---------- bản đồ ----------
  let map = null, layer = null;
  function renderMap(rows, origin) {
    if (!window.L) { $(".map-wrap").hidden = true; return; }
    if (!map) {
      map = L.map("map", { zoomControl: false, attributionControl: true, scrollWheelZoom: false });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 19, subdomains: "abcd",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
      }).addTo(map);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      layer = L.layerGroup().addTo(map);
    }
    layer.clearLayers();
    const pts = [];
    if (origin) {
      L.marker([origin.lat, origin.lng], { icon: L.divIcon({ className: "", html: '<div class="pin-origin"></div>', iconSize: [18, 18] }), title: origin.name, zIndexOffset: 1000 }).addTo(layer);
      pts.push([origin.lat, origin.lng]);
    }
    rows.forEach((c, i) => {
      const m = L.marker([c.lat, c.lng], {
        icon: L.divIcon({ className: "", html: `<div class="pin${i < 3 ? " top" : ""}">${i + 1}</div>`, iconSize: i < 3 ? [28, 28] : [22, 22] }),
        title: c.name, zIndexOffset: 500 - i
      }).addTo(layer);
      m.on("click", () => {
        const card = document.getElementById("c-" + c.id);
        if (card) { card.scrollIntoView({ behavior: "smooth", block: "center" }); card.classList.add("flash"); setTimeout(() => card.classList.remove("flash"), 1200); }
      });
      pts.push([c.lat, c.lng]);
    });
    if (pts.length > 1) map.fitBounds(pts, { padding: [28, 28], maxZoom: 15 });
    else if (pts.length === 1) map.setView(pts[0], 14);
    else map.setView([21.03, 105.83], 12);
    setTimeout(() => map.invalidateSize(), 50);
  }

  // ---------- chọn khu vực ----------
  function setCustom(name, lat, lng) {
    state.custom = { name, lat: +lat, lng: +lng };
    LS.set("cf_custom", state.custom);
    $("#areaResults").replaceChildren();
    $("#areaInput").value = "";
    renderControls(); renderList();
  }
  function areaChoices(items) {
    const box = $("#areaResults");
    if (!items.length) { box.replaceChildren(el("p", { class: "muted" }, "Không tìm thấy địa điểm này ở Hà Nội. Thử gõ cụ thể hơn.")); return; }
    box.replaceChildren(...items.slice(0, 5).map(it => el("button", { type: "button", onclick: () => setCustom(it.name, it.lat, it.lng) }, it.label || it.name)));
  }
  async function searchArea(q) {
    const f = fold(q);
    const local = AREAS.filter(a => fold(a[0]).includes(f) || f.includes(fold(a[0])));
    if (local.length === 1 && fold(local[0][0]) === f) { setCustom(local[0][0], local[0][1], local[0][2]); return; }
    const items = local.map(a => ({ name: a[0], lat: a[1], lng: a[2], label: a[0] }));
    $("#areaResults").replaceChildren(el("p", { class: "muted" }, "Đang tìm…"));
    try {
      const url = "https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=vn&bounded=1&viewbox=105.3,21.45,106.1,20.75&accept-language=vi&q=" + encodeURIComponent(q + ", Hà Nội");
      const res = await fetch(url);
      const data = await res.json();
      for (const d of data) {
        const label = d.display_name.split(",").slice(0, 3).join(",");
        items.push({ name: d.display_name.split(",")[0], lat: d.lat, lng: d.lon, label });
      }
    } catch (e) { /* dùng danh sách có sẵn */ }
    areaChoices(items);
  }

  function renderSync() {
    const bar = $("#syncBar");
    const pending = LS.get("cf_pending", []).length;
    if (!window.CAFE_CONFIG || !window.CAFE_CONFIG.SCRIPT_URL) bar.textContent = "Feedback đang lưu trên máy này. Kết nối Google Sheet để hai bạn dùng chung.";
    else if (!state.remoteOk) bar.textContent = "Chưa tải được feedback từ Google Sheet. Feedback mới vẫn lưu trên máy.";
    else bar.textContent = pending ? `Đang chờ gửi ${pending} feedback lên Google Sheet.` : "Feedback đã đồng bộ với Google Sheet.";
  }

  // ---------- feedback ----------
  let fbCafe = null, fbStars = 0;
  function openFeedback(c) {
    fbCafe = c; fbStars = 0;
    $("#fbTitle").textContent = c.name;
    $("#fbWho").textContent = "Người chấm: " + state.users[state.who];
    $("#fbNote").value = "";
    $("#fbHide").checked = false;
    const stars = $("#stars");
    stars.replaceChildren(...[1, 2, 3, 4, 5].map(n => el("button", {
      type: "button", "aria-label": n + " sao", onclick: () => { fbStars = n; paintStars(); }
    }, "★")));
    paintStars();
    const mk = (arr, cls) => arr.map(([k, label]) => el("button", {
      type: "button", class: "chip " + cls, "aria-pressed": "false", "data-k": k,
      onclick: e => { const b = e.currentTarget; b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true")); }
    }, label));
    $("#chipsPos").replaceChildren(...mk(CHIPS_POS, "pos"));
    $("#chipsNeg").replaceChildren(...mk(CHIPS_NEG, "neg"));
    $("#fbDialog").showModal();
  }
  function paintStars() {
    [...$("#stars").children].forEach((b, i) => b.classList.toggle("on", i < fbStars));
  }

  function saveFeedback() {
    const chips = [...document.querySelectorAll("#fbDialog .chip[aria-pressed='true']")].map(b => b.dataset.k);
    const note = $("#fbNote").value.trim();
    const hide = $("#fbHide").checked;
    if (!fbStars && !chips.length && !note && !hide) { toast("Chưa có gì để lưu."); return; }
    submit({ type: "feedback", place_id: fbCafe.id, name: fbCafe.name, stars: fbStars || "", chips, note, hide });
    toast("Đã lưu feedback cho " + fbCafe.name + ".");
  }

  function unhide(c) {
    submit({ type: "feedback", place_id: c.id, name: c.name, stars: "", chips: [], note: "Gợi ý lại quán này", hide: false, unhide: true });
    toast("Sẽ gợi ý lại " + c.name + ".");
  }

  function submit(row) {
    row.time = new Date().toISOString();
    row.who = state.users[state.who];
    row.id = row.time + "-" + Math.random().toString(36).slice(2, 7);
    state.feedback.push(row);
    const local = LS.get("cf_feedback", []); local.push(row); LS.set("cf_feedback", local);
    const pending = LS.get("cf_pending", []); pending.push(row); LS.set("cf_pending", pending);
    renderList();
    flush();
  }

  async function flush() {
    const url = window.CAFE_CONFIG && window.CAFE_CONFIG.SCRIPT_URL;
    if (!url) { renderSync(); return; }
    const pending = LS.get("cf_pending", []);
    const left = [];
    for (const row of pending) {
      try {
        await fetch(url, { method: "POST", mode: "no-cors", body: JSON.stringify(row) });
      } catch (e) { left.push(row); }
    }
    LS.set("cf_pending", left);
    renderSync();
  }

  async function loadRemote() {
    const url = window.CAFE_CONFIG && window.CAFE_CONFIG.SCRIPT_URL;
    if (!url) return [];
    try {
      const res = await fetch(url + (url.includes("?") ? "&" : "?") + "action=list", { cache: "no-store" });
      const data = await res.json();
      state.remoteOk = true;
      return (data.rows || []).map(r => Object.assign(r, {
        chips: typeof r.chips === "string" ? r.chips.split(",").map(s => s.trim()).filter(Boolean) : (r.chips || []),
        hide: r.hide === true || r.hide === "TRUE" || r.hide === "true",
        unhide: r.unhide === true || r.unhide === "TRUE" || r.unhide === "true"
      }));
    } catch (e) {
      state.remoteOk = false;
      return [];
    }
  }

  function mergeFeedback(remote) {
    const local = LS.get("cf_feedback", []);
    const seen = new Set(remote.map(r => r.id));
    state.feedback = remote.concat(local.filter(r => !seen.has(r.id)));
  }

  // ---------- khởi động ----------
  function bind() {
    document.querySelectorAll(".mode").forEach(b => b.addEventListener("click", () => {
      state.mode = b.dataset.mode; LS.set("cf_mode", state.mode); renderControls(); renderList();
    }));
    $("#range").addEventListener("input", e => {
      state.ranges[state.mode] = +e.target.value; LS.set("cf_ranges", state.ranges);
      $("#rangeOut").textContent = fmtKm(+e.target.value); renderList();
    });
    document.querySelectorAll("#originSeg button").forEach(b => b.addEventListener("click", () => {
      state.origin = b.dataset.origin; LS.set("cf_origin", state.origin); renderControls(); renderList();
    }));
    $("#areaForm").addEventListener("submit", e => {
      e.preventDefault();
      const q = $("#areaInput").value.trim();
      if (q) searchArea(q);
    });
    $("#geoBtn").addEventListener("click", () => {
      if (!navigator.geolocation) { toast("Trình duyệt không hỗ trợ định vị."); return; }
      toast("Đang lấy vị trí…");
      navigator.geolocation.getCurrentPosition(
        p => setCustom("Vị trí của bạn", p.coords.latitude, p.coords.longitude),
        () => toast("Không lấy được vị trí. Hãy cho phép truy cập vị trí hoặc gõ tên khu vực."),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
    $("#openNow").addEventListener("change", e => { state.openNow = e.target.checked; renderList(); });
    $("#onlyNew").addEventListener("change", e => { state.onlyNew = e.target.checked; renderList(); });
    $("#showHidden").addEventListener("change", e => { state.showHidden = e.target.checked; renderList(); });
    $("#renameBtn").addEventListener("click", () => {
      const cur = state.users[state.who];
      const v = prompt("Tên hiển thị cho người này:", cur);
      if (v && v.trim()) { state.users[state.who] = v.trim(); LS.set("cf_users", state.users); renderWho(); }
    });
    $("#fbForm").addEventListener("submit", e => {
      if (e.submitter && e.submitter.value === "save") saveFeedback();
    });
    $("#suggestForm").addEventListener("submit", e => {
      e.preventDefault();
      const name = $("#sgName").value.trim();
      if (!name) return;
      submit({ type: "suggest", place_id: "", name, stars: "", chips: [], note: $("#sgNote").value.trim(), hide: false });
      $("#sgName").value = ""; $("#sgNote").value = "";
      toast("Đã gửi gợi ý. Claude sẽ kiểm tra và thêm vào danh sách.");
    });
  }

  async function init() {
    bind();
    renderWho();
    renderControls();
    try {
      const res = await fetch("data/cafes.json", { cache: "no-store" });
      const data = await res.json();
      state.cafes = data.cafes;
      $("#updated").textContent = data.updated.split("-").reverse().join("/");
    } catch (e) {
      $("#list").replaceChildren(el("p", { class: "empty" }, "Không tải được danh sách quán."));
      return;
    }
    mergeFeedback([]);
    renderList();
    renderSync();
    const remote = await loadRemote();
    mergeFeedback(remote);
    renderList();
    flush();
  }

  init();
})();
