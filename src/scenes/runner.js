export function runner({ stage, session, beep, go }) {
  stage.innerHTML = `<div class="racehud"><div><p class="eyeline">HEAT 02 / ${session.role.name.toUpperCase()}</p><h1>Night run.</h1></div><output id="hud"></output></div><div id="flat" aria-hidden="true"></div><div class="controls"><p id="report" role="status">Dodge red barriers. Collect green diamonds. Use ← →, A/D or swipe.</p><button class="primary" id="run">Launch laptop</button><button id="left" aria-label="Move left">◀</button><button id="right" aria-label="Move right">▶</button><button id="pause" hidden>Pause</button></div>`;
  let alive = true,
    world,
    frame,
    clock = 0,
    last = 0,
    lane = 0,
    visual = 0,
    lives = 3,
    combo = 0,
    next = 0.15,
    started = false,
    paused = false,
    shield = session.boost,
    boostUntil = 0,
    objects = [],
    wave = 0,
    distance = 0,
    extraTime = 0,
    bonus = 0;
  const flat = stage.querySelector("#flat"),
    hud = stage.querySelector("#hud"),
    message = stage.querySelector("#report"),
    pause = stage.querySelector("#pause");
  import("./graphics.js")
    .then(({ makeWorld }) => {
      if (!alive) return;
      world = makeWorld("run");
      if (world) flat.hidden = true;
    })
    .catch(() => {});
  function move(delta) {
    if (started && !paused) lane = Math.max(-1, Math.min(1, lane + delta));
  }
  const key = (e) => {
    if (["ArrowLeft", "ArrowRight", "a", "d", "A", "D"].includes(e.key)) {
      e.preventDefault();
      move(["ArrowLeft", "a", "A"].includes(e.key) ? -1 : 1);
    }
  };
  let touch;
  const down = (e) => {
    touch = e.changedTouches[0].clientX;
  };
  const up = (e) => {
    const d = e.changedTouches[0].clientX - touch;
    if (Math.abs(d) > 22) move(Math.sign(d));
  };
  window.addEventListener("keydown", key);
  stage.addEventListener("touchstart", down, { passive: true });
  stage.addEventListener("touchend", up, { passive: true });
  stage.querySelector("#left").onclick = () => move(-1);
  stage.querySelector("#right").onclick = () => move(1);
  function toggle(value) {
    paused = value;
    pause.textContent = paused ? "Resume" : "Pause";
    last = 0;
  }
  pause.onclick = () => toggle(!paused);
  const visibility = () => {
    if (document.hidden && started) toggle(true);
  };
  document.addEventListener("visibilitychange", visibility);
  stage.querySelector("#run").onclick = (e) => {
    e.currentTarget.hidden = true;
    pause.hidden = false;
    started = true;
    message.textContent = "Follow the green diamonds.";
  };
  function result() {
    started = false;
    cancelAnimationFrame(frame);
    session.distance = Math.floor(distance);
    session.runPoints = bonus;
    session.score += bonus;
    hud.textContent = lives ? "Finish line" : "Out of lives";
    message.textContent = `${session.distance} m · +${bonus} points. Your final task runs real AI on this device.`;
    pause.hidden = true;
    const b = stage.querySelector("#run");
    b.hidden = false;
    b.textContent = "Enter archive sprint";
    b.onclick = () => go(4);
  }
  function render(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.12) : 0;
    last = now;
    if (started && !paused) {
      clock += dt;
      distance += dt * (clock < boostUntil ? 20 : 10);
      if (clock >= next) {
        const obstacle = Math.floor(Math.random() * 3) - 1;
        const safe = ((obstacle + 2 + Math.floor(Math.random() * 2)) % 3) - 1;
        objects.push(
          { lane: obstacle, type: "block", progress: 0, resolved: false },
          {
            lane: safe,
            type: "orb",
            effect: wave % 3,
            progress: 0,
            resolved: false,
          },
        );
        next = clock + 1.6;
        wave++;
      }
      visual += (lane - visual) * Math.min(1, dt * 15);
      for (const o of objects) {
        o.progress += dt * (clock < boostUntil ? 0.55 : 0.39);
        if (o.progress >= 1 && !o.resolved) {
          o.resolved = true;
          const hit = Math.abs(visual - o.lane) < 0.55;
          if (o.type === "block") {
            if (hit) {
              combo = 0;
              if (shield) {
                shield = false;
                message.textContent = "Shield absorbed the barrier.";
              } else {
                lives--;
                message.textContent = "Barrier hit. Change lanes earlier.";
              }
              beep(150);
            } else {
              combo++;
              bonus += combo >= 2 ? 15 : 10;
            }
          } else if (hit) {
            bonus += 25;
            beep(740);
            if (o.effect === 0) {
              shield = true;
              message.textContent = "AI guard · next barrier absorbed.";
            } else if (o.effect === 1 && extraTime === 0) {
              extraTime = 10;
              message.textContent = "Battery pickup · 10 bonus seconds.";
            } else {
              boostUntil = clock + 5;
              message.textContent = "Circuit boost · 5 seconds.";
            }
          }
        }
      }
      objects = objects.filter((o) => o.progress < 1.13);
      if (lives <= 0 || clock >= 60 + extraTime) {
        result();
        return;
      }
    }
    hud.textContent = `${Math.max(0, Math.ceil(60 + extraTime - clock))}s · ${lives} lives · ${session.score + bonus} pts${shield ? " · Shield" : ""}`;
    if (world) world.draw(clock, visual, objects, Math.sin(clock * 0.55) * 2);
    else
      flat.innerHTML =
        objects
          .map(
            (o) =>
              `<i class="${o.type}" style="left:${50 + o.lane * 25}%;top:${o.progress * 81}%"></i>`,
          )
          .join("") + `<b style="left:${50 + visual * 25}%">PC</b>`;
    frame = requestAnimationFrame(render);
  }
  frame = requestAnimationFrame(render);
  return () => {
    alive = false;
    cancelAnimationFrame(frame);
    world?.dispose();
    window.removeEventListener("keydown", key);
    stage.removeEventListener("touchstart", down);
    stage.removeEventListener("touchend", up);
    document.removeEventListener("visibilitychange", visibility);
  };
}
