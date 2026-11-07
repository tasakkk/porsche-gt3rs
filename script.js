const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const fmt = (v, d = 0) => v.toFixed(d).replace(".", ",");
const commons = (file, width) => `https://commons.wikimedia.org/wiki/Special:FilePath/${file}?width=${width}`;

/* =========================================================
   NAGŁÓWEK, PASEK POSTĘPU, PARALAKSA
   ========================================================= */
const header = $("#header");
const hero = $(".hero");
const heroMedia = $("#heroMedia");
const progress = $("#progress");
const banner = $("#weissach");
const bannerImg = $("#weissach img");
let mouseX = 0, mouseY = 0;

function onScroll() {
  const y = window.scrollY;
  header.classList.toggle("is-solid", y > hero.offsetHeight - 80);
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  if (reduceMotion) return;
  if (y < hero.offsetHeight) {
    heroMedia.style.transform = `translate3d(${mouseX * -14}px, ${y * 0.3 + mouseY * -10}px, 0)`;
  }
  const r = banner.getBoundingClientRect();
  if (r.bottom > 0 && r.top < innerHeight) {
    const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
    bannerImg.style.transform = `translate3d(0, ${p * -12}%, 0)`;
  }
}
window.addEventListener("scroll", onScroll, { passive: true });
hero.addEventListener("pointermove", (e) => {
  if (e.pointerType !== "mouse") return;
  mouseX = e.clientX / innerWidth - 0.5;
  mouseY = e.clientY / innerHeight - 0.5;
  onScroll();
});
onScroll();

/* =========================================================
   MENU
   ========================================================= */
const menu = $("#menu");
const menuOpen = $("#menuOpen");
function setMenu(open) {
  menu.classList.toggle("is-open", open);
  menu.setAttribute("aria-hidden", String(!open));
  menuOpen.setAttribute("aria-expanded", String(open));
  document.body.style.overflow = open ? "hidden" : "";
}
menuOpen.addEventListener("click", () => setMenu(true));
$("#menuClose").addEventListener("click", () => setMenu(false));
$("#menuBackdrop").addEventListener("click", () => setMenu(false));
$$("#menu a").forEach((a) => a.addEventListener("click", () => setMenu(false)));

/* =========================================================
   LICZNIKI I POJAWIANIE SIĘ
   ========================================================= */
function countUp(el) {
  const target = Number(el.dataset.count);
  const d = Number(el.dataset.decimals || 0);
  if (reduceMotion) return (el.textContent = fmt(target, d));
  const start = performance.now();
  (function frame(now) {
    const t = Math.min((now - start) / 1400, 1);
    el.textContent = fmt(target * (1 - Math.pow(1 - t, 4)), d);
    if (t < 1) requestAnimationFrame(frame);
  })(start);
}
$$(".section .h2, .figures, .hotspots, .sim, .aero, .paint, .banner__content, .gens, .compare, .tuners").forEach((el) => el.classList.add("reveal"));
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("is-visible");
    if (entry.target.classList.contains("figures")) $$("[data-count]", entry.target).forEach(countUp);
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.12 });
$$(".reveal").forEach((el) => revealObserver.observe(el));

/* =========================================================
   DETALE: HOTSPOTY + LUPA
   ========================================================= */
const spots = [
  { title: "Tylne skrzydło", text: "Mocowane od góry („łabędzia szyja”), więc spód profilu – najważniejsza część – jest czysty. Sięga wyżej niż dach, a górna klapa ma hydrauliczny DRS." },
  { title: "Pokrywa silnika", text: "Wloty i kratki w pokrywie chłodzą i zasilają 4,0-litrowego boksera umieszczonego za tylną osią." },
  { title: "Tylne lampy", text: "Pas świetlny LED przez całą szerokość auta – znak rozpoznawczy generacji 992." },
  { title: "Dyfuzor i wydech", text: "Dyfuzor przyspiesza powietrze pod autem i dokłada docisku. Sportowy wydech gra aż do 9000 obr./min." },
  { title: "Koła z centralną nakrętką", text: "Kute felgi mocowane jedną nakrętką, jak w wyścigówkach. Z tyłu opony 335/30 R21, a z pakietem Weissach można zamówić felgi z magnezu." },
];
const dots = $$(".dot");
let spotIndex = 0;
function setSpot(i) {
  spotIndex = (i + spots.length) % spots.length;
  dots.forEach((d, j) => d.classList.toggle("is-active", j === spotIndex));
  $("#spotKicker").textContent = `Detal ${spotIndex + 1} z ${spots.length}`;
  $("#spotTitle").textContent = spots[spotIndex].title;
  $("#spotText").textContent = spots[spotIndex].text;
}
dots.forEach((d) => d.addEventListener("click", () => setSpot(Number(d.dataset.spot))));
$("#spotPrev").addEventListener("click", () => setSpot(spotIndex - 1));
$("#spotNext").addEventListener("click", () => setSpot(spotIndex + 1));
setSpot(0);

const lensStage = $("#lensStage");
const lens = $("#lens");
const lensImg = $("#lensImg");
const lensToggle = $("#lensToggle");
const lensZoom = $("#lensZoom");
let lensBgLoaded = false;

function setLensOn(on) {
  lensStage.classList.toggle("lens-on", on);
  lensStage.style.touchAction = on ? "none" : "";
  if (on && !lensBgLoaded) {
    lens.style.backgroundImage = `url("${lensImg.dataset.large}")`;
    lensBgLoaded = true;
  }
  if (!on) lens.classList.remove("is-visible");
}
lensToggle.addEventListener("change", () => setLensOn(lensToggle.checked));
lensZoom.addEventListener("input", () => {
  $("#lensZoomOut").textContent = `${fmt(Number(lensZoom.value), 1)}×`;
});
function moveLens(e) {
  if (!lensToggle.checked) return;
  const r = lensStage.getBoundingClientRect();
  const x = clamp(e.clientX - r.left, 0, r.width);
  const y = clamp(e.clientY - r.top, 0, r.height);
  const z = Number(lensZoom.value);
  const half = lens.offsetWidth / 2;
  lens.style.left = `${x}px`;
  lens.style.top = `${y}px`;
  lens.style.backgroundSize = `${r.width * z}px ${r.height * z}px`;
  lens.style.backgroundPosition = `${-(x * z - half)}px ${-(y * z - half)}px`;
  lens.classList.add("is-visible");
}
lensStage.addEventListener("pointermove", moveLens);
lensStage.addEventListener("pointerdown", moveLens);
lensStage.addEventListener("pointerleave", () => lens.classList.remove("is-visible"));
lensStage.addEventListener("wheel", (e) => {
  if (!lensToggle.checked) return;
  e.preventDefault();
  lensZoom.value = clamp(Number(lensZoom.value) - e.deltaY * 0.004, 1.5, 5);
  lensZoom.dispatchEvent(new Event("input"));
  moveLens(e);
}, { passive: false });

/* =========================================================
   SYMULATOR PRZYSPIESZENIA + DŹWIĘK
   ========================================================= */
const MAX_RPM = 10000, REDLINE = 9000, IDLE = 950;
const CX = 150, CY = 150;
const rpmToAngle = (rpm) => -135 + (rpm / MAX_RPM) * 270;
const polar = (deg, r) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
};
(function buildTacho() {
  let svg = "";
  for (let rpm = 0; rpm <= MAX_RPM; rpm += 500) {
    const major = rpm % 1000 === 0;
    const ang = rpmToAngle(rpm);
    const [x1, y1] = polar(ang, major ? 114 : 120);
    const [x2, y2] = polar(ang, 130);
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="tick${major ? " tick--major" : ""}"/>`;
    if (major) {
      const [tx, ty] = polar(ang, 98);
      svg += `<text x="${tx}" y="${ty}" class="num">${rpm / 1000}</text>`;
    }
  }
  $("#tachoTicks").innerHTML = svg;
  const [sx, sy] = polar(rpmToAngle(REDLINE), 134);
  const [ex, ey] = polar(rpmToAngle(MAX_RPM), 134);
  $("#tachoRed").setAttribute("d", `M${sx} ${sy} A134 134 0 0 1 ${ex} ${ey}`);
})();

// prędkość przy 9000 obr./min na każdym biegu i bazowe przyspieszenie (km/h na sekundę)
const GEAR_VMAX = [62, 98, 133, 168, 205, 248, 312];
const GEAR_ACC = [36, 35, 26, 20, 15, 11, 7.5];
const STOCK_PW = 525 / 1450;

const sim = {
  v: 0, gear: 1, rpm: 0, throttle: false, cut: 0, running: false, lastT: 0,
  runStart: null, t100: null, t200: null, best100: null, idleFor: 0, engineOn: false,
};
const ui = {
  needle: $("#tachoNeedle"), rpm: $("#rpm"), gear: $("#gear"), speed: $("#speed"),
  t100: $("#t100"), t200: $("#t200"), best: $("#best100"), lights: $$("#shiftLights i"),
  lightsWrap: $("#shiftLights"), throttle: $("#throttle"),
};
const power = $("#power"), mass = $("#mass");

function pwFactor() { return (Number(power.value) / Number(mass.value)) / STOCK_PW; }

function updateRatio() {
  $("#powerOut").textContent = `${power.value} KM`;
  $("#massOut").textContent = `${mass.value} kg`;
  $("#ratio").textContent = `${fmt(Number(mass.value) / Number(power.value), 2)} kg/KM`;
}
[power, mass].forEach((el) => el.addEventListener("input", updateRatio));
function preset(p, m) { power.value = p; mass.value = m; updateRatio(); }
$("#presetStock").addEventListener("click", () => preset(525, 1450));
$("#presetLight").addEventListener("click", () => preset(525, 1350));
$("#presetCrazy").addEventListener("click", () => preset(850, 1400));
updateRatio();

/* ----- dźwięk silnika (Web Audio) ----- */
const audio = { ctx: null, master: null, filter: null, oscs: [] };
const soundToggle = $("#soundToggle");
function initAudio() {
  if (audio.ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  const ctx = new AC();
  const master = ctx.createGain();
  master.gain.value = 0;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;
  filter.Q.value = 4;
  const shaper = ctx.createWaveShaper();
  const curve = new Float32Array(1024);
  for (let i = 0; i < 1024; i++) { const x = (i / 1023) * 2 - 1; curve[i] = Math.tanh(x * 2.5); }
  shaper.curve = curve;
  const parts = [
    { type: "sawtooth", mult: 1, gain: 0.5 },
    { type: "square", mult: 0.5, gain: 0.35 },
    { type: "sawtooth", mult: 2, gain: 0.18 },
    { type: "triangle", mult: 3, gain: 0.08 },
  ];
  parts.forEach((p) => {
    const o = ctx.createOscillator();
    o.type = p.type;
    const g = ctx.createGain();
    g.gain.value = p.gain;
    o.connect(g).connect(shaper);
    o.start();
    audio.oscs.push({ o, mult: p.mult });
  });
  shaper.connect(filter).connect(master).connect(ctx.destination);
  Object.assign(audio, { ctx, master, filter });
}
function updateAudio() {
  if (!audio.ctx) return;
  const t = audio.ctx.currentTime;
  const f = Math.max(sim.rpm, 300) / 60 * 3; // bokser 6-cyl.: 3 zapłony na obrót
  audio.oscs.forEach(({ o, mult }) => o.frequency.setTargetAtTime(f * mult * (1 + (Math.random() - 0.5) * 0.004), t, 0.015));
  audio.filter.frequency.setTargetAtTime(500 + sim.rpm * (sim.throttle ? 0.55 : 0.25), t, 0.03);
  let vol = 0;
  if (soundToggle.checked && sim.engineOn) vol = (sim.throttle ? 0.07 + (sim.rpm / REDLINE) * 0.08 : 0.04) * (sim.cut > 0 ? 0.25 : 1);
  audio.master.gain.setTargetAtTime(vol, t, 0.04);
}
soundToggle.addEventListener("change", updateAudio);

/* ----- fizyka ----- */
function computeRpm() {
  const fromSpeed = (sim.v / GEAR_VMAX[sim.gear - 1]) * REDLINE;
  let rpm = Math.max(IDLE, fromSpeed);
  if (sim.throttle && sim.gear === 1 && fromSpeed < 4200) rpm = Math.max(rpm, 4200); // start ze sprzęgłem
  return rpm;
}
function step(dt) {
  const pw = pwFactor();
  const vTop = 296 * Math.cbrt(pw);
  if (sim.cut > 0) sim.cut -= dt;

  if (sim.throttle && sim.cut <= 0) {
    let a = GEAR_ACC[sim.gear - 1] * Math.pow(pw, 0.85);
    if (sim.gear <= 2) a = Math.min(a, 43); // granica przyczepności
    a *= Math.max(0, 1 - Math.pow(sim.v / vTop, 2));
    sim.v += a * dt;
  } else if (!sim.throttle) {
    sim.v -= (2 + 0.00025 * sim.v * sim.v + 4) * dt;
  }
  sim.v = clamp(sim.v, 0, GEAR_VMAX[sim.gear - 1]);

  let rpm = computeRpm();
  if (sim.throttle && rpm >= 8900 && sim.gear < 7) {
    sim.gear++;
    sim.cut = 0.09;
    ui.lightsWrap.classList.add("flash");
    setTimeout(() => ui.lightsWrap.classList.remove("flash"), 120);
    rpm = computeRpm();
  } else if (!sim.throttle && sim.gear > 1 && rpm < 3600) {
    sim.gear--;
    rpm = computeRpm();
  }
  if (sim.throttle && rpm >= REDLINE - 20) rpm = REDLINE - Math.random() * 250; // ogranicznik
  if (sim.v <= 0.01) { sim.v = 0; sim.gear = 1; }
  sim.rpm = sim.engineOn ? rpm : 0;

  // pomiar czasu
  if (sim.runStart !== null) {
    const elapsed = (performance.now() - sim.runStart) / 1000;
    if (sim.t100 === null && sim.v >= 100) {
      sim.t100 = elapsed;
      if (sim.best100 === null || elapsed < sim.best100) sim.best100 = elapsed;
    }
    if (sim.t200 === null && sim.v >= 200) sim.t200 = elapsed;
    if (!sim.throttle) sim.runStart = null;
  }
}
function render() {
  ui.needle.style.transform = `rotate(${rpmToAngle(sim.rpm)}deg)`;
  ui.rpm.textContent = Math.round(sim.rpm / 10) * 10;
  ui.gear.textContent = !sim.engineOn ? "–" : sim.v === 0 && !sim.throttle ? "N" : sim.gear;
  ui.speed.textContent = Math.round(sim.v);
  ui.t100.textContent = sim.t100 !== null ? `${fmt(sim.t100, 2)} s` : sim.runStart ? "…" : "–";
  ui.t200.textContent = sim.t200 !== null ? `${fmt(sim.t200, 2)} s` : sim.runStart ? "…" : "–";
  ui.best.textContent = sim.best100 !== null ? `${fmt(sim.best100, 2)} s` : "–";
  const lit = clamp(Math.floor((sim.rpm - 6400) / 280), 0, 9);
  ui.lights.forEach((l, i) => {
    l.className = i < lit ? (i < 3 ? "on-g" : i < 6 ? "on-y" : "on-r") : "";
  });
}
function loop(now) {
  const dt = Math.min((now - sim.lastT) / 1000, 0.05);
  sim.lastT = now;
  step(dt);
  render();
  updateAudio();
  const resting = !sim.throttle && sim.v === 0;
  sim.idleFor = resting ? sim.idleFor + dt : 0;
  if (sim.idleFor > 4 && sim.engineOn) {
    sim.engineOn = false; // zgaś silnik po chwili postoju
    sim.rpm = 0;
    render();
    updateAudio();
  }
  if (sim.engineOn || sim.throttle || sim.v > 0) requestAnimationFrame(loop);
  else sim.running = false;
}
function setThrottle(on) {
  if (on === sim.throttle) return;
  sim.throttle = on;
  $$(".throttle").forEach((b) => b.classList.toggle("is-down", on));
  if (on) {
    initAudio();
    if (audio.ctx && audio.ctx.state === "suspended") audio.ctx.resume();
    sim.engineOn = true;
    if (sim.v < 0.5) { sim.runStart = performance.now(); sim.t100 = null; sim.t200 = null; }
    if (!sim.running) { sim.running = true; sim.lastT = performance.now(); requestAnimationFrame(loop); }
  }
}
$$(".throttle").forEach((btn) => {
  btn.addEventListener("pointerdown", (e) => { e.preventDefault(); btn.setPointerCapture(e.pointerId); setThrottle(true); });
  btn.addEventListener("pointerup", () => setThrottle(false));
  btn.addEventListener("pointercancel", () => setThrottle(false));
  btn.addEventListener("contextmenu", (e) => e.preventDefault());
  btn.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.repeat) setThrottle(true); });
  btn.addEventListener("keyup", (e) => { if (e.key === "Enter") setThrottle(false); });
});

let simInView = false;
new IntersectionObserver(([entry]) => { simInView = entry.isIntersecting; if (!simInView) setThrottle(false); }, { threshold: 0.35 }).observe($(".sim"));
const isTyping = (el) => el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
document.addEventListener("keydown", (e) => {
  if (e.code !== "Space" || isTyping(document.activeElement) && document.activeElement.type !== "range") return;
  if (!simInView || lightbox.classList.contains("is-open")) return;
  e.preventDefault();
  setThrottle(true);
});
document.addEventListener("keyup", (e) => { if (e.code === "Space") setThrottle(false); });
window.addEventListener("blur", () => setThrottle(false));
render();

/* =========================================================
   AERODYNAMIKA
   ========================================================= */
const speedAero = $("#speedAero");
const flowEl = $("#flow");
const modes = {
  normal: { flap: 0, k: 1, drag: "wysoki", text: "Pełny docisk: klapa ustawiona stromo, maksymalna przyczepność w zakrętach." },
  drs: { flap: 26, k: 0.45, drag: "niski", text: "DRS: klapa się spłaszcza, opór powietrza spada, a auto szybciej rozpędza się na prostej." },
  brake: { flap: -16, k: 1.15, drag: "bardzo wysoki", text: "Airbrake: przy mocnym hamowaniu klapa staje niemal pionowo i działa jak hamulec powietrzny." },
};
let aeroMode = "normal";
function updateAero() {
  const v = Number(speedAero.value);
  const m = modes[aeroMode];
  const df = 860 * Math.pow(v / 285, 2) * m.k;
  $("#speedAeroOut").textContent = `${v} km/h`;
  $("#downforce").textContent = Math.round(df);
  $("#drag").textContent = v === 0 ? "brak" : m.drag;
  $("#downforceBar").style.width = `${clamp(df / 1000, 0, 1) * 100}%`;
  $("#force").style.transform = `scaleY(${Math.max(0.04, df / 860)})`;
  $("#flap").style.transform = `rotate(${m.flap}deg)`;
  $("#aeroCaption").textContent = m.text;
  flowEl.style.setProperty("--flow-speed", `${v > 0 ? clamp(250 / v, 0.35, 4) : 4}s`);
  $$("path", flowEl).forEach((p) => (p.style.animationPlayState = v === 0 ? "paused" : "running"));
  $$(".segmented button").forEach((b) => b.classList.toggle("is-active", b.dataset.mode === aeroMode));
}
speedAero.addEventListener("input", updateAero);
$$(".segmented button").forEach((b) => b.addEventListener("click", () => { aeroMode = b.dataset.mode; updateAero(); }));
updateAero();

/* =========================================================
   STUDIO LAKIERU
   ========================================================= */
const paintImg = $("#paintImg");
const hue = $("#hue"), sat = $("#sat"), bri = $("#bri");
const colors = [
  { name: "Python Green", hex: "#4caf32", h: 0, s: 100, b: 100 },
  { name: "Shark Blue", hex: "#1f7fd6", h: 115, s: 115, b: 95 },
  { name: "Gentian Blue", hex: "#1c3366", h: 130, s: 90, b: 60 },
  { name: "Guards Red", hex: "#c8102e", h: -108, s: 120, b: 92 },
  { name: "Lava Orange", hex: "#ee5a1c", h: -85, s: 125, b: 105 },
  { name: "Racing Yellow", hex: "#f2c200", h: -50, s: 120, b: 118 },
  { name: "Ultrafiolet", hex: "#5b2a86", h: 165, s: 95, b: 72 },
  { name: "GT Silver", hex: "#a9adb2", h: 0, s: 0, b: 112 },
  { name: "Czarny", hex: "#1a1b1d", h: 0, s: 10, b: 45 },
];
const swatchWrap = $("#swatches");
colors.forEach((c, i) => {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "swatch";
  b.style.background = c.hex;
  b.title = c.name;
  b.setAttribute("aria-label", c.name);
  b.setAttribute("aria-pressed", "false");
  b.addEventListener("click", () => applyColor(i));
  swatchWrap.appendChild(b);
});
function updatePaint(name) {
  paintImg.style.filter = `hue-rotate(${hue.value}deg) saturate(${sat.value}%) brightness(${bri.value}%)`;
  $("#hueOut").textContent = `${hue.value}°`;
  $("#satOut").textContent = `${sat.value}%`;
  $("#briOut").textContent = `${bri.value}%`;
  $("#paintName").textContent = name || "Własny kolor";
  if (!name) $$(".swatch").forEach((s) => s.setAttribute("aria-pressed", "false"));
}
function applyColor(i) {
  const c = colors[i];
  hue.value = c.h; sat.value = c.s; bri.value = c.b;
  $$(".swatch").forEach((s, j) => s.setAttribute("aria-pressed", String(i === j)));
  updatePaint(c.name);
}
[hue, sat, bri].forEach((el) => el.addEventListener("input", () => updatePaint()));
$("#paintReset").addEventListener("click", () => applyColor(0));
applyColor(0);

/* =========================================================
   GENERACJE
   ========================================================= */
const gens = [
  { name: "996 GT3 RS", year: 2003, l: "3,6 l", km: 381, file: "Porsche_911_GT3_RS_(996)_2003_white-blue.jpg", alt: "Biało-niebieskie 996 GT3 RS", text: "Pierwsze GT3 RS: karbonowa maska, plastikowa tylna szyba i charakterystyczne napisy na bokach." },
  { name: "997 GT3 RS", year: 2006, l: "3,6 l", km: 415, file: "Porsche_997_GT3_RS_(2006)_IMG_2546.jpg", alt: "Zielone 997 GT3 RS", text: "Szersze tylne nadkola z Carrery 4 i jaskrawe kolory, które stały się znakiem rozpoznawczym." },
  { name: "997.2 GT3 RS", year: 2009, l: "3,8 l", km: 450, file: "2010_Black_and_Red_Porsche_997_GT3_RS_(IAA_2009).jpg", alt: "Czarne 997.2 GT3 RS z czerwonymi felgami", text: "Większy silnik, większe skrzydło i centralna nakrętka kół." },
  { name: "997 GT3 RS 4.0", year: 2011, l: "4,0 l", km: 500, file: "2011_Porsche_911_GT3_RS_4.0.jpg", alt: "Białe 997 GT3 RS 4.0", text: "Limitowana do 600 sztuk, z wałem korbowym z wyścigowego RSR. Dla wielu najlepsze 911 w historii." },
  { name: "991 GT3 RS", year: 2015, l: "4,0 l", km: 500, file: "2015_Porsche_911_GT3_RS.jpg", alt: "Pomarańczowe 991 GT3 RS", text: "Tylko skrzynia PDK, dach z magnezu i skrętna tylna oś." },
  { name: "991.2 GT3 RS", year: 2018, l: "4,0 l", km: 520, file: "2019_Porsche_911_GT3_RS_Weissach.jpg", alt: "991.2 GT3 RS z pakietem Weissach", text: "Nordschleife w 6:56,4 i zawieszenie wzorowane na wyścigowym RSR." },
  { name: "992 GT3 RS", year: 2022, l: "4,0 l", km: 525, file: "2024_Porsche_911_GT3_RS_992.jpg", alt: "Niebieskie 992 GT3 RS", text: "Aktywna aerodynamika z DRS, 860 kg docisku i regulacja zawieszenia pokrętłami na kierownicy." },
];
const genRange = $("#genRange");
const genImgs = [$("#genImgA"), $("#genImgB")];
let genFront = 0, genCurrent = -1, genTimer = null;

const barsWrap = $("#genBars");
const labelsWrap = $("#genLabels");
gens.forEach((g, i) => {
  const bar = document.createElement("button");
  bar.type = "button";
  bar.className = "bar";
  bar.innerHTML = `<b>${g.km}</b><i style="height:${(g.km / 525) * 100}%"></i><span>${String(g.year).slice(2)}'</span>`;
  bar.setAttribute("aria-label", `${g.name}: ${g.km} KM`);
  bar.addEventListener("click", () => { stopGenPlay(); setGen(i); });
  barsWrap.appendChild(bar);
  const lab = document.createElement("button");
  lab.type = "button";
  lab.textContent = g.year;
  lab.addEventListener("click", () => { stopGenPlay(); setGen(i); });
  labelsWrap.appendChild(lab);
});
gens.forEach((g) => { const im = new Image(); im.src = commons(g.file, 1400); }); // wstępne ładowanie

function setGen(i) {
  if (i === genCurrent) return;
  genCurrent = i;
  const g = gens[i];
  genRange.value = i;
  const back = genImgs[1 - genFront];
  back.src = commons(g.file, 1400);
  back.alt = g.alt;
  back.classList.add("is-shown");
  genImgs[genFront].classList.remove("is-shown");
  genFront = 1 - genFront;
  $("#genYear").textContent = g.year;
  $("#genName").textContent = g.name;
  $("#genTags").innerHTML = [g.year, g.l, `${g.km} KM`].map((t) => `<span class="tag tag--dark">${t}</span>`).join("");
  $("#genText").textContent = g.text;
  $$(".bar", barsWrap).forEach((b, j) => b.classList.toggle("is-active", j === i));
  $$("button", labelsWrap).forEach((b, j) => b.classList.toggle("is-active", j === i));
}
genRange.addEventListener("input", () => { stopGenPlay(); setGen(Number(genRange.value)); });
const playIcon = '<path d="M8 5l11 7-11 7z"/>';
const pauseIcon = '<path d="M8 5v14M16 5v14"/>';
function stopGenPlay() {
  clearInterval(genTimer);
  genTimer = null;
  $("#genPlayIcon").innerHTML = playIcon;
}
$("#genPlay").addEventListener("click", () => {
  if (genTimer) return stopGenPlay();
  $("#genPlayIcon").innerHTML = pauseIcon;
  setGen((genCurrent + 1) % gens.length);
  genTimer = setInterval(() => setGen((genCurrent + 1) % gens.length), 2600);
});
$("#genStage").addEventListener("click", () => {
  stopGenPlay();
  openLightbox(gens.map((g) => ({ src: commons(g.file, 2400), alt: g.alt, caption: `${g.name} (${g.year})` })), genCurrent);
});
setGen(6);

/* =========================================================
   TUNING: PORÓWNYWARKA
   ========================================================= */
const compare = $("#compare");
const compareRange = $("#compareRange");
function setCompare(pct) {
  pct = clamp(pct, 0, 100);
  compare.style.setProperty("--pos", `${pct}%`);
  compareRange.value = pct;
}
let comparing = false;
function comparePointer(e) {
  const r = compare.getBoundingClientRect();
  setCompare(((e.clientX - r.left) / r.width) * 100);
}
compare.addEventListener("pointerdown", (e) => {
  comparing = true;
  compare.setPointerCapture(e.pointerId);
  comparePointer(e);
});
compare.addEventListener("pointermove", (e) => { if (comparing) comparePointer(e); });
compare.addEventListener("pointerup", () => (comparing = false));
compare.addEventListener("pointercancel", () => (comparing = false));
compareRange.addEventListener("input", () => setCompare(Number(compareRange.value)));
// krótka podpowiedź ruchem, gdy porównywarka pojawi się na ekranie
new IntersectionObserver(([entry], obs) => {
  if (!entry.isIntersecting || reduceMotion) return;
  obs.disconnect();
  const start = performance.now();
  (function wiggle(now) {
    const t = (now - start) / 1600;
    if (t >= 1 || comparing) return;
    setCompare(50 + Math.sin(t * Math.PI * 2) * 18 * (1 - t));
    requestAnimationFrame(wiggle);
  })(start);
}, { threshold: 0.6 }).observe(compare);

/* =========================================================
   GALERIA + FILTRY
   ========================================================= */
const galleryItems = $$(".gallery__item");
const filterBtns = $$("#filters .chip");
function setFilter(f) {
  filterBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.filter === f));
  galleryItems.forEach((item) => item.classList.toggle("is-hidden", f !== "all" && item.dataset.cat !== f));
}
filterBtns.forEach((b) => b.addEventListener("click", () => setFilter(b.dataset.filter)));
$$(".tuner").forEach((t) => t.addEventListener("click", () => {
  setFilter(t.dataset.filter);
  $("#galeria").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
}));
galleryItems.forEach((item) => item.addEventListener("click", () => {
  const visible = galleryItems.filter((g) => !g.classList.contains("is-hidden"));
  const list = visible.map((g) => {
    const img = $("img", g);
    return { src: img.src.replace(/width=\d+/, "width=2400"), alt: img.alt, caption: g.dataset.caption };
  });
  openLightbox(list, visible.indexOf(item));
}));

/* =========================================================
   LIGHTBOX Z POWIĘKSZANIEM
   ========================================================= */
const lightbox = $("#lightbox");
const lbImg = $("#lbImg");
const lbViewport = $("#lbViewport");
const lbZoom = $("#lbZoom");
const lb = { list: [], index: 0, s: 1, tx: 0, ty: 0, pointers: new Map(), pinchDist: 0, pinchScale: 1, dragStart: null, lastFocus: null };

function lbApply() {
  const maxX = Math.max(0, (lbImg.offsetWidth * lb.s - lbViewport.clientWidth) / 2);
  const maxY = Math.max(0, (lbImg.offsetHeight * lb.s - lbViewport.clientHeight) / 2);
  lb.tx = clamp(lb.tx, -maxX, maxX);
  lb.ty = clamp(lb.ty, -maxY, maxY);
  lbImg.style.transform = `translate(${lb.tx}px, ${lb.ty}px) scale(${lb.s})`;
  lbZoom.value = lb.s;
  $("#lbZoomOut").textContent = `${Math.round(lb.s * 100)}%`;
}
function lbZoomTo(s, cx, cy) {
  s = clamp(s, 1, 5);
  const r = lbViewport.getBoundingClientRect();
  const px = (cx ?? r.left + r.width / 2) - (r.left + r.width / 2);
  const py = (cy ?? r.top + r.height / 2) - (r.top + r.height / 2);
  lb.tx = px - (px - lb.tx) * (s / lb.s);
  lb.ty = py - (py - lb.ty) * (s / lb.s);
  lb.s = s;
  if (s === 1) { lb.tx = 0; lb.ty = 0; }
  lbApply();
}
function lbShow(i) {
  lb.index = (i + lb.list.length) % lb.list.length;
  const item = lb.list[lb.index];
  lb.s = 1; lb.tx = 0; lb.ty = 0;
  lbImg.src = item.src;
  lbImg.alt = item.alt;
  $("#lbCaption").textContent = item.caption || item.alt;
  $("#lbCount").textContent = `${lb.index + 1} / ${lb.list.length}`;
  const multi = lb.list.length > 1;
  $("#lbPrev").hidden = !multi;
  $("#lbNext").hidden = !multi;
  lbApply();
}
function openLightbox(list, index) {
  lb.list = list;
  lb.lastFocus = document.activeElement;
  lbShow(index);
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  $("#lbClose").focus();
}
function closeLightbox() {
  if (!lightbox.classList.contains("is-open")) return;
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  lb.lastFocus && lb.lastFocus.focus();
}
$("#lbClose").addEventListener("click", closeLightbox);
$("#lbPrev").addEventListener("click", () => lbShow(lb.index - 1));
$("#lbNext").addEventListener("click", () => lbShow(lb.index + 1));
lbZoom.addEventListener("input", () => lbZoomTo(Number(lbZoom.value)));
lbImg.addEventListener("load", lbApply);
lbViewport.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbZoomTo(lb.s * Math.exp(-e.deltaY * 0.0018), e.clientX, e.clientY);
}, { passive: false });
lbViewport.addEventListener("dblclick", (e) => lbZoomTo(lb.s > 1.2 ? 1 : 2.5, e.clientX, e.clientY));

lbViewport.addEventListener("pointerdown", (e) => {
  lbViewport.setPointerCapture(e.pointerId);
  lb.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (lb.pointers.size === 2) {
    const [a, b] = [...lb.pointers.values()];
    lb.pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
    lb.pinchScale = lb.s;
  } else {
    lb.dragStart = { x: e.clientX, y: e.clientY, tx: lb.tx, ty: lb.ty, t: performance.now() };
    lbViewport.classList.add("is-dragging");
  }
});
lbViewport.addEventListener("pointermove", (e) => {
  if (!lb.pointers.has(e.pointerId)) return;
  lb.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (lb.pointers.size === 2) {
    const [a, b] = [...lb.pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    lbZoomTo(lb.pinchScale * (d / lb.pinchDist), (a.x + b.x) / 2, (a.y + b.y) / 2);
  } else if (lb.dragStart && lb.s > 1) {
    lb.tx = lb.dragStart.tx + (e.clientX - lb.dragStart.x);
    lb.ty = lb.dragStart.ty + (e.clientY - lb.dragStart.y);
    lbApply();
  }
});
function lbPointerEnd(e) {
  if (!lb.pointers.has(e.pointerId)) return;
  lb.pointers.delete(e.pointerId);
  lbViewport.classList.remove("is-dragging");
  if (lb.dragStart && lb.s === 1 && lb.pointers.size === 0) {
    const dx = e.clientX - lb.dragStart.x;
    const dy = e.clientY - lb.dragStart.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) lbShow(lb.index + (dx < 0 ? 1 : -1));
    else if (Math.abs(dx) < 5 && Math.abs(dy) < 5 && e.target === lbViewport) closeLightbox();
  }
  lb.dragStart = null;
}
lbViewport.addEventListener("pointerup", lbPointerEnd);
lbViewport.addEventListener("pointercancel", lbPointerEnd);

document.addEventListener("keydown", (e) => {
  if (lightbox.classList.contains("is-open")) {
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowRight") lbShow(lb.index + 1);
    else if (e.key === "ArrowLeft") lbShow(lb.index - 1);
    else if (e.key === "+" || e.key === "=") lbZoomTo(lb.s * 1.25);
    else if (e.key === "-") lbZoomTo(lb.s / 1.25);
    return;
  }
  if (e.key === "Escape") setMenu(false);
});
