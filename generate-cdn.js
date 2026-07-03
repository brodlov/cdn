import fs from "fs";
import path from "path";

const BASE_CDN = "https://cdn.jsdelivr.net/gh/brodlov/cdn/";
const IMAGES_DIR = "./images";
const OUTPUT_DIR = "./urls-generated";

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ✅ filter image
function isImage(file) {
    return /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(file);
}

// ✅ natural sort
function naturalSort(a, b) {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

const categories = fs.readdirSync(IMAGES_DIR);

for (const category of categories) {

    const categoryPath = path.join(IMAGES_DIR, category);

    if (!fs.statSync(categoryPath).isDirectory()) continue;

    console.log(`Processing: ${category}`);

    const files = fs.readdirSync(categoryPath)
        .filter(file => isImage(file))       // STEP 1
        .filter(file => !file.startsWith(".")) // STEP 2
        .sort(naturalSort);                  // STEP 3

    const urls = [];

    for (const file of files) {

        const relativePath = path
            .join("images", category, file)
            .replace(/\\/g, "/");

        urls.push(BASE_CDN + relativePath);
    }

    const outputFile = path.join(OUTPUT_DIR, `${category}.txt`);

    fs.writeFileSync(outputFile, urls.join("\n"));

    console.log(`✓ Saved: ${category}.txt (${urls.length} URLs)`);
}

console.log("DONE ✔");
