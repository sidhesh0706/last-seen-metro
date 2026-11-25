// Field software belongs to the selected story kit. These are authored puzzles.
export const kits = [
  {
    name: "Radio desk",
    action: "Tune the guard’s receiver",
    pitch: "Recover the handoff from a broken radio transmission.",
  },
  {
    name: "Frame sync",
    action: "Align two camera feeds",
    pitch: "Synchronize the departure camera with the guard’s log.",
  },
  {
    name: "Event recorder",
    action: "Rewind the departure log",
    pitch: "Scrub the train recorder to find the last signed handoff.",
  },
];
export const stops = ["Market", "Theatre", "Depot"];
const channels = [
  "Static",
  "Maintenance crew",
  "Westbound guard",
  "Coffee kiosk",
  "Eastbound guard",
  "Static",
];
export function reconstruction(rig, destination, onSolved) {
  const kit = kits[rig];
  const target = [4, 2, 3][rig];
  const instructions = [
    "Station control assigned this handoff to the eastbound guard. Tune the receiver and lock their transmission.",
    "Camera B runs two beats behind camera A. Shift its timecode until the departure flashes line up.",
    "Find the signed transfer between doors opening and departure. Scrub the recorder and pin that event.",
  ][rig];
  const labels = ["Radio channel", "Camera B offset", "Recorded event"];
  const log = [
    "Standby",
    "Approach",
    "Doors open",
    "Transfer signed",
    "Doors shut",
    "Departure",
  ];
  const panel = document.querySelector("#console");
  panel.innerHTML = `<div class="instrument"><p class="mono">FIELD SOFTWARE / ${kit.name.toUpperCase()}</p><h2>${kit.action}</h2><p>${instructions}</p><div id="scope" class="scope" aria-hidden="true"></div><label>${labels[rig]}<input id="dial" type="range" min="0" max="5" value="0"></label><output id="reading" for="dial"></output><div class="actions"><button id="lock" class="primary">Lock signal</button></div><p id="signal-feedback" role="status"></p></div>`;
  const dial = panel.querySelector("#dial"),
    scope = panel.querySelector("#scope");
  function read() {
    const value = Number(dial.value);
    const display = [
      channels[value],
      `A · 21:49:12   /   B · 21:49:${10 + value}`,
      log[value],
    ][rig];
    panel.querySelector("#reading").textContent = display;
    scope.style.setProperty("--offset", Math.abs(target - value) * 9 + "px");
    scope.dataset.mode = rig;
    scope.replaceChildren(
      ...Array.from({ length: 48 }, (_, i) => {
        const bar = document.createElement("i");
        bar.style.height =
          12 + Math.abs(Math.sin(i * (value + 1) * 0.38)) * 48 + "px";
        return bar;
      }),
    );
  }
  dial.oninput = read;
  read();
  panel.querySelector("#lock").onclick = () => {
    if (Number(dial.value) !== target) {
      panel.querySelector("#signal-feedback").textContent = [
        "Wrong channel. Listen for the eastbound guard.",
        "The timecodes still disagree.",
        "The log needs a signed transfer.",
      ][rig];
      return;
    }
    onSolved(destination);
  };
}
export function switchboard(destination, onFinish, onMiss) {
  const panel = document.querySelector("#console");
  panel.innerHTML = `<div class="instrument"><p class="mono">LIVE DISPATCH / EASTBOUND</p><h2>Guide the station runner.</h2><blockquote>Guard: “Meet me at <strong>${stops[destination]} gate</strong>. I have the case.”</blockquote><p>Set the junction, then launch the runner. Signal the handoff while the runner is inside the marked platform zone.</p><div class="junction" role="group" aria-label="Runner destination">${stops.map((s, i) => `<button data-stop="${i}" aria-pressed="false">${s}</button>`).join("")}</div><div class="track" aria-label="Runner position"><span class="zone"></span><i id="runner"></i></div><div class="actions"><button class="primary" id="launch" disabled>Launch runner</button><label><input id="step-mode" type="checkbox"> Step controls</label></div><p id="dispatch-feedback" role="status">Select a gate.</p></div>`;
  let selected = -1,
    playing = false,
    position = 0,
    started = 0,
    raf = 0;
  const runner = panel.querySelector("#runner"),
    action = panel.querySelector("#launch"),
    feedback = panel.querySelector("#dispatch-feedback"),
    step = panel.querySelector("#step-mode");
  const buttons = [...panel.querySelectorAll("[data-stop]")];
  step.checked = matchMedia("(prefers-reduced-motion: reduce)").matches;
  buttons.forEach(
    (b, i) =>
      (b.onclick = () => {
        selected = i;
        buttons.forEach((el, j) =>
          el.setAttribute("aria-pressed", String(i === j)),
        );
        action.disabled = false;
        feedback.textContent = "Route set for " + stops[i] + " gate.";
      }),
  );
  function paint() {
    runner.style.left = position + "%";
    runner.setAttribute("aria-label", Math.round(position) + " percent");
  }
  function reset(message) {
    cancelAnimationFrame(raf);
    playing = false;
    position = 0;
    paint();
    onMiss();
    feedback.textContent = message;
    action.textContent = "Retry run";
    buttons.forEach((b) => (b.disabled = false));
    step.disabled = false;
  }
  function tick(now) {
    if (!panel.isConnected || !playing) return;
    position = Math.min(100, (now - started) / 60);
    paint();
    if (position >= 100)
      reset(
        "The runner passed the gate. Launch another run or use step controls.",
      );
    else raf = requestAnimationFrame(tick);
  }
  action.onclick = () => {
    if (!playing) {
      playing = true;
      started = performance.now();
      position = 0;
      paint();
      step.disabled = true;
      buttons.forEach((b) => (b.disabled = true));
      action.textContent = step.checked ? "Advance runner" : "Signal handoff";
      feedback.textContent = "Wait for the striped handoff zone.";
      if (!step.checked) raf = requestAnimationFrame(tick);
      return;
    }
    if (step.checked && position < 75) {
      position += 25;
      paint();
      feedback.textContent =
        position === 75
          ? "Runner in the handoff zone."
          : "Runner at " + position + "%.";
      if (position === 75) action.textContent = "Signal handoff";
      return;
    }
    if (selected !== destination) {
      reset(
        "The guard is at " + stops[destination] + " gate. Change the junction.",
      );
      return;
    }
    if (position < 66 || position > 91) {
      reset("Signal missed. Aim for the striped zone or use step controls.");
      return;
    }
    playing = false;
    cancelAnimationFrame(raf);
    onFinish();
  };
}
