import "@fontsource/barlow-condensed/latin-700.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-700.css";
import "./style.css";
import { kits, stops, reconstruction, switchboard } from "./dispatch.js";
import { descriptions } from "./descriptions.js";

const scene = document.querySelector("main");
const $ = (s) => document.querySelector(s);
const photo = (id) => "./photos/" + id + ".webp";
const chapters = [
  "The Spec Trap",
  "The Metro Incident",
  "The Evidence Room",
  "The Intercept",
  "The Offline Challenge",
  "The AI PC Lab",
  "Your Next Laptop",
];
const rigs = [
  ["Slate Air", "₹54,990", "14″ · 8 GB · 512 GB", "slate"],
  [
    "Acer Swift Go 14",
    "₹75,990",
    "Core Ultra 5 125H · 16 GB · 512 GB",
    "violet",
  ],
  [
    "ASUS Zenbook S 14",
    "₹1,40,990",
    "Core Ultra 5 226V · 16 GB · 1 TB",
    "polar",
  ],
];
const source =
  "https://in.store.asus.com/asus-zenbook-s-14-ux5406sa-pz555ws-oled-touchscreen-copilot-pc.html";
let state = {},
  sound = false,
  audio,
  chapter = 0,
  worker,
  cancelSearch,
  job = 0,
  cinematic;
let ids = [],
  ranked = [],
  pinned = [];
function chime() {
  if (!sound) return;
  audio ??= new AudioContext();
  audio.resume();
  const osc = audio.createOscillator(),
    gain = audio.createGain();
  osc.frequency.value = 523;
  gain.gain.setValueAtTime(0.055, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.25);
  osc.connect(gain).connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + 0.25);
}
$("#sound").onclick = () => {
  sound = !sound;
  $("#sound").textContent = sound ? "Sound on" : "Sound off";
  $("#sound").setAttribute("aria-pressed", sound);
  chime();
};
const expand = document.querySelector("#expand");
expand.hidden = !document.fullscreenEnabled;
expand.onclick = async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    expand.hidden = true;
  }
};
document.addEventListener("fullscreenchange", () => {
  expand.textContent = document.fullscreenElement
    ? "Exit fullscreen"
    : "Fullscreen";
});
function network() {
  const ready = !!navigator.serviceWorker?.controller;
  $("#network").textContent =
    (navigator.onLine ? "Online" : "Offline") +
    " / " +
    (ready ? "Offline pack ready" : "Local session");
}
window.addEventListener("online", network);
window.addEventListener("offline", network);
navigator.serviceWorker?.addEventListener("controllerchange", network);
if (import.meta.env.PROD)
  navigator.serviceWorker?.register("./sw.js").catch(() => {});
network();
function remember(n) {
  try {
    localStorage.setItem(
      "lfl-progress",
      JSON.stringify({ chapter: n, state, pinned }),
    );
  } catch {}
}
function savedProgress() {
  try {
    const value = JSON.parse(localStorage.getItem("lfl-progress"));
    return value &&
      value.chapter >= 1 &&
      value.chapter <= 7 &&
      typeof value.state?.start === "number"
      ? value
      : null;
  } catch {
    return null;
  }
}
function show(n, html) {
  cancelSearch?.();
  if (n) remember(n);
  clearTimeout(cinematic);
  chapter = n;
  job++;
  scene.innerHTML = html;
  document.body.dataset.scene = n;
  $("#stage").textContent = n
    ? "CHAPTER 0" + n + " / " + chapters[n - 1].toUpperCase()
    : "METRO INVESTIGATIONS";
  const h = scene.querySelector("h1");
  if (h) {
    h.tabIndex = -1;
    h.focus({ preventScroll: true });
  }
  window.scrollTo(0, 0);
  chime();
}
const eyebrow = (n) =>
  '<p class="eyebrow">CHAPTER 0' +
  n +
  " &nbsp; / &nbsp; " +
  chapters[n - 1].toUpperCase() +
  "</p>";
function start() {
  state = {
    start: Date.now(),
    searches: 0,
    hints: 0,
    attempts: 0,
    budget: 150000,
    pick: rigs[2][0],
    rig: 2,
    destination: Math.floor(Math.random() * 3),
    misses: 0,
    reason: "Try a real task",
  };
  pinned = [];
  ranked = [];
}
function home() {
  const resume = savedProgress();
  start();
  show(
    0,
    `<div class="cover"><p class="eyebrow"><i></i> BENGALURU &nbsp; / &nbsp; 21:47 IST</p><h1>Lost &amp;<br>Found <em>Live</em></h1><p class="intro">The last train has the guitar. The band goes on in minutes.<br>Take the dispatch laptop. Bring them together.</p><div class="actions"><button class="primary" id="play">▶ &nbsp; Play story</button><button id="judge">Judge mode</button>${resume ? '<button id="resume">Resume</button>' : ""}</div></div>`,
  );
  $("#play").onclick = () => {
    show(
      0,
      '<div class="cover cinematic"><div class="passing-train" aria-hidden="true"></div><p class="eyebrow">21:47 / LAST EASTBOUND SERVICE</p><h1>Doors closing.</h1><p class="radio-line">“Control, the musician is on stage. Her guitar is still on the metro.”</p><button id="skip">Skip introduction</button></div>',
    );
    $("#skip").onclick = shop;
    cinematic = setTimeout(shop, 4200);
  };
  $("#judge").onclick = brief;
  if (resume)
    $("#resume").onclick = () => {
      state = resume.state;
      pinned = resume.pinned ?? [];
      [
        null,
        shop,
        brief,
        () => archive(false),
        intercept,
        () => archive(true),
        lab,
        match,
      ][resume.chapter]();
    };
}
$("#home").onclick = home;
function shop() {
  show(
    1,
    eyebrow(1) +
      `<h1>Pick your field laptop.</h1><p>Your laptop comes loaded with one field tool. Choose how you’ll trace the guitar after the station loses contact. The field tools are story software. Slate Air is fictional. The Intel models use indicative Indian retail prices; all product art is illustrative.</p><div class="settings"><label>Your budget<select id="budget"><option value="60000">₹60,000</option><option value="80000">₹80,000</option><option value="120000">₹1,20,000</option><option value="150000" selected>₹1,50,000</option></select></label><label>What matters first?<select id="reason"><option>Price</option><option>Design</option><option>Portability</option><option>Performance</option></select></label></div><form class="rigs" id="shop-form">${rigs.map(([name, price, spec, c], i) => `<button type="submit" id="rig-${i}" class="rig ${c}" data-rig="${i}"><img class="product-photo" src="./rig-${i}.webp" alt="${name} fictional laptop"><strong>${name}</strong><span>${spec}</span><b>${price}</b><div class="kit-tag">${kits[i].name}</div><small>${kits[i].pitch}</small></button>`).join("")}</form>`,
  );
  $("#shop-form").onsubmit = (event) => {
    event.preventDefault();
    state.rig = Number(event.submitter.dataset.rig);
    state.pick = rigs[state.rig][0];
    state.reason = $("#reason").value;
    state.budget = Number($("#budget").value);
    brief();
  };
}
function brief() {
  state.rig ??= Math.max(
    0,
    rigs.findIndex((r) => r[0] === state.pick),
  );
  state.destination ??= 1;
  show(
    2,
    `<div class="brief">${eyebrow(2)}<h1>Two witnesses.<br>One last train.</h1><p class="mono">${state.pick} ONLINE &nbsp; / &nbsp; ${kits[state.rig].name} LOADED</p><blockquote>Musician: “Black case. Blue seats. Yellow lightning bolt.”<br>Guard: “Two cases came through. Identify hers and I’ll give you the handoff.”</blockquote><button class="primary" id="enter">Enter evidence room</button></div>`,
  );
  $("#enter").onclick = () => archive(false);
}
async function archive(offline) {
  const n = offline ? 5 : 3;
  show(
    n,
    eyebrow(n) +
      `<h1>${offline ? "The missing set list." : "Evidence room."}</h1><p>${offline ? "The band needs the encore order. Find the open notebook left with a pen on a blue seat. For offline proof, disconnect Wi-Fi once the pack is ready, then search." : "Control has two conflicting sightings. Run a clue on your dispatch laptop, then inspect the sticker before you send a runner."}</p><div id="engine-strip" class="engine-strip"><b>${state.pick}</b><span>Local search</span><span id="engine-state">Ready for a clue</span></div><form id="search"><input aria-label="Natural-language clue" maxlength="180" required placeholder="${offline ? "Describe another object from memory…" : "A black guitar case beside a blue bench…"}"><button class="primary">Search archive</button></form><div id="tools"><span id="status" role="status">Loading local image index…</span><button id="hint">${offline ? "Continue to lab" : "Request clue"}</button></div><div id="field-tool"></div><div id="pins"></div><div id="wall"></div><dialog id="inspect"></dialog>`,
  );
  const field = $("#field-tool");
  let frozen = null;
  if (!offline) {
    const rig = state.rig ?? 2;
    const commands = [
      "Load witness transmission",
      "Compare the two closest frames",
      "Freeze current results",
    ];
    field.innerHTML =
      '<button id="field-command">' +
      kits[rig].name +
      " · " +
      commands[rig] +
      '</button> <span id="field-note" role="status"></span>';
    $("#field-command").onclick = () => {
      const note = $("#field-note");
      if (rig === 0) {
        $("#search input").value =
          "black instrument case beside blue station seats";
        $("#search input").focus();
        note.textContent = "Witness clue loaded. Edit it or run the search.";
      } else if (!ranked.length || !field.dataset.searched) {
        note.textContent =
          "Run a clue first to give the field tool a live result.";
      } else if (rig === 1) {
        pinned = [ranked[1], ...pinned.filter((id) => id !== ranked[1])].slice(
          0,
          2,
        );
        pins();
        remember(3);
        inspect(ranked[0]);
      } else {
        frozen = ranked.slice(0, 3);
        note.textContent =
          "Frozen frames " +
          frozen.join(", ") +
          ". Search a different clue to compare leads.";
      }
    };
  }
  $("#hint").onclick = offline
    ? lab
    : () => {
        state.hints++;
        $("#status").textContent =
          "Two black cases share a blue bench. Look at the broad end of each case.";
      };
  try {
    if (!ids.length)
      ids = (await (await fetch("./archive.json")).json()).map((x) => x.id);
    if (chapter !== n) return;
    ranked = ids
      .slice()
      .sort((a, b) => ((Number(a) * 17) % 43) - ((Number(b) * 17) % 43));
    wall();
    $("#status").textContent =
      ids.length + " local photos · CLIP image index ready";
  } catch {
    if (chapter === n) {
      ranked = descriptions.map((_, index) =>
        String(index + 1).padStart(2, "0"),
      );
      wall();
      $("#status").textContent =
        "Image index unavailable. Inspect the photos manually or retry search.";
    }
  }
  if (chapter !== n) return;
  $("#search").onsubmit = async (e) => {
    e.preventDefault();
    const input = e.currentTarget.querySelector("input"),
      clue = input.value.trim();
    if (!clue) return;
    const ticket = ++job;
    $("#search button").disabled = true;
    $("#engine-strip").classList.add("encoding");
    $("#engine-state").textContent = "CPU · encoding clue";
    $("#status").textContent = "Opening local CLIP encoder and searching…";
    try {
      worker ??= new Worker(new URL("./search.worker.js", import.meta.url), {
        type: "module",
      });
      const result = await new Promise((resolve, reject) => {
        const w = worker;
        function cancel() {
          clearTimeout(timer);
          cancelSearch = undefined;
          w.terminate();
          worker = null;
          reject(Error("Search interrupted"));
        }
        const timer = setTimeout(cancel, 60000);
        cancelSearch = cancel;
        w.onmessage = (e) => {
          clearTimeout(timer);
          cancelSearch = undefined;
          e.data.error ? reject(Error(e.data.error)) : resolve(e.data);
        };
        w.onerror = (e) => {
          clearTimeout(timer);
          cancelSearch = undefined;
          w.terminate();
          worker = null;
          reject(Error(e.message));
        };
        w.postMessage(clue);
      });
      if (ticket !== job) return;
      ranked = result.ranked.map((x) => x.id);
      state.searches++;
      if (!offline) state.position = ranked.indexOf("01") + 1;
      state.ms = result.ms;
      $("#engine-state").textContent =
        "CPU · " + result.ms + " ms · evidence ranked";
      if (offline && !navigator.onLine) state.offline = true;
      remember(n);
      wall(true);
      field.dataset.searched = "true";
      if (frozen && !offline)
        $("#field-note").textContent =
          "First clue: " +
          frozen.join(", ") +
          " · New clue: " +
          ranked.slice(0, 3).join(", ");
      $("#status").textContent =
        (offline && !navigator.onLine ? "Offline search verified · " : "") +
        ranked.length +
        " images ranked · " +
        result.ms +
        " ms · local WebAssembly";
    } catch {
      if (ticket === job)
        $("#status").textContent =
          "Search could not run. Retry or inspect the photos manually.";
      if (ticket === job)
        $("#engine-state").textContent = "Manual inspection available";
    } finally {
      if (ticket === job) {
        $("#search button").disabled = false;
        $("#engine-strip").classList.remove("encoding");
      }
    }
  };
  function wall(animate = false) {
    const previous = new Map(
      Array.from(document.querySelectorAll(".frame"), (el) => [
        el.dataset.id,
        el.getBoundingClientRect(),
      ]),
    );
    $("#wall").classList.toggle("ranked", animate);
    $("#wall").innerHTML = ranked
      .map(
        (id, i) =>
          `<button class="frame" data-id="${id}" aria-label="Inspect frame ${id}"><img loading="${i < 8 ? "eager" : "lazy"}" src="${photo(id)}" alt="${descriptions[Number(id) - 1]}"><span>FRAME / ${id}</span></button>`,
      )
      .join("");
    if (animate && !matchMedia("(prefers-reduced-motion: reduce)").matches)
      document.querySelectorAll(".frame").forEach((el) => {
        const old = previous.get(el.dataset.id);
        if (!old) return;
        const next = el.getBoundingClientRect();
        el.animate(
          [
            {
              transform: `translate(${old.left - next.left}px,${old.top - next.top}px)`,
              opacity: 0.55,
            },
            { transform: "none", opacity: 1 },
          ],
          { duration: 420, easing: "cubic-bezier(.2,.7,.2,1)" },
        );
      });
    $("#wall")
      .querySelectorAll("button")
      .forEach((b) => (b.onclick = () => inspect(b.dataset.id)));
    pins();
  }
  function pins() {
    const box = $("#pins");
    box.innerHTML = pinned.length
      ? "Pinned frames &nbsp; " +
        pinned
          .map((id) => '<button data-pin="' + id + '">' + id + "</button>")
          .join(" ")
      : "";
    box
      .querySelectorAll("button")
      .forEach((b) => (b.onclick = () => inspect(b.dataset.pin)));
  }
  function inspect(id) {
    const d = $("#inspect"),
      other = pinned.find((p) => p !== id);
    d.innerHTML = `<div class="dialog-head"><b>FRAME / ${id}</b><button id="close">Close</button></div><div class="compare"><figure><img id="detail" src="${photo(id)}" alt="${descriptions[Number(id) - 1]}"><figcaption>Selected · ${id}</figcaption></figure>${other ? '<figure><img src="' + photo(other) + '" alt="Comparison frame ' + other + '"><figcaption>Pinned · ' + other + "</figcaption></figure>" : ""}</div><div class="actions"><button id="zoom">Zoom detail</button><button id="pin">Pin frame</button>${offline ? '<button class="primary" id="encore">Recover set list</button>' : '<button class="primary" id="confirm">Submit evidence</button>'}</div><p id="reply" role="status"></p>`;
    d.showModal();
    $("#close").onclick = () => d.close();
    $("#zoom").onclick = () => $("#detail").classList.toggle("zoom");
    $("#pin").onclick = () => {
      pinned = [id, ...pinned.filter((p) => p !== id)].slice(0, 2);
      pins();
      remember(n);
      d.close();
    };
    if (offline)
      $("#encore").onclick = () => {
        if (id !== "05") {
          $("#reply").textContent = "Check for the pen and the blue seat.";
          return;
        }
        state.encore = true;
        d.close();
        lab();
      };
    if (!offline)
      $("#confirm").onclick = () => {
        state.attempts++;
        if (id === "01") {
          pinned = [id, ...pinned.filter((p) => p !== id)].slice(0, 2);
          d.close();
          intercept();
        } else
          $("#reply").textContent =
            "The witness needs all three details. Check the case, the bench and the sticker.";
      };
  }
}
function intercept() {
  state.rig ??= 2;
  state.destination ??= 1;
  state.misses ??= 0;
  if (state.delivered) {
    reveal();
    return;
  }
  show(
    4,
    eyebrow(4) +
      "<h1>The last interchange.</h1><p>Frame 01 puts the guitar on Platform 2. The guard has already boarded. Use your " +
      kits[state.rig].name.toLowerCase() +
      ' to intercept the transfer.</p><section id="console"></section>',
  );
  function route() {
    state.signal = true;
    remember(4);
    chime();
    switchboard(
      state.destination,
      () => {
        state.delivered = true;
        reveal();
      },
      () => {
        state.misses++;
        remember(4);
      },
    );
  }
  if (state.signal) route();
  else reconstruction(state.rig, state.destination, route);
}
function reveal() {
  show(
    4,
    `<section class="reveal"><img src="${photo("01")}" alt="Black guitar case with yellow lightning sticker beside blue seats"><div>${eyebrow(4)}<p class="mono">BLR–001 / EVIDENCE CONFIRMED</p><h1>Made soundcheck.</h1><div class="route" aria-label="Evidence traced from concourse to the platform"><span>Concourse</span><span>Blue seats</span><strong>${stops[state.destination ?? 1]} gate</strong></div><blockquote>“I can hear the count-in. That’s my guitar. Thank you, control.”</blockquote><p>${state.position ? "Your last clue placed the correct frame " + state.position + " of " + ids.length + ". " : ""}${kits[state.rig ?? 2].name} handoff · ${state.misses ?? 0} missed runs · ${state.attempts} submission(s) · ${state.searches} searches · ${state.hints} clues · ${Math.round((Date.now() - state.start) / 1000)}s elapsed</p><button class="primary" id="next">Take the encore case</button></div></section>`,
  );
  $("#next").onclick = () => archive(true);
}
async function lab() {
  show(
    6,
    eyebrow(6) +
      `<h1>Inside the dispatch laptop.</h1><div id="silicon"></div><div class="lab"><section><h2>On this browser</h2><p>CLIP matches your words against image vectors prepared from the actual photographs. New clues run locally on the CPU through WebAssembly.</p><strong>${state.ms === undefined ? "No completed search" : state.ms + " ms · last text query"}</strong><p>${state.offline ? "Offline search verified this session." : "Offline proof requires a successful search while disconnected."}</p></section><section><h2>Photo indexing</h2><p id="cpu-observation"></p><p id="native-report">NPU benchmark unavailable on this device.</p><p>A valid comparison times the same photo set and vision encoder on CPU and NPU on one supported Intel PC. Browser query latency measures a different task.</p></section></div><button id="next" class="primary">Match my laptop</button>`,
  );
  $("#next").onclick = match;
  const stations = [
    [
      "CPU",
      "Find the frame",
      "Your typed clue was encoded here using local WebAssembly.",
    ],
    [
      "Graphics",
      "Draw the evidence wall",
      "The browser composites the moving photographs. The exact graphics backend depends on the browser.",
    ],
    [
      "Intel NPU",
      "Index a new shift",
      "Compatible Intel Core Ultra PCs can run supported models through OpenVINO on their NPU. A measured native run appears below when supplied.",
    ],
  ];
  const chip = $("#silicon");
  chip.innerHTML =
    '<div class="chip-bank">' +
    stations
      .map(
        ([name, task], i) =>
          '<button data-chip="' +
          i +
          '" aria-pressed="false"><b>' +
          name +
          "</b><small>" +
          task +
          "</small></button>",
      )
      .join("") +
    '</div><p id="chip-detail" role="status"></p>';
  const chips = [...chip.querySelectorAll("button")];
  chips.forEach(
    (b, i) =>
      (b.onclick = () => {
        chips.forEach((other, j) =>
          other.setAttribute("aria-pressed", String(i === j)),
        );
        $("#chip-detail").textContent =
          i === 0 && !state.searches
            ? "Search was completed manually this run. Local search uses the CPU through WebAssembly."
            : stations[i][2];
      }),
  );
  chips[0].click();

  try {
    const observation = await (await fetch("./lab.json")).json();
    const output = document.querySelector("#cpu-observation");
    if (output)
      output.textContent =
        "Recorded on the build machine: " +
        observation.count +
        " photos in " +
        observation.seconds +
        " s using " +
        observation.cpu +
        ". Includes decoding, preprocessing and image inference. " +
        observation.backend +
        ".";
    const native = await (await fetch("./openvino.json")).json();
    const report = document.querySelector("#native-report");
    const rows = ["CPU", "NPU"].map((key) => native.devices?.[key]);
    if (
      report &&
      native.photos === ids.length &&
      rows.every(
        (row) =>
          typeof row?.name === "string" &&
          row.seconds_per_batch?.length === 3 &&
          row.seconds_per_batch.every((t) => Number.isFinite(t) && t > 0),
      )
    ) {
      report.textContent =
        "Recorded OpenVINO test on one machine · median of three warmed batches: " +
        rows
          .map(
            (row) =>
              row.name +
              " " +
              [...row.seconds_per_batch].sort((a, b) => a - b)[1] +
              " s",
          )
          .join(" / ");
    }
  } catch {
    /* The shopping path also works without a lab report. */
  }
}
function match() {
  show(
    7,
    eyebrow(7) +
      `<h1>Your next laptop.</h1><p>You opened with <b>${state.pick}</b> · ${state.reason}. Your ${kits[state.rig ?? 2].name.toLowerCase()} guided the handoff. Which archive would you search at home?</p><div class="settings"><label>My archive<select id="use"><option>Study notes</option><option>Creative references</option><option>Travel photos</option></select></label><label>My budget<select id="budget"><option value="60000">₹60,000</option><option value="80000">₹80,000</option><option value="120000">₹1,20,000</option><option value="150000">₹1,50,000</option></select></label></div><div id="card"></div><label>Would you reconsider?<select id="decision"><option>I'd compare both options</option><option>I'd like to try an AI PC</option><option>I'd keep my original choice</option></select></label><button class="primary" id="finish">Finish investigation</button>`,
  );
  $("#budget").value = state.budget;
  function update() {
    const budget = Number($("#budget").value);
    const use = $("#use").value;
    const premium =
      (use === "Creative references" ||
        (state.rig === 2 && state.reason === "Performance")) &&
      budget >= 140990;
    const laptop = premium ? "ASUS Zenbook S 14" : "Acer Swift Go 14";
    const sku = premium
      ? "UX5406SA-PZ555WS · Core Ultra 5 226V · 16 GB / 1 TB"
      : "NX.KSMSI.002 · Core Ultra 5 125H · 16 GB / 512 GB";
    const price = premium ? 140990 : 75990;
    const url = premium
      ? source
      : "https://www.vijaysales.com/p/238242/acer-swift-go-14-laptop-intel-core-ultra-5-125h-16gb-lpddr5x-ram-512gb-ssd-14-inch-35-56-cm-touchscreen-display-intel-arc-graphics-bluetooth-5-3-finger-print-reader-windows-11-nx-ksmsi-002";
    const reason = premium
      ? "The 1 TB SSD gives your creative reference library more room."
      : "The lower-priced catalogue option leaves more of your budget for other needs.";
    $("#card").innerHTML =
      `<h2>${budget >= price ? laptop : "Ask for an in-budget comparison"}</h2><p>${budget >= price ? sku + " · Intel AI Boost" : "Our least expensive verified option costs more than your selected budget."}</p><p>${budget >= price ? reason : ""} Ask staff to try the same local search on a folder of ${use.toLowerCase()} on this model and a similarly priced rival.</p><small>Indicative ₹${price.toLocaleString("en-IN")} · checked 25 Nov 2026 · <a href="${url}" target="_blank" rel="noopener">${premium ? "ASUS India" : "Vijay Sales"} listing</a></small>`;
  }
  $("#budget").onchange = update;
  $("#use").onchange = update;
  update();
  $("#finish").onclick = () => {
    const choice = $("#decision").value;
    try {
      localStorage.setItem(
        "lfl-choice",
        JSON.stringify({ choice, initial: state.pick }),
      );
    } catch {}
    show(
      7,
      '<p class="eyebrow">CASE CLOSED / BLR–001</p><h1>End of shift.</h1><p>' +
        (state.encore ? "Encore recovered · " : "") +
        (state.misses === 0 ? "Clean handoff" : "Case delivered") +
        "</p><p>" +
        choice +
        '</p><button class="primary" id="again">Replay story</button>',
    );
    try {
      localStorage.removeItem("lfl-progress");
    } catch {}
    $("#again").onclick = home;
  };
}
home();
