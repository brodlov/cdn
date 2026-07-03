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

function slugify(text) {
    return text
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");
}

const categories = fs.readdirSync(IMAGES_DIR).sort(naturalSort);

for (const category of categories) {

    const categoryPath = path.join(IMAGES_DIR, category);

    if (!fs.statSync(categoryPath).isDirectory()) continue;

    console.log(`Category: ${category}`);

    const pages = fs.readdirSync(categoryPath).sort(naturalSort);

    for (const page of pages) {

        const pagePath = path.join(categoryPath, page);

        if (!fs.statSync(pagePath).isDirectory()) continue;

        const images = fs.readdirSync(pagePath)
            .filter(isImage)
            .sort(naturalSort);

        const urls = images.map(file =>
            `${BASE_CDN}${path.join("images", category, page, file).replace(/\\/g, "/")}`
        );

        const outputFile = path.join(
            OUTPUT_DIR,
            `${slugify(category)}-${slugify(page)}.txt`
        );

        fs.writeFileSync(outputFile, urls.join("\n"));

        console.log(`✓ ${outputFile} (${urls.length})`);
    }
}

console.log("DONE ✔");
