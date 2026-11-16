// Recover the original asset, never substitute a generated or unrelated picture.
// Requires the reference image host to be allowed in the environment network settings.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import sharp from "sharp";
const source =
  "https://media.base44.com/images/public/6a9aae5156bb8dde83fa0986/f3d18ee18_generated_image.png";
const file = "src/pages/Home.jsx";
const code = readFileSync(file, "utf8");
if (!code.includes(source))
  throw new Error(
    "Expected original hero reference not present; inspect before changing source.",
  );
const response = await fetch(source, {
  signal: AbortSignal.timeout(30000),
  redirect: "error",
});
if (!response.ok)
  throw new Error(`Original image request failed: HTTP ${response.status}`);
if (Number(response.headers.get("content-length")) > 20000000)
  throw new Error("Original asset exceeds size limit.");
const chunks = [];
let size = 0;
for await (const chunk of response.body) {
  size += chunk.length;
  if (size > 20000000) throw new Error("Original asset exceeds size limit.");
  chunks.push(chunk);
}
const original = Buffer.concat(chunks);
const image = await sharp(original, { limitInputPixels: 40000000 })
  .rotate()
  .resize({ width: 2000, withoutEnlargement: true })
  .webp({ quality: 90 })
  .toBuffer();
mkdirSync("public/images", { recursive: true });
writeFileSync("public/images/original-hero.webp", image, { flag: "wx" });
writeFileSync(
  "docs/hero-provenance.json",
  JSON.stringify(
    {
      source,
      downloadedAt: new Date().toISOString(),
      originalSha256: createHash("sha256").update(original).digest("hex"),
      localSha256: createHash("sha256").update(image).digest("hex"),
      localPath: "/images/original-hero.webp",
    },
    null,
    2,
  ) + "\n",
  { flag: "wx" },
);
writeFileSync(file, code.replace(source, "/images/original-hero.webp"));
console.log(
  "Original hero recovered and referenced locally. Rebuild and compare screenshots before committing.",
);
