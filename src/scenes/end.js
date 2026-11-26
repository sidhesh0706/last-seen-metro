const products = [
  {
    name: "Acer Swift Go 14",
    sku: "NX.KSMSI.002",
    spec: "Core Ultra 5 125H · 16 GB RAM · 512 GB SSD",
    price: "₹75,990",
    url: "https://www.vijaysales.com/p/238242/acer-swift-go-14-laptop-intel-core-ultra-5-125h-16gb-lpddr5x-ram-512gb-ssd-14-inch-35-56-cm-touchscreen-display-intel-arc-graphics-bluetooth-5-3-finger-print-reader-windows-11-nx-ksmsi-002",
    store: "Vijay Sales",
  },
  {
    name: "ASUS Zenbook S 14",
    sku: "UX5406SA-PZ555WS",
    spec: "Core Ultra 5 226V · 16 GB RAM · 1 TB SSD",
    price: "₹1,40,990",
    url: "https://in.store.asus.com/asus-zenbook-s-14-ux5406sa-pz555ws-oled-touchscreen-copilot-pc.html",
    store: "ASUS India",
  },
];
export function finish({ stage, session, go, beep }) {
  session.score += 200;
  const premium =
    ["Gamer", "Creator"].includes(session.role.name) && session.score >= 300;
  function card(index) {
    const p = products[index];
    stage.innerHTML = `<p class="eyeline">FINISH LINE / ${session.role.name.toUpperCase()} / ${session.score} PTS</p><h1>Your next laptop.</h1><div class="product"><img src="./rig-${index + 1}.webp" alt="Illustrative laptop artwork"><div><small>${p.sku}</small><h2>${p.name}</h2><p>${p.spec}</p><p>${index ? "The larger SSD offers room for footage, game installs and creative projects." : "A lower-priced configuration for everyday projects, study and local AI experiments."}</p><strong class="price">${p.price}</strong><small>Indicative price · catalogue checked 25 Nov 2026</small></div></div><div class="actions"><a class="primary" href="${p.url}" target="_blank" rel="noopener">View at ${p.store}</a><button id="store">Show me in store</button><button id="other">Compare other budget</button></div><p id="note" role="status"></p><details><summary>Intel and Snapdragon hardware facts</summary><p><a href="https://www.intel.com/content/www/us/en/products/sku/240960/intel-core-ultra-5-processor-226v-8m-cache-up-to-4-50-ghz/specifications.html" target="_blank" rel="noopener">Core Ultra 5 226V</a> has an Intel AI Boost NPU rated at 40 peak INT8 TOPS. <a href="https://www.qualcomm.com/laptops/products/snapdragon-x-elite" target="_blank" rel="noopener">Snapdragon X Elite</a> has a Hexagon NPU rated up to 45 TOPS. Both support local AI with compatible software. App support, models and drivers determine which engine is used. The race times and power-ups are game rules.</p></details><button id="replay">Race again</button>`;
    stage.querySelector("#other").onclick = () => card(1 - index);
    stage.querySelector("#store").onclick = () => {
      beep(840);
      stage.querySelector("#note").textContent =
        "Ask for " +
        p.sku +
        ". Try your own " +
        session.role.name.toLowerCase() +
        " workload, then ask staff to demonstrate a supported local NPU app.";
    };
    stage.querySelector("#replay").onclick = () => go(0);
  }
  card(premium ? 1 : 0);
}
