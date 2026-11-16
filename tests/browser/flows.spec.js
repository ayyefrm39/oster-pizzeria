import { test, expect } from "@playwright/test";

test("home, menu, options, cart, pickup checkout, confirmation and refresh", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Se menyn", exact: true }).first(),
  ).toBeVisible();
  await page.goto("/meny");
  await page.getByText("TEST – pizza", { exact: true }).click();
  await page.getByRole("button", { name: /Familj/ }).click();
  await page.getByRole("button", { name: /Extra ost/ }).click();
  await expect(
    page.getByRole("button", { name: /Lägg i varukorg/ }),
  ).toContainText("200");
  await page.getByRole("button", { name: /Lägg i varukorg/ }).click();
  await page.goto("/varukorg");
  await expect(
    page.getByText("TEST – pizza", { exact: false }).first(),
  ).toBeVisible();
  await page.goto("/kassa");
  await page.getByLabel(/^Namn/).fill("Testkund");
  await page.getByLabel(/^Telefon/).fill("0701234567");
  await page
    .getByRole("button", { name: /Betala på plats|Betala vid|Betala i/ })
    .first()
    .click();
  await page.getByRole("button", { name: /Placera beställning/ }).click();
  await expect(page).toHaveURL(/\/order\/.+token=/);
  await expect(page.getByText("200 kr", { exact: true }).first()).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("TEST – pizza", { exact: false }).first(),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("admin login, categories, menu, settings and dashboard", async ({
  page,
}) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel("Email", { exact: true }).fill("admin@example.test");
  await page
    .getByLabel("Password", { exact: true })
    .fill("test-password-only-123");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL("/admin");
  await expect(
    page.getByRole("heading", { name: "Beställningar", exact: true }),
  ).toBeVisible();
  await page.goto("/admin/kategorier");
  await expect(
    page.getByText("TEST – kategori", { exact: true }),
  ).toBeVisible();
  await page.goto("/admin/meny");
  await expect(page.getByText("TEST – pizza", { exact: true })).toBeVisible();
  await page.goto("/admin/installningar");
  await expect(page.getByText("Öppettider", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/admin-${test.info().project.name}.png`,
    fullPage: true,
  });
});

test("cart quantity/removal, search and network failure are usable", async ({
  page,
}) => {
  await page.goto("/meny");
  await page.getByPlaceholder("Sök i menyn…").fill("not-a-product");
  await expect(page.getByText("Inga resultat", { exact: false })).toBeVisible();
  await page.getByPlaceholder("Sök i menyn…").fill("");
  await page.getByText("TEST – pizza", { exact: true }).click();
  await page.getByRole("button", { name: /Normal/ }).click();
  await page.getByRole("button", { name: /Lägg i varukorg/ }).click();
  await page.goto("/varukorg");
  await page
    .getByRole("button", { name: "Öka antal TEST – pizza", exact: true })
    .click();
  await expect(page.getByText("220 kr", { exact: true }).first()).toBeVisible();
  await page
    .getByRole("button", { name: "Minska antal TEST – pizza", exact: true })
    .click();
  await expect(page.getByText("110 kr", { exact: true }).first()).toBeVisible();
  await page
    .getByRole("button", { name: "Ta bort TEST – pizza", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Din varukorg är tom" }),
  ).toBeVisible();
  await page.route("**/api/catalog/MenuItem", (route) => route.abort());
  await page.goto("/meny");
  await expect(page.getByRole("alert")).toContainText(
    "Menyn kunde inte hämtas",
  );
});

test("delivery rejects outside zone and stores valid delivery with a server fee", async ({
  page,
}) => {
  await page.goto("/meny");
  await page.getByText("TEST – pizza", { exact: true }).click();
  await page.getByRole("button", { name: /Familj/ }).click();
  await page.getByRole("button", { name: /Lägg i varukorg/ }).click();
  await page.goto("/kassa");
  await page.getByRole("button", { name: /^Hemleverans/ }).click();
  await page.getByLabel(/^Förnamn/).fill("Test");
  await page.getByLabel(/^Efternamn/).fill("Kund");
  await page.getByLabel(/^Telefon/).fill("0701234567");
  await page.getByLabel(/^Gatuadress/).fill("Testgatan 1");
  await page.getByLabel(/^Postnummer/).fill("99999");
  await expect(
    page.getByRole("button", { name: "Placera beställning" }),
  ).toBeDisabled();
  await page.getByLabel(/^Postnummer/).fill("24130");
  await expect(page.getByText("229 kr", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Placera beställning" }).click();
  await expect(page).toHaveURL(/\/order\/.+token=/);
  await expect(page.getByText("229 kr", { exact: true }).first()).toBeVisible();
});

test("admin creates category/product, edits price and settings, manages incoming order", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("admin@example.test");
  await page
    .getByLabel("Password", { exact: true })
    .fill("test-password-only-123");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL("/admin");
  const suffix = test.info().project.name;
  const category = `TEST kategori ${suffix}`;
  const product = `TEST produkt ${suffix}`;
  await page.goto("/admin/kategorier");
  await page.getByRole("button", { name: "Ny kategori", exact: true }).click();
  await page.getByLabel("Namn", { exact: true }).fill(category);
  await page.getByRole("button", { name: "Spara", exact: true }).click();
  await expect(page.getByText(category, { exact: true })).toBeVisible();
  await page.goto("/admin/meny");
  await page.getByRole("button", { name: "Ny artikel", exact: true }).click();
  await page.getByLabel("Namn", { exact: true }).fill(product);
  await page.getByLabel("Pris (kr)", { exact: true }).fill("135");
  await page.getByRole("button", { name: "Spara", exact: true }).click();
  await expect(page.getByText(product, { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: `Redigera ${product}`, exact: true })
    .click();
  await page.getByLabel("Pris (kr)", { exact: true }).fill("140");
  await page.getByRole("button", { name: "Spara", exact: true }).click();
  await expect(page.getByText(/140 kr/).first()).toBeVisible();
  await page.goto("/admin/installningar");
  await page.getByLabel("Telefon", { exact: true }).fill("0709876543");
  await page
    .getByRole("button", { name: "Spara inställningar", exact: true })
    .click();
  await expect(
    page.getByText("Inställningar sparade", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Telefon", { exact: true })).toHaveValue(
    "0709876543",
  );
  const catalog = await (
    await page.request.get("/api/catalog/MenuItem")
  ).json();
  const pizza = catalog.find((p) => p.name === "TEST – pizza");
  const customer = `TEST adminorder ${suffix}`;
  const created = await page.request.post("/api/orders", {
    headers: { Origin: "http://127.0.0.1:4173" },
    data: {
      idempotencyKey: crypto.randomUUID(),
      orderType: "pickup",
      customer: { name: customer, phone: "0701234567" },
      items: [{ itemId: pizza.id, qty: 1, size: "Normal" }],
      paymentMethod: "cash",
    },
  });
  expect(created.ok()).toBe(true);
  const order = await created.json();
  await page.goto("/admin");
  const card = page.getByTestId(`order-${order.orderId}`);
  await expect(card.getByText(customer, { exact: true })).toBeVisible();
  await card.getByRole("button", { name: "Acceptera", exact: true }).click();
  await page.getByRole("button", { name: "25 min", exact: true }).click();
  await page.getByRole("button", { name: /Pågående/ }).click();
  await expect(card.getByText(customer, { exact: true })).toBeVisible();
});

test("admin delivery/offer forms persist and a customer receives a server-validated discount", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("admin@example.test");
  await page
    .getByLabel("Password", { exact: true })
    .fill("test-password-only-123");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL("/admin");
  await page.goto("/admin/drift");
  await page.getByRole("button", { name: "Lägg till", exact: true }).click();
  await page
    .getByLabel("Namn", { exact: true })
    .fill(`TEST zon ${test.info().project.name}`);
  await page
    .getByLabel("Postnummer eller tresiffriga prefix, kommaseparerade")
    .fill("242");
  await page.getByRole("button", { name: "Spara", exact: true }).click();
  await expect(
    page.getByText(`TEST zon ${test.info().project.name}`, { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Erbjudanden", exact: true }).click();
  await page.getByRole("button", { name: "Lägg till", exact: true }).click();
  await page
    .getByLabel("Namn", { exact: true })
    .fill(`TEST rabatt ${test.info().project.name}`);
  const code = `TEST10${test.info().project.name.toUpperCase()}`;
  await page.getByLabel("Rabattkod", { exact: true }).fill(code);
  await page
    .getByLabel("Start (lokal tid)", { exact: true })
    .fill("2020-01-01T12:00");
  await page
    .getByLabel("Slut (lokal tid)", { exact: true })
    .fill("2099-01-01T12:00");
  await page.getByLabel("Aktiv", { exact: true }).check();
  await page.getByRole("button", { name: "Spara", exact: true }).click();
  await expect(
    page.getByText(`TEST rabatt ${test.info().project.name}`, { exact: true }),
  ).toBeVisible();
  await page.goto("/meny");
  await page.getByText("TEST – pizza", { exact: true }).click();
  await page.getByRole("button", { name: /Normal/ }).click();
  await page.getByRole("button", { name: /Lägg i varukorg/ }).click();
  await page.goto("/kassa");
  await page.getByLabel(/^Namn/).fill("Rabattkund");
  await page.getByLabel(/^Telefon/).fill("0701234567");
  await page.getByLabel("Rabattkod (valfri)").fill(code);
  await expect(page.getByText("99 kr", { exact: true }).first()).toBeVisible();
  await page
    .getByRole("button", { name: "Placera beställning", exact: true })
    .click();
  await expect(page).toHaveURL(/\/order\/.+token=/);
  await expect(page.getByText("99 kr", { exact: true }).first()).toBeVisible();
});
