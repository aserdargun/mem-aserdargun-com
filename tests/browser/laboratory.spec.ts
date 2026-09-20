import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { scenarios } from "../../src/data/scenarios";
const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const messages: string[] = [];
  errors.set(page, messages);
  page.on("pageerror", (e) => messages.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") messages.push(m.text());
  });
  await page.goto("/");
  await expect(page).toHaveTitle("MEM — Agent Memory Laboratory");
});
test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([]);
  expect(await page.locator("vite-error-overlay").count()).toBe(0);
});
const rows = (page: Page) => page.getByTestId("memory-row");
const recall = (page: Page) =>
  page
    .getByRole("button", { name: "Geri çağır ve bağlam oluştur", exact: true })
    .click();
const steps = async (page: Page, n: number) => {
  for (let i = 0; i < n; i++)
    await page.getByRole("button", { name: "Adımla", exact: true }).click();
};
const choose = (page: Page, title: string) =>
  page.getByRole("button", { name: new RegExp(title) }).click();
test("complete lifecycle survives reload and removes deleted content from download and reset", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "İlk deneyi başlat", exact: true })
    .click();
  await expect(rows(page)).toHaveCount(1);
  await page.getByRole("button", { name: "Yeni oturum", exact: true }).click();
  await recall(page);
  await expect(page.locator(".context-line")).toContainText("Türkçe");
  await page.reload();
  await expect(page.locator(".context-line")).toContainText("Türkçe");
  await rows(page).first().click();
  await page
    .getByRole("button", { name: "Bilgiyi düzelt", exact: true })
    .click();
  await page
    .getByLabel("Açık kullanıcı düzeltmesi", { exact: true })
    .fill("Özel QA ayrıntısı: İngilizce uzun rapor.");
  await page.getByRole("button", { name: "Düzeltmeyi kaydet" }).click();
  await recall(page);
  await expect(page.locator(".context-line")).toContainText(
    "İngilizce uzun rapor",
  );
  await rows(page).first().click();
  await page.getByRole("button", { name: "Kaydı ve sürümlerini sil" }).click();
  await recall(page);
  await expect(page.locator(".result-status")).toContainText(
    "Yeterli bellek yok",
  );
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "JSON dışa aktar" }).click();
  const download = await downloadPromise;
  const raw = await readFile((await download.path())!, "utf8");
  expect(raw).not.toContain("Özel QA ayrıntısı");
  expect(JSON.parse(raw).schemaVersion).toBe(1);
  await page.getByRole("button", { name: "Deneyi sıfırla" }).click();
  await steps(page, 1);
  await expect(rows(page)).toHaveCount(0);
  await page.reload();
  await expect(rows(page)).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("Özel QA ayrıntısı");
});
for (const [title, count, expected] of [
  ["Tercih hatırlama", 2, "Ada kısa"],
  ["Değişen proje", 3, "18 Eylül"],
  ["Çelişkili kaynaklar", 3, "Çelişki çözülmedi"],
  ["Süresi dolan bilgi", 1, "Yeterli bellek yok"],
  ["Bellek gürültüsü", 7, "kahve"],
  ["Kapsam ve unutma", 3, "Ece"],
] as const) {
  test(`scenario: ${title}`, async ({ page }) => {
    await choose(page, title);
    await steps(page, count);
    if (title === "Süresi dolan bilgi")
      await page.getByRole("button", { name: "Saati +1 gün ilerlet" }).click();
    await recall(page);
    await expect(page.locator(".result")).toContainText(expected);
    if (title === "Kapsam ve unutma") {
      await page.getByRole("tab", { name: /Elenen/ }).click();
      await expect(page.getByTestId("memory-row")).toContainText("Nova");
      await expect(page.locator(".events")).toContainText("Aday elendi");
    }
  });
}
test("comparison uses isolated stores and selective policy can lose", async ({
  page,
}) => {
  await choose(page, "Bellek gürültüsü");
  await page
    .getByRole("button", { name: "Karşılaştırma", exact: true })
    .click();
  await page.getByRole("button", { name: "Üç politikayı karşılaştır" }).click();
  await expect(page.locator(".comparison-column")).toHaveCount(3);
  await expect(page.locator(".comparison-column").nth(1)).toContainText(
    "Beklenen sonuca uygun",
  );
  await expect(page.locator(".comparison-column").nth(2)).toContainText(
    "Beklenen sonuç karşılanmadı",
  );
  await page.getByRole("button", { name: "Laboratuvar", exact: true }).click();
  await expect(rows(page)).toHaveCount(0);
});
test("policy stores, new task, session policy and language persistence", async ({
  page,
}) => {
  await steps(page, 1);
  await page
    .getByRole("combobox", { name: "Bellek politikası", exact: true })
    .selectOption("session");
  await expect(rows(page)).toHaveCount(0);
  await steps(page, 1);
  await page.getByRole("button", { name: "Yeni görev", exact: true }).click();
  await expect(rows(page)).toHaveCount(1);
  await page.getByRole("button", { name: "Yeni oturum", exact: true }).click();
  await recall(page);
  await expect(page.locator(".result-status")).toContainText(
    "Yeterli bellek yok",
  );
  await page
    .getByRole("combobox", { name: "Bellek politikası", exact: true })
    .selectOption("selective");
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(rows(page)).toContainText("Ada prefers");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(rows(page)).toHaveCount(1);
  await page
    .getByRole("button", { name: "Recall & assemble context", exact: true })
    .click();
  await expect(page.locator(".context-line")).toContainText("short reports");
});
test("play, pause and reset reflect real progress", async ({ page }) => {
  await choose(page, "Bellek gürültüsü");
  await page.getByRole("button", { name: "Oynat", exact: true }).click();
  await expect(rows(page)).toHaveCount(1);
  await page.getByRole("button", { name: "Duraklat", exact: true }).click();
  const count = await page.locator(".events .event").count();
  await page.waitForTimeout(1000);
  expect(await page.locator(".events .event").count()).toBe(count);
  await page.getByRole("button", { name: "Deneyi sıfırla" }).click();
  await expect(rows(page)).toHaveCount(0);
});
test("custom creation, search, expiry, all-data deletion", async ({ page }) => {
  await page.getByRole("button", { name: "Kendi kaydını ekle" }).click();
  await page
    .getByLabel("İçerik", { exact: true })
    .fill("Özgün QA verisi narenciye");
  await page
    .getByLabel("Etiketler (virgülle)", { exact: true })
    .fill("narenciye");
  await page
    .getByRole("combobox", { name: "Geçerlilik", exact: true })
    .selectOption("day");
  await page.getByRole("button", { name: "Adayı kaydet" }).click();
  await page.getByLabel("Yeni görevi sor", { exact: false }).fill("narenciye");
  await recall(page);
  await expect(page.locator(".context-line")).toContainText("narenciye");
  await page.getByRole("button", { name: "Saati +1 gün ilerlet" }).click();
  await recall(page);
  await expect(page.locator(".result-status")).toContainText(
    "Yeterli bellek yok",
  );
  await page
    .getByRole("button", { name: "Tüm laboratuvar verisini sil" })
    .click();
  await page.getByRole("button", { name: "Evet, tüm veriyi sil" }).click();
  expect(
    await page.evaluate(() => localStorage.getItem("mem-laboratory:v1")),
  ).toBeNull();
  await page.reload();
  await expect(rows(page)).toHaveCount(0);
});
test("corrupt storage recovers without blank screen", async ({ page }) => {
  await page.evaluate(() => localStorage.setItem("mem-laboratory:v1", "{bad"));
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("Yerel kayıt okunamadı");
  await page.getByRole("button", { name: "Bozuk kaydı temizle" }).click();
  await steps(page, 1);
  await page.reload();
  await expect(rows(page)).toHaveCount(1);
});
test("methods, keyboard focus, and experiment links", async ({ page }) => {
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Laboratuvara geç" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
  await page
    .getByRole("button", { name: "Kavramlar ve yöntem", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Birincil kaynaklar" }),
  ).toBeVisible();
  await expect(page.locator(".reference a")).toHaveCount(3);
  await page
    .getByRole("button", { name: "Deneyi aç", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Bellek yaşam döngüsü" }),
  ).toBeVisible();
});
for (const width of [320, 390, 768, 1440])
  test(`responsive ${width}: all pages, populated records and diagram`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await choose(page, "Değişen proje");
    await steps(page, 3);
    await rows(page).last().click();
    for (const tab of ["Laboratuvar", "Karşılaştırma", "Kavramlar ve yöntem"]) {
      await page.getByRole("button", { name: tab, exact: true }).click();
      if (tab === "Karşılaştırma")
        await page
          .getByRole("button", { name: "Üç politikayı karşılaştır" })
          .click();
      const dimensions = await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
    }
    await page
      .getByRole("button", { name: "Laboratuvar", exact: true })
      .click();
    const frames = await page.locator(".diagram-frame").all();
    expect(frames).toHaveLength(2);
    const a = await frames[0].boundingBox(),
      b = await frames[1].boundingBox(),
      arrows = await page.locator(".diagram-arrows").boundingBox();
    expect(a!.x + a!.width).toBeLessThan(arrows!.x);
    expect(arrows!.x + arrows!.width).toBeLessThan(b!.x);
    await page.screenshot({ path: `/tmp/mem-${width}.png`, fullPage: true });
  });

for (const [index, scenario] of scenarios.entries())
  test(`English scenario and full policy comparison: ${scenario.id}`, async ({
    page,
  }) => {
    await choose(page, scenario.title.tr);
    await page.getByRole("button", { name: "EN", exact: true }).click();
    for (let i = 0; i < scenario.events.length; i++)
      await page.getByRole("button", { name: "Step", exact: true }).click();
    if (scenario.compareSession)
      await page
        .getByRole("button", { name: "New session", exact: true })
        .click();
    if (scenario.compareAdvance)
      await page
        .getByRole("button", { name: "Advance +1 day", exact: true })
        .click();
    await page
      .getByRole("button", { name: "Recall & assemble context", exact: true })
      .click();
    const expected = [
      "Ada prefers",
      "18 September",
      "Conflict unresolved",
      "Insufficient memory",
      "Coffee",
      "Ece",
    ][index];
    await expect(page.locator(".result")).toContainText(expected);
    await page.getByRole("button", { name: "Comparison", exact: true }).click();
    await page
      .getByRole("button", { name: "Compare all three policies", exact: true })
      .click();
    const aligned = [
      [false, true, true],
      [true, true, true],
      [true, true, true],
      [true, true, true],
      [true, true, false],
      [true, true, true],
    ][index];
    for (let i = 0; i < 3; i++)
      await expect(
        page.locator(".comparison-column .outcome").nth(i),
      ).toContainText(
        aligned[i] ? "Matches expected result" : "Expected result not met",
      );
  });
test("threshold tradeoff and source merging remain inspectable", async ({
  page,
}) => {
  await choose(page, "Bellek gürültüsü");
  await page.getByRole("slider").fill("0.4");
  await steps(page, 7);
  await recall(page);
  await expect(page.locator(".context-line")).toContainText("LIME-7");
  await page.getByRole("tab", { name: /Bellek/ }).click();
  await rows(page).filter({ hasText: "kahve" }).click();
  await expect(page.locator(".source-item")).toHaveCount(5);
});
test("project scope switch, rejected content, and explicit synthetic reload", async ({
  page,
}) => {
  await choose(page, "Kapsam ve unutma");
  await steps(page, 3);
  await page
    .getByRole("combobox", { name: "Proje kapsamı" })
    .selectOption("Nova");
  await recall(page);
  await expect(page.locator(".context-line")).toContainText("Can");
  await expect(page.locator(".diagram")).toContainText("Ada / Nova");
  await rows(page).first().click();
  await page.getByRole("button", { name: "Kaydı ve sürümlerini sil" }).click();
  await page.getByRole("button", { name: "Deneyi sıfırla" }).click();
  await steps(page, 3);
  await recall(page);
  await expect(page.locator(".result-status")).toContainText(
    "Yeterli bellek yok",
  );
  await page
    .getByRole("button", {
      name: "Sentetik senaryoyu yeniden yükle",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Sentetik veriyi yükle", exact: true })
    .click();
  await steps(page, 3);
  await recall(page);
  await expect(page.locator(".context-line")).toContainText("Can");
});
test("storage unavailable remains functional and visibly warns", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Blocked", "SecurityError");
    };
  });
  await page.reload();
  await steps(page, 1);
  await expect(page.getByRole("alert")).toContainText(
    "Tarayıcı depolaması kullanılamıyor",
  );
  await recall(page);
  await expect(page.locator(".context-line")).toContainText("Türkçe");
});
test("arrow-key tabs, reduced motion, and self-hosted assets", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await steps(page, 1);
  const tab = page.getByRole("tab", { name: /Bellek/ });
  await tab.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: /Bulunan/ })).toBeFocused();
  await expect(page.getByRole("tab", { name: /Bulunan/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(
    await page
      .getByRole("button", { name: "Yeni oturum", exact: true })
      .evaluate((el) => getComputedStyle(el).transitionDuration),
  ).toBe("0s");
  const remote: string[] = [];
  page.on("request", (r) => {
    if (!r.url().startsWith("http://127.0.0.1:8042/")) remote.push(r.url());
  });
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  expect(remote).toEqual([]);
});
