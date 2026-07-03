import fs from "fs";
import path from "path";
import axios from "axios";
import pLimit from "p-limit";

const limit = pLimit(5); // max 5 download bersamaan

(async () => {

    const URLS_DIR = "./urls";
    const IMAGES_DIR = "./images";

    if (!fs.existsSync(IMAGES_DIR)) {
        fs.mkdirSync(IMAGES_DIR, { recursive: true });
    }

    if (!fs.existsSync(URLS_DIR)) {
        console.log("Folder urls tidak ditemukan.");
        process.exit(1);
    }

    const categories = fs.readdirSync(URLS_DIR);

    for (const category of categories) {

        const categoryPath = path.join(URLS_DIR, category);

        if (!fs.statSync(categoryPath).isDirectory()) continue;

        console.log(`Kategori: ${category}`);

        const outputDir = path.join(IMAGES_DIR, category);
        fs.mkdirSync(outputDir, { recursive: true });

        const txtFiles = fs.readdirSync(categoryPath)
            .filter(file => file.endsWith(".txt"));

        let number = 1;

        const tasks = [];

        for (const txt of txtFiles) {

            const lines = fs.readFileSync(
                path.join(categoryPath, txt),
                "utf8"
            )
            .split(/\r?\n/)
            .map(v => v.trim())
            .filter(Boolean);

            console.log(`File: ${txt} | Total: ${lines.length}`);

            for (const url of lines) {

                tasks.push(limit(async () => {

                    const downloadWithRetry = async (retries = 3) => {
                        try {
                            const res = await axios({
                                url,
                                method: "GET",
                                responseType: "arraybuffer",
                                timeout: 30000,
                                headers: {
                                    "User-Agent": "Mozilla/5.0"
                                }
                            });

                            const type = res.headers["content-type"] || "";

                            let ext = "jpg";
                            if (type.includes("png")) ext = "png";
                            else if (type.includes("webp")) ext = "webp";
                            else if (type.includes("gif")) ext = "gif";
                            else if (type.includes("avif")) ext = "avif";
                            else if (type.includes("jpeg")) ext = "jpg";

                            const filename = `${category}-${String(number).padStart(6, "0")}.${ext}`;
                            const filePath = path.join(outputDir, filename);

                            fs.writeFileSync(filePath, res.data);

                            console.log(`✓ ${filename}`);

                            number++;

                        } catch (err) {

                            if (retries > 0) {
                                console.log(`Retry: ${url}`);
                                return downloadWithRetry(retries - 1);
                            }

                            console.log(`✗ Failed: ${url}`);
                        }
                    };

                    return downloadWithRetry();

                }));

            }
        }

        await Promise.all(tasks);
    }

})();
