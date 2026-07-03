import fs from "fs";
import path from "path";
import axios from "axios";

(async () => {
const URLS_DIR = "./urls";
const IMAGES_DIR = "./images";

if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}


const categories = fs.readdirSync(URLS_DIR);

for (const category of categories) {

    const categoryPath = path.join(URLS_DIR, category);

    if (!fs.statSync(categoryPath).isDirectory()) continue;

    console.log(`Kategori : ${category}`);

    const outputDir = path.join(IMAGES_DIR, category);

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

    const txtFiles = fs.readdirSync(categoryPath)
        .filter(file => file.endsWith(".txt"));

    for (const txt of txtFiles) {

        console.log(`  File : ${txt}`);

        const lines = fs.readFileSync(
            path.join(categoryPath, txt),
            "utf8"
        )
        .split("\n")
        .map(v => v.trim())
        .filter(Boolean);

        console.log(`  Total URL : ${lines.length}`);

        let number = 1;

for (const url of lines) {

    console.log(`Download : ${url}`);

try {

    const response = await axios({
        url,
        method: "GET",
        responseType: "arraybuffer",
        timeout: 30000
    });

    let ext = "jpg";

    const type = response.headers["content-type"] || "";

    if (type.includes("png")) ext = "png";
    else if (type.includes("webp")) ext = "webp";
    else if (type.includes("jpeg")) ext = "jpg";
    else if (type.includes("jpg")) ext = "jpg";

    const filename =
        `${category}-${String(number).padStart(6, "0")}.${ext}`;

    fs.writeFileSync(
        path.join(outputDir, filename),
        response.data
    );

    console.log(`✓ ${filename}`);

    number++;

} catch (err) {

    console.log(`✗ Gagal download: ${url}`);
    console.log(err.message);

} catch (err) {

    console.log(`✗ Gagal download: ${url}`);
    console.log(err.message);

    continue;

}

    }

}

 })();
