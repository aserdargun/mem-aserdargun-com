import { test, expect } from "@playwright/test";
import { pageDescription } from "../../src/i18n";

for (const language of ["en", "tr"]) {
  test(`portfolio entry opens directly in ${language}`, async ({ page }) => {
    await page.goto(`/?lang=${language}`);
    await expect(page.locator("html")).toHaveAttribute("lang", language);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", language);
  });
}

/* The description is part of the surface: the page says it is in Turkish, so
 * it has to describe itself in Turkish too. The Turkish entry point and the
 * language switch are two ways to reach the same page, and both were leaving
 * an English page described in Turkish. */
test("the page description follows the language of the page", async ({
  page,
}) => {
  const description = page.locator('meta[name="description"]');

  await page.goto("/?lang=en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(description).toHaveAttribute("content", pageDescription.en);

  await page.goto("/?lang=tr");
  await expect(page.locator("html")).toHaveAttribute("lang", "tr");
  await expect(description).toHaveAttribute("content", pageDescription.tr);
});

test("switching the language in the page switches the description too", async ({
  page,
}) => {
  const description = page.locator('meta[name="description"]');

  await page.goto("/?lang=en");
  await expect(description).toHaveAttribute("content", pageDescription.en);

  await page.getByRole("button", { name: "TR", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "tr");
  await expect(description).toHaveAttribute("content", pageDescription.tr);

  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(description).toHaveAttribute("content", pageDescription.en);
});
