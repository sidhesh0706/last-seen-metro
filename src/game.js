import { attract } from "./scenes/title.js";
import { race } from "./scenes/race.js";
import { runner } from "./scenes/runner.js";
import { search } from "./scenes/search.js";
import { finish } from "./scenes/end.js";
export const roles = [
  {
    name: "Creator",
    verb: "Cut the launch film",
    task: "Render preview",
    ai: "Isolate the subject",
    clue: "colourful flowers at a market",
    color: "#bc9aff",
  },
  {
    name: "Gamer",
    verb: "Stream the finals",
    task: "Draw the next frame",
    ai: "Suppress mic noise",
    clue: "headphones resting on a bench",
    color: "#74edb6",
  },
  {
    name: "Student",
    verb: "Deliver the presentation",
    task: "Render slide graphics",
    ai: "Transcribe the lecture",
    clue: "an open notebook with a pen",
    color: "#ffd740",
  },
  {
    name: "Hustler",
    verb: "Go live with a pitch",
    task: "Composite the reel",
    ai: "Caption the interview",
    clue: "a tablet on a desk",
    color: "#69d4ff",
  },
];
export function boot() {
  const stage = document.querySelector("#stage");
  let stop = () => {},
    sound = false,
    ctx,
    session;
  function beep(freq = 480) {
    if (!sound) return;
    ctx ??= new AudioContext();
    ctx.resume();
    const osc = ctx.createOscillator(),
      gain = ctx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.045, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }
  document.querySelector("#sound").onclick = (e) => {
    sound = !sound;
    e.currentTarget.textContent = sound ? "Sound on" : "Sound off";
    beep();
  };
  function net() {
    document.querySelector("#offline").textContent =
      (navigator.onLine ? "Online" : "Offline") +
      (navigator.serviceWorker?.controller
        ? " · Offline pack ready"
        : " · Local session");
  }
  for (const event of ["online", "offline"])
    window.addEventListener(event, net);
  navigator.serviceWorker?.addEventListener("controllerchange", net);
  net();
  if (import.meta.env.PROD)
    navigator.serviceWorker?.register("./sw.js").catch(() => {});
  function go(n) {
    stop();
    stop = () => {};
    stage.replaceChildren();
    document.body.dataset.phase = n;
    window.scrollTo(0, 0);
    document.querySelector("#phase").textContent = [
      "Starting grid",
      "Choose a pilot",
      "01 / Engine relay",
      "02 / Night run",
      "03 / Archive sprint",
      "Finish line",
    ][n];
    const game = { stage, session, beep, go };
    if (n === 0) {
      session = { score: 0, boost: false, role: roles[0] };
      stop = attract({ ...game, session });
    }
    if (n === 1) {
      stage.innerHTML =
        '<p class="eyeline">PILOT SELECT</p><h1>Who’s racing?</h1><p>Your work sets the relay jobs and your final archive mission.</p><div class="roles">' +
        roles
          .map(
            (r, i) =>
              `<button data-role="${i}" style="--accent:${r.color}"><b>${r.name}</b><span>${r.verb}</span></button>`,
          )
          .join("") +
        "</div>";
      stage.querySelectorAll("[data-role]").forEach(
        (b) =>
          (b.onclick = () => {
            session.role = roles[b.dataset.role];
            beep();
            go(2);
          }),
      );
    }
    if (n === 2) stop = race(game);
    if (n === 3) stop = runner(game);
    if (n === 4) stop = search(game);
    if (n === 5) finish(game);
    const heading = stage.querySelector("h1");
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }
  go(0);
}
