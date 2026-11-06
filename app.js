"use strict";
// Ayuda de DIV 2 para htaW. Los datos (window.AYUDA) los genera genayuda.cs a partir de HELP.DIV.

const A = window.AYUDA;
const P = A.paginas;
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const hasHtaw = typeof htaw !== "undefined";

// ───────────── Textos de la interfaz (es / en) ─────────────

const TXT = {
  es: {
    tabToc: "Contenido", tabIdx: "Índice", tabRec: "Recientes", search: "Buscar en la ayuda  (Ctrl+F)",
    back: "Atrás (Alt+←)", fwd: "Adelante (Alt+→)", home: "Inicio", zoomIn: "Aumentar texto (Ctrl++)",
    zoomOut: "Reducir texto (Ctrl+−)", copy: "Copiar", save: "Guardar .PRG…", copied: "Ejemplo copiado",
    saved: "Guardado en ", page: "Página", noRes: "Sin resultados", best: "Coincidencias", inText: "En el texto",
    recEmpty: "Aquí aparecerán las páginas que visites.", note: "Nota de esta edición", broken: "Enlace roto en la ayuda original",
    saveTip: "Guarda el ejemplo en CP850 con saltos CRLF, listo para abrirlo en DIV2. Los ejemplos cargan sus recursos con rutas relativas a la carpeta de DIV2 (help\\help.fpg).",
    prgFilter: "Programa DIV", errSave: "No se pudo guardar: ", more: "más…",
    heroT: "Ayuda de DIV Games Studio 2",
    heroS: "La ayuda completa del entorno, con buscador, índice de palabras clave y notas añadidas en esta edición.",
    cStart: "Primeros pasos", cLang: "El lenguaje", cData: "Datos predefinidos", cRef: "Referencia rápida",
    cEnv: "El entorno", cNotes: "Notas de esta edición", errata: (n) => `${n} páginas corregidas`,
    foot: "Contenido: ayuda original de DIV Games Studio 2 (© 1998-99 Hammer Technologies), convertida desde HELP.DIV. Las notas añadidas se distinguen con un recuadro de color.",
    sCompile: "Errores de compilación", kinds: {},
  },
  en: {
    tabToc: "Contents", tabIdx: "Index", tabRec: "Recent", search: "Search the help  (Ctrl+F)",
    back: "Back (Alt+←)", fwd: "Forward (Alt+→)", home: "Home", zoomIn: "Larger text (Ctrl++)",
    zoomOut: "Smaller text (Ctrl+−)", copy: "Copy", save: "Save .PRG…", copied: "Example copied",
    saved: "Saved to ", page: "Page", noRes: "No results", best: "Matches", inText: "In the text",
    recEmpty: "Pages you visit will appear here.", note: "Note from this edition", broken: "Broken link in the original help",
    saveTip: "Saves the example in CP850 with CRLF line breaks, ready to open in DIV2. Examples load their resources relative to the DIV2 folder (help\\help.fpg).",
    prgFilter: "DIV program", errSave: "Could not save: ", more: "more…",
    heroT: "DIV Games Studio 2 help",
    heroS: "The complete help of the environment (in Spanish), with search, keyword index and notes added in this edition.",
    cStart: "Getting started", cLang: "The language", cData: "Predefined data", cRef: "Quick reference",
    cEnv: "The environment", cNotes: "Notes from this edition", errata: (n) => `${n} pages corrected`,
    foot: "Content: original DIV Games Studio 2 help (© 1998-99 Hammer Technologies), converted from HELP.DIV. Added notes are shown in a coloured box.",
    sCompile: "Compiler errors",
    kinds: { "Función": "Function", "Sentencia": "Statement", "Global": "Global", "Local": "Local", "Constante": "Constant", "Glosario": "Glossary", "Error": "Error" },
  },
};
let lang = /^es/i.test(navigator.language) ? "es" : "en";
const T = (k) => TXT[lang][k] ?? TXT.es[k];
const kindName = (k) => TXT[lang].kinds[k] ?? k;

// ───────────── Tablas de nombres ─────────────

const PAGE_IDS = Object.keys(P).map(Number).sort((a, b) => a - b);
const nameToPage = new Map();          // palabra (minúsculas) -> página
for (const [k, id] of A.indice) if (!nameToPage.has(k.toLowerCase())) nameToPage.set(k.toLowerCase(), id);
for (const id of PAGE_IDS) {
  const t = P[id].t;
  for (const part of t.split(" / ")) {
    const m = part.match(/^(?:GLOBAL |LOCAL )?(?:STRUCT )?([A-Za-z_][\w]*)(\(\)|\[\])?$/);
    if (m && !nameToPage.has(m[1].toLowerCase())) nameToPage.set(m[1].toLowerCase(), id);
  }
}
const KW = new Set(A.palabras);
const FN = new Set(A.funciones);
const CST = new Set(A.constantes);
const DAT = new Set(A.datos);

// ───────────── Estado ─────────────

const S = { cur: null, back: [], fwd: [], tab: "toc", zoom: 1, side: 300, recent: [], open: new Set(["sec0", "sec1"]) };
const settings = {
  async get(k, d) { try { return hasHtaw ? await htaw.settings.get(k, d) : (JSON.parse(localStorage.getItem(k)) ?? d); } catch { return d; } },
  set(k, v) { try { if (hasHtaw) htaw.settings.set(k, v); else localStorage.setItem(k, JSON.stringify(v)); } catch { } },
};

// ───────────── Navegación ─────────────

function exists(id) { return id === "inicio" || P[id] !== undefined; }

function go(id, opts = {}) {
  id = id === "inicio" ? id : Number(id);
  if (!exists(id)) return;
  if (opts.push !== false && S.cur !== null && S.cur !== id) { S.back.push(S.cur); S.fwd = []; }
  S.cur = id;
  render(id, opts.hl);
  settings.set("last", id);
  if (id !== "inicio") {
    S.recent = [id, ...S.recent.filter((x) => x !== id)].slice(0, 40);
    settings.set("recent", S.recent);
    if (S.tab === "rec" && !searching()) paintList();
  }
  markSelected();
  updateButtons();
}
function goBack() { if (!S.back.length) return; S.fwd.push(S.cur); const id = S.back.pop(); S.cur = null; go(id, { push: false }); }
function goFwd() { if (!S.fwd.length) return; S.back.push(S.cur); const id = S.fwd.pop(); S.cur = null; go(id, { push: false }); }
function updateButtons() {
  $("#back").disabled = !S.back.length;
  $("#fwd").disabled = !S.fwd.length;
}

// ───────────── Página ─────────────

const art = $("#art");

function render(id, hl) {
  art.className = "";
  if (id === "inicio") { renderHome(); return; }
  const p = P[id];
  let badges = "";
  if (p.k) badges += `<span class="badge">${esc(kindName(p.k))}</span>`;
  if (p.n) badges += `<span class="badge nueva">${esc(T("note"))}</span>`;
  else if (p.a) badges += `<span class="badge amp">+ ${esc(T("note"))}</span>`;
  art.innerHTML = `<div class="kind">${badges}<span class="num">${esc(T("page"))} ${id}</span></div>`
    + `<h1>${esc(p.t)}</h1>${p.h}`;
  enhance(art);
  $("#crumb").textContent = (p.k ? kindName(p.k) + " · " : "") + p.t;
  document.title = `${p.t} — ${T("heroT")}`;
  if (hasHtaw) htaw.window.setTitle(`${p.t} — Ayuda de DIV 2`).catch(() => { });
  $("#scroll").scrollTo({ top: 0, behavior: "instant" });
  if (hl && hl.length) highlight(art, hl);
}

function enhance(root) {
  for (const a of root.querySelectorAll("a[data-p]")) {
    const d = Number(a.dataset.p);
    if (!P[d]) { a.classList.add("roto"); a.title = T("broken"); }
    else a.title = P[d].t;
  }
  for (const n of root.querySelectorAll(".nota")) n.dataset.l = T("note");
  for (const ej of root.querySelectorAll(".ejemplo")) {
    const pre = ej.querySelector("pre");
    const code = pre.textContent;
    pre.innerHTML = colorize(code);
    const head = document.createElement("div");
    head.className = "ej-head";
    head.innerHTML = `<span class="t">${esc(ej.dataset.t || "Ejemplo")}</span>`
      + `<button data-act="copy">${esc(T("copy"))}</button>`
      + `<button data-act="save" title="${esc(T("saveTip"))}">${esc(T("save"))}</button>`;
    ej.prepend(head);
    ej._code = code;
  }
}

  art.addEventListener("click", async (e) => {
    const a = e.target.closest("a[data-p]");
    if (a) { e.preventDefault(); if (P[a.dataset.p]) go(a.dataset.p); return; }
    const l = e.target.closest(".lnk[data-p]");
    if (l) { go(l.dataset.p); return; }
    const b = e.target.closest("button[data-act]");
    if (!b) return;
    const ej = b.closest(".ejemplo");
    if (b.dataset.act === "copy") await copyText(ej._code);
    else await savePrg(ej._code);
  });

async function copyText(t) {
  try {
    if (hasHtaw) await htaw.clipboard.writeText(t.replace(/\r?\n/g, "\r\n"));
    else await navigator.clipboard.writeText(t);
    toast(T("copied"));
  } catch (e) { toast(e.message); }
}

const CP850 = new Map();
for (let i = 0; i < A.cp850.length; i++) CP850.set(A.cp850[i], 128 + i);
function toCp850(text) {
  const t = text.replace(/\r?\n/g, "\r\n") + "\r\n";
  const out = new Uint8Array(t.length);
  for (let i = 0; i < t.length; i++) {
    const c = t.charCodeAt(i);
    out[i] = c < 128 ? c : (CP850.get(t[i]) ?? 63);
  }
  return out;
}
async function savePrg(code) {
  if (!hasHtaw) return;
  const m = code.match(/^\s*PROGRAM\s+([\w]+)/im);
  let base = (m ? m[1] : "ejemplo").replace(/^ejemplo_?/i, "") || "ejemplo";
  base = base.normalize("NFD").replace(/[^\w]/g, "").slice(0, 8).toUpperCase() || "EJEMPLO";
  try {
    const dir = await settings.get("prgDir", null);
    const path = await htaw.dialog.save({
      fileName: base + ".PRG", defaultExtension: "prg", defaultPath: dir ?? undefined,
      filters: [{ name: T("prgFilter"), patterns: ["prg"] }],
    });
    if (!path) return;
    await htaw.fs.writeBytes(path, toCp850(code));
    settings.set("prgDir", path.replace(/[\\/][^\\/]*$/, ""));
    toast(T("saved") + path);
  } catch (e) { toast(T("errSave") + e.message); }
}

let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

// Resaltado de sintaxis del lenguaje DIV
function colorize(code) {
  const re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\n]|"")*"?|'(?:[^'\n]|'')*'?)|(\b\d+\b)|([A-Za-z_À-ÿ][\wÀ-ÿ]*)/g;
  let out = "", last = 0, m;
  while ((m = re.exec(code))) {
    out += esc(code.slice(last, m.index));
    last = re.lastIndex;
    if (m[1]) out += `<span class="hl-cmt">${esc(m[1])}</span>`;
    else if (m[2]) out += `<span class="hl-str">${esc(m[2])}</span>`;
    else if (m[3]) out += `<span class="hl-num">${m[3]}</span>`;
    else {
      const w = m[4], lw = w.toLowerCase();
      const call = /^\s*\(/.test(code.slice(last));
      let cls = null;
      if (KW.has(lw)) cls = "hl-kw";
      else if (FN.has(lw) && call) cls = "hl-fn";
      else if (CST.has(lw)) cls = "hl-cst";
      else if (DAT.has(lw)) cls = "hl-var";
      if (!cls) { out += esc(w); continue; }
      const pid = nameToPage.get(lw);
      out += pid && cls !== "hl-kw"
        ? `<span class="${cls} lnk" data-p="${pid}" title="${esc(P[pid].t)}">${esc(w)}</span>`
        : `<span class="${cls}">${esc(w)}</span>`;
    }
  }
  return out + esc(code.slice(last));
}

// Marca los términos buscados dentro de la página
function highlight(root, terms) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  let first = null;
  for (const n of nodes) {
    const txt = n.nodeValue, nt = norm(txt);
    const hits = [];
    for (const t of terms) {
      let i = nt.indexOf(t);
      while (i >= 0) { hits.push([i, i + t.length]); i = nt.indexOf(t, i + t.length); }
    }
    if (!hits.length) continue;
    hits.sort((a, b) => a[0] - b[0]);
    const frag = document.createDocumentFragment();
    let pos = 0;
    for (const [s, e] of hits) {
      if (s < pos) continue;
      frag.append(txt.slice(pos, s));
      const mk = document.createElement("mark");
      mk.textContent = txt.slice(s, e);
      frag.append(mk);
      first ??= mk;
      pos = e;
    }
    frag.append(txt.slice(pos));
    n.replaceWith(frag);
  }
  if (first) requestAnimationFrame(() => reveal($("#scroll"), first, true));
}

// ───────────── Portada ─────────────

function link(id, label) {
  if (!P[id]) return "";
  return `<a data-p="${id}">${esc(label ?? P[id].t)}</a>`;
}
function renderHome() {
  art.className = "inicio";
  const notas = PAGE_IDS.filter((id) => P[id].n);
  const ampl = PAGE_IDS.filter((id) => P[id].a && !P[id].n);
  const corr = PAGE_IDS.filter((id) => P[id].h.includes('class="erratas"'));
  const card = (title, ids) => `<div class="card"><h2><span class="dot"></span>${esc(title)}</h2>${ids.map((x) => Array.isArray(x) ? link(x[0], x[1]) : link(x)).join("")}</div>`;
  art.innerHTML = `<div class="hero"><h1>${esc(T("heroT"))}</h1><p>${esc(T("heroS"))}</p></div>
    <div class="cards">
      ${card(T("cStart"), [2000, 2004, 2012, 2013, 1])}
      ${card(T("cLang"), [1000, 1017, 1032, 1401, 1035, 1037, 2001])}
      ${card(T("cData"), [1202, 1200, 1201, 1176, 4])}
      ${card(T("cEnv"), [2002, 1291, 1294, 1295, 1293, 1300, 2003])}
      ${notas.length || ampl.length ? card(T("cNotes"), [...notas, ...ampl.slice(0, 8)]) + "" : ""}
    </div>
    <p class="foot">${esc(T("foot"))}${corr.length ? " " + esc(TXT[lang].errata(corr.length)) + "." : ""}</p>`;
  enhance(art);
  $("#crumb").textContent = T("home");
  document.title = T("heroT");
  if (hasHtaw) htaw.window.setTitle("Ayuda de DIV 2").catch(() => { });
}

// ───────────── Panel lateral ─────────────

const list = $("#list");
const q = $("#q");

const TOC = () => [
  { t: T("cStart"), ids: [2000, 2004, 2012, 2013, 2007, 2014, 1] },
  { t: T("cLang"), ids: [1000, 1017, 1032, 1401, 1035, 1037, 1400, 1176, 4, 2001] },
  { t: T("cData"), ids: [1202, 1200, 1201] },
  { t: T("cEnv"), ids: [2002, 2005, 2006, 2010, 2011, 1291, 1292, 1293, 1294, 1295, 1301, 1300, 2003, 2008, 2009] },
  { t: T("sCompile"), ids: PAGE_IDS.filter((id) => id >= 500 && id < 700) },
  { t: T("cNotes"), ids: PAGE_IDS.filter((id) => P[id].n) },
].map((s) => ({ ...s, ids: s.ids.filter((id) => P[id]) })).filter((s) => s.ids.length);

const childCache = new Map();
function children(id) {
  if (childCache.has(id)) return childCache.get(id);
  const doc = new DOMParser().parseFromString(`<div>${P[id].h}</div>`, "text/html");
  const groups = [];
  for (const g of doc.querySelectorAll(".grupo")) {
    const ids = [...g.querySelectorAll(".enlaces a[data-p]")].map((a) => Number(a.dataset.p)).filter((x) => P[x]);
    if (ids.length) groups.push({ t: g.querySelector(".grupo-t")?.textContent ?? "", ids });
  }
  if (!groups.length) {
    const ids = [...doc.querySelectorAll(".tabla tr td:first-child a[data-p]")].map((a) => Number(a.dataset.p)).filter((x) => P[x]);
    if (ids.length >= 3) groups.push({ t: "", ids: [...new Set(ids)] });
  }
  const res = groups.length ? groups : null;
  childCache.set(id, res);
  return res;
}

const CHEV = `<svg class="chev" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4"/></svg>`;
function navItem(id, label, extra = "") {
  const p = P[id];
  return `<div class="nav" data-p="${id}" title="${esc(p.t)}">${extra}<span class="lbl">${esc(label ?? p.t)}</span></div>`;
}

function paintList() {
  if (searching()) { paintResults(); return; }
  if (S.tab === "toc") paintToc();
  else if (S.tab === "idx") paintIndex();
  else paintRecent();
  markSelected();
}

function paintToc() {
  let h = "";
  TOC().forEach((sec, si) => {
    const key = "sec" + si, open = S.open.has(key);
    h += `<div class="nav sect" data-k="${key}">${CHEV.replace('class="chev"', `class="chev${open ? " open" : ""}"`)}<span class="lbl">${esc(sec.t)}</span></div>`;
    if (!open) return;
    h += `<div class="kids">`;
    for (const id of sec.ids) {
      const kids = children(id);
      if (!kids) { h += navItem(id, null, `<span class="pad"></span>`); continue; }
      const k = "p" + id, o = S.open.has(k);
      h += navItem(id, null, `<span data-k="${k}">${CHEV.replace('class="chev"', `class="chev${o ? " open" : ""}"`)}</span>`);
      if (!o) continue;
      h += `<div class="kids">`;
      for (const g of kids) {
        if (g.t) h += `<div class="grp">${esc(g.t)}</div>`;
        for (const c of g.ids) h += navItem(c);
      }
      h += `</div>`;
    }
    h += `</div>`;
  });
  list.innerHTML = h;
}

let indexCache = null;
function indexEntries() {
  if (indexCache) return indexCache;
  const seen = new Set(), out = [];
  const add = (label, id) => {
    const key = label.toLowerCase().replace(/\(\)$/, "") + "|" + id;
    if (seen.has(key) || !P[id]) return;
    seen.add(key);
    // Clave de orden: sin signos ni subrayados iniciales; los símbolos solos van al principio.
    const sk = norm(label).replace(/^[^a-z0-9]+/, "");
    const L = !sk ? "#" : /[a-z]/.test(sk[0]) ? sk[0].toUpperCase() : "0–9";
    out.push({ label, id, sk, L, g: !sk ? 0 : /[a-z]/.test(sk[0]) ? 2 : 1 });
  };
  for (const id of PAGE_IDS) add(P[id].t, id);
  for (const [k, id] of A.indice) add(k, id);
  const coll = new Intl.Collator("es", { sensitivity: "base", numeric: true });
  out.sort((a, b) => a.g - b.g || coll.compare(a.sk || a.label, b.sk || b.label) || a.label.length - b.label.length);
  return (indexCache = out);
}
function paintIndex() {
  let h = "", letter = "";
  for (const e of indexEntries()) {
    const L = e.L;
    if (L !== letter) { letter = L; h += `<div class="letter">${L}</div>`; }
    const code = /^\S+$/.test(e.label) && !/^[A-ZÁÉÍÓÚ¡¿]/.test(e.label);
    h += `<div class="nav" data-p="${e.id}" title="${esc(P[e.id].t)}"><span class="lbl${code ? " mono" : ""}">${esc(e.label)}</span></div>`;
  }
  list.innerHTML = h;
}

function paintRecent() {
  const ids = S.recent.filter((id) => P[id]);
  list.innerHTML = ids.length ? ids.map((id) => navItem(id)).join("") : `<div class="empty">${esc(T("recEmpty"))}</div>`;
}

function markSelected() {
  for (const n of list.querySelectorAll(".nav.sel")) n.classList.remove("sel");
  if (searching()) return;
  const n = list.querySelector(`.nav[data-p="${S.cur}"]`);
  if (n) { n.classList.add("sel"); reveal(list, n); }
}

list.addEventListener("click", (e) => {
  const tog = e.target.closest("[data-k]");
  if (tog) {
    const k = tog.dataset.k;
    S.open.has(k) ? S.open.delete(k) : S.open.add(k);
    settings.set("open", [...S.open]);
    paintList();
    if (!tog.closest(".nav[data-p]")) return;
    e.stopPropagation();
    return;
  }
  const n = e.target.closest("[data-p]");
  if (!n) return;
  go(n.dataset.p, { hl: n.dataset.hl ? JSON.parse(n.dataset.hl) : null });
});

for (const b of document.querySelectorAll(".tabs .tab")) {
  b.addEventListener("click", () => {
    S.tab = b.dataset.tab;
    settings.set("tab", S.tab);
    for (const x of document.querySelectorAll(".tabs .tab")) x.classList.toggle("selected", x === b);
    if (searching()) { q.value = ""; }
    paintList();
  });
}

// ───────────── Búsqueda ─────────────

const STOP = new Set("de del la las el los lo en y o a un una unos unas que con por para al se es su sus the of to and in".split(" "));
let textIndex = null;
function buildText() {
  if (textIndex) return textIndex;
  const tmp = document.createElement("textarea");
  textIndex = PAGE_IDS.map((id) => {
    tmp.innerHTML = P[id].h.replace(/<[^>]+>/g, " ");
    const raw = tmp.value.replace(/\s+/g, " ").trim();
    return { id, raw, b: norm(raw), n: norm(P[id].t + " " + raw) };
  });
  return textIndex;
}

function searching() { return q.value.trim().length > 0; }

function search(text) {
  const qn = norm(text.trim());
  const all = qn.split(/\s+/).filter(Boolean);
  const content = all.filter((t) => !STOP.has(t));
  const toks = content.length ? content : all;
  const best = new Map();
  const consider = (label, id, base) => {
    if (!P[id]) return;
    const ln = norm(label);
    const bare = ln.replace(/\(\)$/, "");
    let s = 0;
    if (ln === qn || bare === qn) s = 100;
    else if (bare.startsWith(qn)) s = 70 - Math.min(20, bare.length - qn.length);
    else if (toks.every((t) => ln.includes(t))) s = 40 - Math.min(20, ln.length / 4);
    if (!s) return;
    s += base;
    const cur = best.get(id);
    if (!cur || cur.s < s) best.set(id, { s, label });
  };
  for (const [k, id] of A.indice) consider(k, id, 2);
  for (const id of PAGE_IDS) consider(P[id].t, id, 0);
  const top = [...best.entries()].sort((a, b) => b[1].s - a[1].s || a[1].label.length - b[1].label.length).slice(0, 40);

  const inText = [];
  if (toks.join("").length >= 2) {
    for (const e of buildText()) {
      if (best.has(e.id)) continue;
      if (!toks.every((t) => e.n.includes(t))) continue;
      let count = 0;
      for (const t of toks) { let i = e.n.indexOf(t); while (i >= 0 && count < 50) { count++; i = e.n.indexOf(t, i + t.length); } }
      const i = Math.max(0, e.b.indexOf(toks[0]));
      const from = Math.max(0, i - 50);
      inText.push({ id: e.id, count, snip: (from > 0 ? "…" : "") + e.raw.slice(from, i + 110) });
    }
    inText.sort((a, b) => b.count - a.count);
  }
  return { toks, top, inText: inText.slice(0, 120) };
}

function markSnip(s, toks) {
  let h = esc(s);
  for (const t of toks) {
    if (t.length < 2) continue;
    const re = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").split("").map((c) => /[aeiou]/.test(c) ? `[${c}${{ a: "áà", e: "éè", i: "íì", o: "óò", u: "úùü" }[c]}]` : c).join(""), "gi");
    h = h.replace(re, (m) => `<mark>${m}</mark>`);
  }
  return h;
}

let resultSel = 0;
function paintResults() {
  const r = search(q.value);
  const hl = esc(JSON.stringify(r.toks));
  let h = "";
  if (r.top.length) {
    h += `<div class="res-h">${esc(T("best"))}</div>`;
    for (const [id, { label }] of r.top) {
      const p = P[id];
      const sub = label !== p.t ? p.t : (p.r ?? "");
      h += `<div class="nav res" data-p="${id}"><div class="t"><span class="lbl">${markSnip(label, r.toks)}</span>${p.k ? `<span class="badge">${esc(kindName(p.k))}</span>` : ""}</div>${sub ? `<div class="s">${esc(sub)}</div>` : ""}</div>`;
    }
  }
  if (r.inText.length) {
    h += `<div class="res-h">${esc(T("inText"))} (${r.inText.length})</div>`;
    for (const e of r.inText) {
      const p = P[e.id];
      h += `<div class="nav res" data-p="${e.id}" data-hl="${hl}"><div class="t"><span class="lbl">${esc(p.t)}</span>${p.k ? `<span class="badge">${esc(kindName(p.k))}</span>` : ""}</div><div class="s">${markSnip(e.snip, r.toks)}</div></div>`;
    }
  }
  list.innerHTML = h || `<div class="empty">${esc(T("noRes"))}</div>`;
  list.scrollTop = 0;
  resultSel = 0;
  selectResult(0);
}
function selectResult(i) {
  const items = list.querySelectorAll(".res");
  if (!items.length) return;
  resultSel = Math.max(0, Math.min(items.length - 1, i));
  items.forEach((n, k) => n.classList.toggle("sel", k === resultSel));
  reveal(list, items[resultSel]);
}

let searchTimer;
q.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(paintList, 90);
});
q.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown") { e.preventDefault(); selectResult(resultSel + 1); }
  else if (e.key === "ArrowUp") { e.preventDefault(); selectResult(resultSel - 1); }
  else if (e.key === "Enter") {
    e.preventDefault();
    clearTimeout(searchTimer);
    if (searching() && !list.querySelector(".res")) paintList();
    list.querySelectorAll(".res")[resultSel]?.click();
  } else if (e.key === "Escape") {
    if (q.value) { q.value = ""; paintList(); } else art.focus();
  }
});

// ───────────── Separador y zoom ─────────────

const split = $("#split");
function setSide(px, save) {
  S.side = Math.round(Math.max(200, Math.min(560, px)));
  document.documentElement.style.setProperty("--side", S.side + "px");
  if (save) settings.set("side", S.side);
}
split.addEventListener("pointerdown", (e) => {
  split.setPointerCapture(e.pointerId);
  document.body.classList.add("dragging");
  const move = (ev) => setSide(ev.clientX - 3, false);
  const up = () => {
    split.removeEventListener("pointermove", move);
    document.body.classList.remove("dragging");
    setSide(S.side, true);
  };
  split.addEventListener("pointermove", move);
  split.addEventListener("pointerup", up, { once: true });
});
split.addEventListener("dblclick", () => setSide(300, true));
split.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") setSide(S.side - 16, true);
  else if (e.key === "ArrowRight") setSide(S.side + 16, true);
});

function setZoom(z, save = true) {
  S.zoom = Math.round(Math.max(0.7, Math.min(1.8, z)) * 10) / 10;
  document.documentElement.style.setProperty("--zoom", S.zoom);
  $("#zoomVal").textContent = Math.round(S.zoom * 100) + "%";
  if (save) settings.set("zoom", S.zoom);
}
$("#zoomIn").onclick = () => setZoom(S.zoom + 0.1);
$("#zoomOut").onclick = () => setZoom(S.zoom - 0.1);
$("#zoomVal").ondblclick = () => setZoom(1);
$("#scroll").addEventListener("wheel", (e) => {
  if (!e.ctrlKey) return;
  e.preventDefault();
  setZoom(S.zoom + (e.deltaY < 0 ? 0.1 : -0.1));
}, { passive: false });

$("#back").onclick = goBack;
$("#fwd").onclick = goFwd;
$("#home").onclick = () => go("inicio");

addEventListener("keydown", (e) => {
  const inField = e.target.matches("input, textarea");
  if ((e.ctrlKey && (e.key === "f" || e.key === "k")) || e.key === "F3") { e.preventDefault(); q.focus(); q.select(); }
  else if (e.altKey && e.key === "ArrowLeft") { e.preventDefault(); goBack(); }
  else if (e.altKey && e.key === "ArrowRight") { e.preventDefault(); goFwd(); }
  else if (e.key === "Backspace" && !inField) { e.preventDefault(); goBack(); }
  else if (e.ctrlKey && (e.key === "+" || e.key === "=")) { e.preventDefault(); setZoom(S.zoom + 0.1); }
  else if (e.ctrlKey && e.key === "-") { e.preventDefault(); setZoom(S.zoom - 0.1); }
  else if (e.ctrlKey && e.key === "0") { e.preventDefault(); setZoom(1); }
  else if (e.altKey && e.key === "Home") { e.preventDefault(); go("inicio"); }
});
addEventListener("mouseup", (e) => {
  if (e.button === 3) { e.preventDefault(); goBack(); }
  else if (e.button === 4) { e.preventDefault(); goFwd(); }
});

// ───────────── Arranque ─────────────

function applyLang() {
  document.documentElement.lang = lang;
  for (const n of document.querySelectorAll("[data-i18n]")) n.textContent = T(n.dataset.i18n);
  for (const n of document.querySelectorAll("[data-i18n-title]")) n.title = T(n.dataset.i18nTitle);
  q.placeholder = T("search");
}

(async function start() {
  if (hasHtaw) {
    try {
      const forced = await htaw.env.get("DIV2AYUDA_LANG");
      if (forced && TXT[forced.slice(0, 2).toLowerCase()]) lang = forced.slice(0, 2).toLowerCase();
    } catch { }
  }
  applyLang();
  setSide(await settings.get("side", 300), false);
  setZoom(await settings.get("zoom", 1), false);
  S.recent = await settings.get("recent", []);
  S.open = new Set(await settings.get("open", ["sec0", "sec1"]));
  S.tab = await settings.get("tab", "toc");
  for (const x of document.querySelectorAll(".tabs .tab")) x.classList.toggle("selected", x.dataset.tab === S.tab);

  // Un argumento abre esa palabra clave: htaw ayuda.htaw get_angle
  const arg = hasHtaw ? (htaw.app.args[0] ?? "").trim() : "";
  let first = null;
  if (arg) {
    first = nameToPage.get(arg.toLowerCase().replace(/\(\)$/, "")) ?? (/^\d+$/.test(arg) && P[arg] ? Number(arg) : null);
    if (!first) q.value = arg;
  }
  if (!first) {
    const last = await settings.get("last", "inicio");
    first = exists(last) ? last : "inicio";
  }
  paintList();
  go(first, { push: false });
  if (q.value) q.focus();
})();

// Desplaza un contenedor para mostrar un elemento sin mover la ventana (scrollIntoView movería también #app).
function reveal(box, el, center) {
  const b = box.getBoundingClientRect(), r = el.getBoundingClientRect();
  if (center) { box.scrollTop += r.top - b.top - b.height / 2 + r.height / 2; return; }
  if (r.top < b.top) box.scrollTop -= b.top - r.top + 4;
  else if (r.bottom > b.bottom) box.scrollTop += r.bottom - b.bottom + 4;
}
