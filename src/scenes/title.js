export function attract({ stage, go }) {
  stage.innerHTML =
    '<section class="cover"><p class="eyeline">BENGALURU / AFTER HOURS / 2027</p><h1>AI <em>Wars.</em></h1><h2>Who wins the night circuit?</h2><p>Route the jobs. Run the rails. Bring your own clue to the finish.</p><button class="primary" id="start">Enter the arena ▸</button></section><div class="matchup"><span>Snapdragon X Elite <b>45 NPU TOPS</b></span><span>Intel Core Ultra 5 226V <b>40 NPU TOPS</b></span></div>';
  let alive = true,
    frame = 0,
    world;
  import("./graphics.js")
    .then(({ makeWorld }) => {
      if (!alive) return;
      world = makeWorld("title");
      if (world) {
        const draw = (t) => {
          world.draw(t / 1000);
          frame = requestAnimationFrame(draw);
        };
        frame = requestAnimationFrame(draw);
      }
    })
    .catch(() => {});
  const advance = () => go(1);
  stage.onclick = advance;
  const timer = setTimeout(advance, 10000);
  return () => {
    alive = false;
    stage.onclick = null;
    clearTimeout(timer);
    cancelAnimationFrame(frame);
    world?.dispose();
  };
}
