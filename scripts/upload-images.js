import fs from "fs";
import path from "path";
import axios from "axios";

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

        if (!fs.statSync(categoryPath).isDirectory()) {
            continue;
        }

        console.log(`Kategori : ${category}`);

        const outputDir = path.join(IMAGES_DIR, category);

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const txtFiles = fs.readdirSync(categoryPath)
            .filter(file => file.endsWith(".txt"));

        let number = 1;

        for (const txt of txtFiles) {

            console.log(`  File : ${txt}`);

            const lines = fs.readFileSync(
                path.join(categoryPath, txt),
                "utf8"
            )
            .split(/\r?\n/)
            .map(v => v.trim())
            .filter(Boolean);

            console.log(`  Total URL : ${lines.length}`);

            for (const url of lines) {

                console.log(`Download : ${url}`);

                try {

                    const response = await axios({
                        url,
                        method: "GET",
                        responseType: "arraybuffer",
                        timeout: 30000,
                        headers: {
                            "User-Agent": "Mozilla/5.0"
                        }
                    });

                    const contentType = response.headers["content-type"] || "";

                    let ext = "jpg";

                    if (contentType.includes("png")) ext = "png";
                    else if (contentType.includes("webp")) ext = "webp";
                    else if (contentType.includes("gif")) ext = "gif";
                    else if (contentType.includes("avif")) ext = "avif";
                    else if (contentType.includes("jpeg")) ext = "jpg";
                    else if (contentType.includes("jpg")) ext = "jpg";

                    const filename =
                        `${category}-${String(number).padStart(6, "0")}.${ext}`;

                    fs.writeFileSync(
                        path.join(outputDir, filename),
                        response.data
                    );

                    console.log(`✓ ${filename}`);

                    number++;

                } catch (err) {

                    console.log(`✗ Gagal : ${url}`);

                    if (err.response) {
                        console.log(`Status : ${err.response.status}`);
                    } else {
                        console.log(err.message);
                    }

                }

            }

        }

    }

})();
