import fs from "fs";
import path from "path";

const URLS_DIR = "./urls";

const categories = fs.readdirSync(URLS_DIR);

for (const category of categories) {

    const categoryPath = path.join(URLS_DIR, category);

    if (!fs.statSync(categoryPath).isDirectory()) continue;

    console.log(`Kategori : ${category}`);

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

        for (const url of lines) {
            console.log("     ", url);
        }

    }

}
