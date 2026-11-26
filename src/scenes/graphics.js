import * as T from "three";
const cyan = 0x56ecff;
function box(w, h, d, color) {
  return new T.Mesh(
    new T.BoxGeometry(w, h, d),
    new T.MeshBasicMaterial({ color }),
  );
}
function panelTexture(label, accent) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 288;
  const painter = canvas.getContext("2d");
  painter.fillStyle = "#06121e";
  painter.fillRect(0, 0, 512, 288);
  painter.strokeStyle = "#1e3e50";
  for (let x = 0; x < 512; x += 24) {
    painter.beginPath();
    painter.moveTo(x, 0);
    painter.lineTo(x, 288);
    painter.stroke();
  }
  for (let y = 0; y < 288; y += 24) {
    painter.beginPath();
    painter.moveTo(0, y);
    painter.lineTo(512, y);
    painter.stroke();
  }
  painter.fillStyle = accent;
  painter.fillRect(22, 28, 64, 5);
  painter.font = "bold 22px monospace";
  painter.fillText("NIGHT CIRCUIT  //  2027", 22, 67);
  painter.fillStyle = "white";
  painter.font = "bold 54px sans-serif";
  painter.fillText(label, 20, 160);
  painter.strokeStyle = accent;
  painter.lineWidth = 5;
  painter.beginPath();
  for (let x = 20; x < 492; x += 4)
    painter.lineTo(
      x,
      232 - Math.abs(Math.sin(x * 0.043) * Math.cos(x * 0.029)) * 36,
    );
  painter.stroke();
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  return texture;
}
function laptop(color, label) {
  const group = new T.Group(),
    base = box(1.8, 0.09, 1.12, 0x869db0),
    lid = box(1.76, 1.05, 0.08, 0x253c52);
  lid.position.set(0, 0.54, -0.46);
  lid.rotation.x = -0.13;
  group.add(base, lid);
  const screen = new T.Mesh(
    new T.PlaneGeometry(1.61, 0.89),
    new T.MeshBasicMaterial({
      map: panelTexture(label, "#" + color.toString(16).padStart(6, "0")),
    }),
  );
  screen.position.z = 0.055;
  lid.add(screen);
  for (let i = 0; i < 4; i++) {
    const row = box(1.43, 0.012, 0.077, 0x20344b);
    row.position.set(0, 0.051, -0.23 + i * 0.13);
    group.add(row);
  }
  return group;
}
export function makeWorld(mode) {
  const host = document.querySelector("#world");
  let renderer;
  try {
    renderer = new T.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
  } catch {
    return null;
  }
  host.replaceChildren(renderer.domElement);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  const scene = new T.Scene(),
    camera = new T.PerspectiveCamera(50, 1, 0.1, 130);
  scene.fog = new T.FogExp2(0x061122, 0.021);
  const grid = new T.GridHelper(
    mode === "run" ? 130 : 9,
    mode === "run" ? 65 : 16,
    0x256483,
    0x164357,
  );
  scene.add(grid);
  const player = laptop(0x087eff, "CORE ULTRA"),
    ghost = laptop(0xfb546b, "X ELITE");
  scene.add(player, ghost);
  const track = mode === "run";
  if (track) {
    const road = box(7.5, 0.14, 110, 0x081420);
    road.position.set(0, -0.09, -43);
    scene.add(road);
    const facade = document.createElement("canvas");
    facade.width = 64;
    facade.height = 128;
    const paint = facade.getContext("2d");
    paint.fillStyle = "#172e43";
    paint.fillRect(0, 0, 64, 128);
    for (let row = 0; row < 16; row++)
      for (let col = 0; col < 6; col++) {
        paint.fillStyle =
          (row * 7 + col * 3) % 5 === 0
            ? "#88e1ec"
            : (row + col) % 4 === 0
              ? "#cba36a"
              : "#26455b";
        paint.fillRect(col * 10 + 3, row * 8 + 2, 5, 3);
      }
    const windows = new T.CanvasTexture(facade);
    windows.colorSpace = T.SRGBColorSpace;
    camera.position.set(0, 4.6, 8.2);
    camera.lookAt(0, 0.1, -9);
    ghost.scale.setScalar(0.65);
    ghost.position.set(4.1, 0.6, -5);
    for (const x of [-3, -1, 1, 3]) {
      const rail = box(0.045, 0.025, 100, cyan);
      rail.position.set(x, 0.03, -40);
      scene.add(rail);
    }
    for (let i = 0; i < 54; i++) {
      const h = 1 + ((i * 17) % 9),
        tower = box(1.4, h, 2, i % 2 ? 0x12334c : 0x182a47);
      tower.material.map = windows;
      tower.material.color.setHex(0xffffff);
      tower.position.set((i % 2 ? 1 : -1) * (6 + (i % 5)), h / 2, 5 - i * 1.6);
      scene.add(tower);
    }
  } else {
    camera.position.set(0, 2.8, 6.6);
    camera.lookAt(0, 0.6, 0);
    player.position.set(1.16, 0.58, 0);
    ghost.position.set(-1.16, 0.58, -0.5);
  }
  const chip = box(0.56, 0.56, 0.12, 0x2265a0);
  if (!track) {
    chip.position.set(0, 1.9, -0.7);
    const face = new T.Mesh(
      new T.PlaneGeometry(0.5, 0.5),
      new T.MeshBasicMaterial({ map: panelTexture("NPU", "#69f0ae") }),
    );
    face.position.z = 0.065;
    chip.add(face);
    scene.add(chip);
    const coords = new Float32Array(180 * 3);
    for (let i = 0; i < coords.length; i += 3) {
      coords[i] = (Math.random() - 0.5) * 10;
      coords[i + 1] = Math.random() * 4;
      coords[i + 2] = -Math.random() * 6;
    }
    const sky = new T.BufferGeometry();
    sky.setAttribute("position", new T.BufferAttribute(coords, 3));
    scene.add(
      new T.Points(sky, new T.PointsMaterial({ color: 0x8be3ff, size: 0.024 })),
    );
  } else {
    chip.geometry.dispose();
    chip.material.dispose();
    for (let z = -42; z < 4; z += 12) {
      for (const x of [-3.5, 3.5]) {
        const pole = box(0.1, 3, 0.15, 0x197cac);
        pole.position.set(x, 1.5, z);
        scene.add(pole);
      }
      const cross = box(7.1, 0.11, 0.15, 0x4fcab2);
      cross.position.set(0, 3, z);
      scene.add(cross);
    }
  }
  const objs = [];
  function spawn(type) {
    const mesh =
      type === "orb"
        ? new T.Mesh(
            new T.OctahedronGeometry(0.5),
            new T.MeshBasicMaterial({ color: 0x69f0ae }),
          )
        : box(1.15, 1.15, 0.7, 0xff3855);
    scene.add(mesh);
    objs.push(mesh);
    return mesh;
  }
  let lastWidth, lastHeight;
  function draw(t, lane = 0, objects = [], rival = 0) {
    const w = host.clientWidth,
      h = host.clientHeight;
    if (w !== lastWidth || h !== lastHeight) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      lastWidth = w;
      lastHeight = h;
    }
    if (track) {
      player.position.set(lane * 2, 0.48 + Math.sin(t * 5) * 0.045, 1.5);
      ghost.position.z = -4 + rival;
      grid.position.z = (t * 5) % 2;
      objects.forEach((o, i) => {
        const m = objs[i] ?? spawn(o.type);
        m.visible = true;
        m.position.set(o.lane * 2, 0.7, 1.5 - (1 - o.progress) * 29);
        m.rotation.y = o.type === "orb" ? t * 2 : 0;
        m.material.color.setHex(o.type === "orb" ? 0x69f0ae : 0xff3855);
        if (m.userData.type !== o.type) {
          m.geometry.dispose();
          m.geometry =
            o.type === "orb"
              ? new T.OctahedronGeometry(0.5)
              : new T.BoxGeometry(1.15, 1.15, 0.7);
          m.userData.type = o.type;
        }
      });
      objs.slice(objects.length).forEach((m) => (m.visible = false));
    } else {
      chip.rotation.y = t * 0.82;
      chip.rotation.z = 0.14;
      player.rotation.y = Math.sin(t * 0.64) * 0.4 - 0.4;
      ghost.rotation.y = 0.47 + Math.cos(t * 0.6) * 0.32;
      player.position.y = 0.6 + Math.sin(t * 1.4) * 0.07;
    }
    renderer.render(scene, camera);
  }
  return {
    draw,
    dispose() {
      scene.traverse((m) => {
        m.geometry?.dispose();
        m.material?.map?.dispose();
        m.material?.dispose();
      });
      renderer.dispose();
      renderer.forceContextLoss();
      host.replaceChildren();
    },
  };
}
