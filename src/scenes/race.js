export function race({ stage, session, go, beep }) {
  const role = session.role;
  const jobs = [
    { task: "Open the project", engine: "CPU" },
    { task: role.task, engine: "GPU" },
    { task: role.ai, engine: "NPU" },
  ];
  stage.innerHTML = `<p class="eyeline">HEAT 01 / ${role.name.toUpperCase()}</p><h1>Engine relay.</h1><p>Race the ghost by sending each job to its specialist. CPU runs project logic, GPU draws frames, NPU runs supported AI models.</p><div class="duel"><label>INTEL · YOU<progress id="you" max="3" value="0"></progress></label><label>SNAPDRAGON · GHOST<progress id="ghost" max="3" value="0"></progress></label></div><section class="console"><small>JOB QUEUE</small><h2 id="job">Ready on the grid?</h2><div id="keys"><button class="primary" id="race-start">Start heat</button></div><p role="status" id="feedback">Arcade opponent pace. Hardware performance is covered separately.</p></section>`;
  let index = 0,
    start,
    frame,
    done = false;
  const ghost = stage.querySelector("#ghost"),
    job = stage.querySelector("#job"),
    keys = stage.querySelector("#keys"),
    feedback = stage.querySelector("#feedback");
  function end(win) {
    done = true;
    stage.querySelector(".console").classList.toggle("win", win);
    cancelAnimationFrame(frame);
    session.boost = win;
    if (win) session.score += 100;
    job.textContent = win
      ? "Relay won. Boost charged."
      : "Ghost takes the heat.";
    feedback.textContent = win
      ? "+100 points · one shield for the night run."
      : "You can make up points on the rails.";
    keys.innerHTML =
      '<button class="primary" id="drive">Enter night run</button>';
    keys.firstChild.onclick = () => go(3);
    beep(win ? 790 : 240);
  }
  function tick(now) {
    ghost.value = Math.min(3, (now - start) / 4300);
    if (ghost.value >= 3) {
      end(false);
      return;
    }
    frame = requestAnimationFrame(tick);
  }
  stage.querySelector("#race-start").onclick = () => {
    start = performance.now();
    frame = requestAnimationFrame(tick);
    job.textContent = jobs[0].task;
    keys.innerHTML = ["CPU", "GPU", "NPU"]
      .map((s) => '<button data-engine="' + s + '">' + s + "</button>")
      .join("");
    keys.querySelectorAll("button").forEach(
      (b) =>
        (b.onclick = () => {
          if (done) return;
          if (b.dataset.engine !== jobs[index].engine) {
            feedback.textContent =
              "Wrong lane. Try the " + jobs[index].engine + " for this job.";
            beep(190);
            return;
          }
          index++;
          stage.querySelector("#you").value = index;
          beep();
          if (index === 3) {
            end(performance.now() - start < 12900);
            return;
          }
          job.textContent = jobs[index].task;
          feedback.textContent = "Packet delivered. Route the next job.";
        }),
    );
  };
  return () => cancelAnimationFrame(frame);
}
