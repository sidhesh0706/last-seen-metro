import { chromium } from "@playwright/test";
import { preview } from "vite";
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
const server = await preview({
  preview: { host: "127.0.0.1", port: 4193, strictPort: true },
});
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || "chrome",
  args: ["--enable-unsafe-swiftshader"],
});
try {
  const ctx = await browser.newContext({
      viewport: { width: 1366, height: 768 },
    }),
    page = await ctx.newPage();
  page.setDefaultTimeout(90000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await mkdir("qa", { recursive: true });
  await page.goto("http://127.0.0.1:4193");
  await page.locator("#start").waitFor();
  const loadMs = await page.evaluate(() => performance.now());
  console.log("Title ready in", Math.round(loadMs), "ms on test machine");
  await page.locator("#world canvas").waitFor({ timeout: 5000 });
  await page.screenshot({ path: "qa/arena-title.jpg" });
  await page.locator("#start").click();
  await page.locator('[data-role="2"]').click();
  await page.locator("#race-start").click();
  for (const key of ["GPU", "CPU", "GPU", "NPU"])
    await page.locator('[data-engine="' + key + '"]').click();
  await page.getByText("Relay won. Boost charged.").waitFor();
  await page.locator("#drive").click();
  await page.locator("#run").click();
  await page.keyboard.press("ArrowLeft");
  await page.locator("#pause").click();
  await page.locator("#pause").click();
  await page.keyboard.press("d");
  await page.screenshot({ path: "qa/arena-run.jpg" });
  await page.waitForFunction(() => !!navigator.serviceWorker?.controller);
  await ctx.setOffline(true);
  await page
    .getByRole("button", { name: "Enter archive sprint" })
    .click({ timeout: 180000 });
  await page.locator("form input").fill("a red umbrella on wet pavement");
  await page.locator("form button").click();
  await page.waitForFunction(() =>
    document.querySelector("#status")?.textContent.includes("Ranked 42"),
  );
  assert.equal(await page.locator("figure.top").count(), 3);
  console.log(await page.locator("#status").textContent());
  await page.screenshot({ path: "qa/arena-search.jpg" });
  await page.locator("#finish").click();
  await page.getByText("Acer Swift Go 14", { exact: true }).waitFor();
  await page.locator("#store").click();
  assert.match(await page.locator("#note").textContent(), /NX.KSMSI/);
  await page.locator("#other").click();
  await page.getByText("ASUS Zenbook S 14", { exact: true }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.reload();
  await page.locator("#start").click();
  assert.equal(await page.locator("[data-role]").count(), 4);
  assert.deepEqual(errors, []);
  console.log("Arena walkthrough and disconnected reload passed.");
} finally {
  await browser.close();
  await server.close();
}
