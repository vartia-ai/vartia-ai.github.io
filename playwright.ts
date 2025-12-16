// tasks/playwright_task.ts
import { chromium } from "playwright";

export async function runTask() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Codex edits from here ↓↓↓

  await page.goto("https://example.com");

  // example:
  // await page.click("text=Sign in");
  // await page.fill('input[name="email"]', "test@example.com");
  // await page.screenshot({ path: "example.png", fullPage: true });

  // Codex edits to here ↑↑↑

  await browser.close();
}

runTask().catch(err => {
  console.error(err);
  process.exit(1);
});