import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { preview } from "vite";
const server = await preview({
  preview: { host: "127.0.0.1", port: 4193, strictPort: true },
});
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || "chrome",
});
try {
  const ctx = await browser.newContext({
    viewport: { width: 1366, height: 768 },
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(90000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await mkdir("qa", { recursive: true });
  const snap = (n) =>
    page.screenshot({
      path: "qa/" + n + ".jpg",
      type: "jpeg",
      animations: "disabled",
      quality: 75,
    });
  await page.goto("http://127.0.0.1:4193");
  await page.evaluate(() => document.fonts.ready);
  await snap("00-title");
  await page.locator("#play").click();
  await page.locator("#skip").click();
  await snap("01-showroom");
  await page.locator('[data-rig="1"]').click();
  await snap("02-incident");
  await page.locator("#enter").click();
  await page.waitForSelector(".frame");
  assert.equal(await page.locator(".frame").count(), 42);
  const trials = [
    ["black guitar case beside blue seats", ["01", "02"]],
    ["an orange hiking backpack by stairs", ["03"]],
    ["open notebook and pen on a blue chair", ["05"]],
    ["a red umbrella on wet concrete", ["06"]],
  ];
  const results = [];
  for (const [query, expected] of trials) {
    await page.locator("form input").fill(query);
    await page.locator("form button").click();
    await page.waitForFunction(() =>
      document.querySelector("#status")?.textContent.includes("images ranked"),
    );
    const ids = await page
      .locator(".frame")
      .evaluateAll((nodes) => nodes.slice(0, 5).map((n) => n.dataset.id));
    results.push({
      query,
      expected,
      ids,
      top1: expected.includes(ids[0]),
      top5: ids.some((id) => expected.includes(id)),
    });
  }
  await page.locator("#field-command").click();
  assert.equal(await page.locator("#inspect .compare figure").count(), 2);
  await page.locator("#close").click();
  await snap("03-archive");
  await page.locator('[data-id="02"]').click();
  await page.locator("#confirm").click();
  assert.ok(await page.locator("#reply").textContent());
  await page.locator("#pin").click();
  await page.locator('[data-id="01"]').click();
  await page.locator("#zoom").click();
  await snap("03-inspect");
  await page.locator("#confirm").click();
  async function solveConsole(value, testMiss = false, timed = false) {
    await page.locator("#lock").click();
    assert.ok(await page.locator("#signal-feedback").textContent());
    await page.locator("#dial").focus();
    await page.keyboard.press("Home");
    for (let i = 0; i < value; i++) await page.keyboard.press("ArrowRight");
    await page.locator("#lock").click();
    const gate = await page.locator("#console blockquote strong").textContent();
    await page
      .locator(".junction button")
      .filter({ hasText: gate.split(" ")[0] })
      .click();
    if(timed){
      await page.locator("#step-mode").uncheck();
      await page.locator("#launch").click();
      await page.waitForFunction(()=>parseFloat(document.querySelector('#runner').style.left)>=70);
      await page.locator("#launch").click();
      await page.getByRole('heading',{name:'Made soundcheck.'}).waitFor();
      return;
    }
    await page.locator("#step-mode").check();
    if (testMiss) {
      await page
        .locator(".junction button")
        .filter({ hasNotText: gate.split(" ")[0] })
        .first()
        .click();
      for (let i = 0; i < 5; i++) await page.locator("#launch").click();
      assert.match(
        await page.locator("#dispatch-feedback").textContent(),
        /Change the junction/,
      );
      await page
        .locator(".junction button")
        .filter({ hasText: gate.split(" ")[0] })
        .click();
    }
    for (let i = 0; i < 5; i++) await page.locator("#launch").click();
    await page.getByRole("heading", { name: "Made soundcheck." }).waitFor();
  }
  await snap("04-field-tool");
  await solveConsole(2, true);
  await snap("04-reveal");
  await page.locator("#next").click();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await ctx.setOffline(true);
  await page.locator("form input").fill("Something to keep dry in the rain");
  await page.locator("form button").click();
  await page.waitForFunction(() =>
    document
      .querySelector("#status")
      ?.textContent.includes("Offline search verified"),
  );
  await snap("05-offline");
  await page.locator('[data-id="05"]').click();
  await page.locator("#encore").click();
  await page.locator('[data-chip="2"]').click();
  assert.match(await page.locator("#chip-detail").textContent(), /OpenVINO/);
  await snap("06-lab");
  await page.locator("#next").click();
  await snap("07-recommendation");
  await page.locator("#budget").selectOption("60000");
  assert.match(await page.locator("#card").textContent(), /more than/);
  await page.locator("#finish").click();
  await page.reload();
  await page.locator("#judge").click();
  await page.locator("#enter").click();
  await page.locator("form input").fill("orange bag");
  await page.locator("form button").click();
  await page.waitForFunction(() =>
    document.querySelector("#status")?.textContent.includes("images ranked"),
  );
  for (const width of [1920, 1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
  }
  for (const [rig, target] of [
    [0, 4],
    [2, 3],
  ]) {
    await page.locator("#home").click();
    await page.locator("#play").click();
    await page.locator("#skip").click();
    await page.locator('[data-rig="' + rig + '"]').click();
    await page.locator("#enter").click();
    await page.locator('[data-id="01"]').click();
    await page.locator("#confirm").click();
    await solveConsole(target,false,rig===2);
  }
  assert.deepEqual(errors, []);
  await writeFile("qa/retrieval.json", JSON.stringify(results, null, 2));
  console.log(results);
} finally {
  await browser.close();
  await server.close();
}
