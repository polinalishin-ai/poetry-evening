/* ==========
   Библиотека забытых голосов — логика
   ========== */

const CONFIG = {
  // Замените на ваши ссылки на формы регистрации:
  REG_GUEST_URL: "#",
  REG_SPEAKER_URL: "#",
};

const THEMES = {
  love: { label: "Любовь", color: "love" },
  philosophy: { label: "Философия", color: "philosophy" },
  civic: { label: "Гражданственность", color: "civic" },
  landscape: { label: "Пейзаж", color: "landscape" },
};

/**
 * Данные выступающих.
 * Замените плейсхолдеры на реальные ФИО / группы / названия стихотворений.
 */
const SPEAKERS = [
  { name: "Имя Фамилия", group: "курс • группа", poem: "«Название стихотворения»", theme: "philosophy" },
  { name: "Имя Фамилия", group: "курс • группа", poem: "«Название стихотворения»", theme: "love" },
  { name: "Имя Фамилия", group: "курс • группа", poem: "«Название стихотворения»", theme: "civic" },
  { name: "Имя Фамилия", group: "курс • группа", poem: "«Название стихотворения»", theme: "landscape" },
  { name: "—", group: "список будет дополняться", poem: "Отправьте данные — я быстро внесу в массив SPEAKERS", theme: "love" },
];

function qs(sel, root = document) { return root.querySelector(sel); }
function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }


function initVhUnit(){
  const set = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  };
  set();

  let t = null;
  const onResize = () => {
    clearTimeout(t);
    t = setTimeout(set, 140);
  };

  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("orientationchange", () => setTimeout(set, 140), { passive: true });
}

function initDrawer() {
  const btn = qs(".navbtn");
  const drawer = qs(".drawer");

  if (!btn || !drawer) return;

  btn.addEventListener("click", () => {
    const expanded = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!expanded));
    drawer.hidden = expanded;
  });

  // Close drawer when clicking a link
  qsa(".drawer__link").forEach((a) => {
    a.addEventListener("click", () => {
      btn.setAttribute("aria-expanded", "false");
      drawer.hidden = true;
    });
  });
}

function initSectionTransitions() {
  const sections = qsa(".section");
  if (!sections.length) return;

  // Mark sections that are already on screen before enabling the effect
  sections.forEach((s) => {
    const r = s.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.9 && r.bottom > 0) {
      s.classList.add("is-inview");
    }
  });

  // Enable CSS transitions only after the first paint-state is set
  document.body.classList.add("has-scrollfx");

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add("is-inview");
        io.unobserve(e.target);
      }
    }
  }, { threshold: 0.12, rootMargin: "0px 0px -10% 0px" });

  sections.forEach((s) => {
    if (!s.classList.contains("is-inview")) io.observe(s);
  });
}


function initReveal() {
  const els = qsa(".reveal");
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add("is-visible");
        io.unobserve(e.target);
      }
    }
  }, { threshold: 0.12 });

  els.forEach(el => io.observe(el));
}

function initScrollSpy() {
  const links = qsa(".nav__link").filter(a => a.getAttribute("href")?.startsWith("#"));
  const sections = links
    .map(a => qs(a.getAttribute("href")))
    .filter(Boolean);

  if (!links.length || !sections.length) return;

  const byId = new Map(links.map(a => [a.getAttribute("href").slice(1), a]));

  const io = new IntersectionObserver((entries) => {
    // pick the most visible
    const visible = entries.filter(e => e.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;

    const id = visible.target.id;
    links.forEach(a => a.classList.remove("is-active"));
    const link = byId.get(id);
    if (link) link.classList.add("is-active");
  }, { rootMargin: "-40% 0px -55% 0px", threshold: [0.06, 0.15, 0.3, 0.5] });

  sections.forEach(s => io.observe(s));
}

function initRegistrationLinks() {
  const g = qs("#regGuest");
  const s = qs("#regSpeaker");

  // If CONFIG still has placeholders ("#"), keep the links already set in HTML.
  if (g && CONFIG.REG_GUEST_URL && CONFIG.REG_GUEST_URL !== "#") g.href = CONFIG.REG_GUEST_URL;
  if (s && CONFIG.REG_SPEAKER_URL && CONFIG.REG_SPEAKER_URL !== "#") s.href = CONFIG.REG_SPEAKER_URL;
}

function renderSpeakers(items) {
  const grid = qs("#speakerGrid");
  if (!grid) return;

  grid.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "speaker";
    empty.textContent = "Ничего не найдено.";
    grid.appendChild(empty);
    return;
  }

  for (const sp of items) {
    const theme = THEMES[sp.theme] || { label: "Тема", color: "other" };

    const el = document.createElement("article");
    el.className = "speaker";

    el.innerHTML = `
      <div class="speaker__top">
        <div>
          <h3 class="speaker__name">${escapeHtml(sp.name)}</h3>
          <div class="speaker__meta">${escapeHtml(sp.group || "")}</div>
        </div>
        <span class="badge">${escapeHtml(theme.label)}</span>
      </div>
      <div class="speaker__poem">${escapeHtml(sp.poem || "")}</div>
    `;

    grid.appendChild(el);
  }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function initBoard() {
  const chips = qsa(".chip");
  const input = qs("#q");

  let activeTheme = "all";
  let query = "";

  const apply = () => {
    const q = query.trim().toLowerCase();

    const filtered = SPEAKERS.filter(sp => {
      const okTheme = activeTheme === "all" ? true : sp.theme === activeTheme;

      if (!okTheme) return false;
      if (!q) return true;

      const hay = `${sp.name} ${sp.group || ""} ${sp.poem || ""}`.toLowerCase();
      return hay.includes(q);
    });

    renderSpeakers(filtered);
  };

  chips.forEach(btn => {
    btn.addEventListener("click", () => {
      chips.forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      activeTheme = btn.dataset.theme || "all";
      apply();
    });
  });

  if (input) {
    input.addEventListener("input", () => {
      query = input.value || "";
      apply();
    });
  }

  renderSpeakers(SPEAKERS);
}

function init() {
  initVhUnit();
  initSectionTransitions();
  initDrawer();
  initReveal();
  initScrollSpy();
  initRegistrationLinks();
  initBoard();
}

document.addEventListener("DOMContentLoaded", init);
