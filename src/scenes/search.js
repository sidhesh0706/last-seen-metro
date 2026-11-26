const initial = [
  "03",
  "05",
  "06",
  "08",
  "09",
  "11",
  "14",
  "22",
  "24",
  "26",
  "27",
  "40",
];
export function search({ stage, session, go, beep }) {
  let worker,
    alive = true,
    busy = false,
    timer;
  const rewarded = new Set();
  stage.innerHTML = `<p class="eyeline">HEAT 03 / LIVE LOCAL AI</p><h1>Archive sprint.</h1><p>Find a frame for your ${session.role.name.toLowerCase()} project. Type what you remember. The text encoder runs on this device’s CPU through WebAssembly.</p><form><input aria-label="Search the metro archive" maxlength="180" required><button class="primary">Run local search</button></form><p id="status" role="status">42 photos indexed · CLIP ViT-B/32</p><div class="gallery"></div><button id="finish" hidden>See my laptop</button>`;
  const input = stage.querySelector("input"),
    form = stage.querySelector("form"),
    status = stage.querySelector("#status"),
    finish = stage.querySelector("#finish");
  input.value = session.role.clue;
  function display(ids, ranked = false) {
    stage.querySelector(".gallery").innerHTML = ids
      .map(
        (id, i) =>
          `<figure class="${ranked && i < 3 ? "top" : ""}"><img src="./photos/${id}.webp" alt="Metro archive frame ${id}"><figcaption>${ranked && i < 3 ? "#" + (i + 1) + " MATCH" : "FRAME " + id}</figcaption></figure>`,
      )
      .join("");
  }
  display(initial);
  finish.onclick = () => go(5);
  function fail() {
    clearTimeout(timer);
    worker?.terminate();
    worker = null;
    busy = false;
    form.querySelector("button").disabled = false;
    finish.hidden = false;
    status.textContent =
      "Local inference unavailable. Retry or continue to your recommendation.";
  }
  form.onsubmit = (e) => {
    e.preventDefault();
    const clue = input.value.trim();
    if (!clue || busy) return;
    busy = true;
    form.querySelector("button").disabled = true;
    status.textContent = "Loading local encoder and ranking the archive…";
    try {
      worker ??= new Worker(new URL("../worker.js", import.meta.url), {
        type: "module",
      });
      worker.onerror = fail;
      timer = setTimeout(fail, 60000);
      worker.onmessage = ({ data }) => {
        if (!alive) return;
        clearTimeout(timer);
        if (data.error) {
          fail();
          return;
        }
        display(
          data.ranked.slice(0, 12).map((r) => r.id),
          true,
        );
        const key = clue.toLowerCase();
        const fresh = !rewarded.has(key);
        if (fresh) {
          session.score += 50;
          rewarded.add(key);
        }
        status.textContent = `Ranked 42 photos in ${data.ms} ms · local WASM · ${navigator.onLine ? "online connection" : "offline connection"}${fresh ? " · +50 points" : ""}`;
        finish.hidden = false;
        busy = false;
        form.querySelector("button").disabled = false;
        beep(700);
      };
      worker.postMessage(clue);
    } catch {
      fail();
    }
  };
  return () => {
    alive = false;
    clearTimeout(timer);
    worker?.terminate();
  };
}
