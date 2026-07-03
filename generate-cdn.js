import fs from "fs";
import path from "path";

const BASE_CDN = "https://cdn.jsdelivr.net/gh/brodlov/cdn/";
const IMAGES_DIR = "./images";
const OUTPUT_DIR = "./urls-generated";

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function isImage(file) {
    return /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(file);
}

function naturalSort(a, b) {
    return a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: "base"
    });
}

function getImagesRecursive(dir) {
    const results = [];

    const items = fs.readdirSync(dir).sort(naturalSort);

    for (const item of items) {

        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {

            results.push(...getImagesRecursive(fullPath));

        } else if (isImage(item)) {

            results.push(fullPath);

        }

    }

    return results;
}

const categories = fs.readdirSync(IMAGES_DIR);

for (const category of categories) {

    const categoryPath = path.join(IMAGES_DIR, category);

    if (!fs.statSync(categoryPath).isDirectory()) continue;

    console.log(`Processing: ${category}`);

    const images = getImagesRecursive(categoryPath);

    const urls = [];

    for (const imagePath of images) {

        const relativePath = imagePath.replace(/\\/g, "/");

        urls.push(`${BASE_CDN}${relativePath}`);

    }

    urls.sort(naturalSort);

    const outputFile = path.join(
        OUTPUT_DIR,
        `${category.toLowerCase().replace(/\s+/g, "-")}.txt`
    );

    fs.writeFileSync(outputFile, urls.join("\n"));

    console.log(`✓ Saved: ${outputFile} (${urls.length} URLs)`);

}

console.log("DONE ✔");
