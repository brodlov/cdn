import fs from "fs";
import path from "path";
import axios from "axios";
import pLimit from "p-limit";

/*
|--------------------------------------------------------------------------
| CONFIG
|--------------------------------------------------------------------------
*/

const URLS_DIR = "./urls";
const IMAGES_DIR = "./images";

const CONCURRENCY = 5;

const limit = pLimit(CONCURRENCY);

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function slugify(text) {

    return text
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");

}

function ensureDir(dir) {

    if (!fs.existsSync(dir)) {

        fs.mkdirSync(dir, {
            recursive: true
        });

    }

}

function getNextNumber(dir, prefix) {

    if (!fs.existsSync(dir)) {
        return 1;
    }

    const files = fs.readdirSync(dir);

    let max = 0;

    for (const file of files) {

        const match = file.match(
            new RegExp(`^${prefix}-(\\d+)`, "i")
        );

        if (!match) continue;

        const num = Number(match[1]);

        if (num > max) {
            max = num;
        }

    }

    return max + 1;

}

/*
|--------------------------------------------------------------------------
| Images folder
|--------------------------------------------------------------------------
*/

ensureDir(IMAGES_DIR);

/*
|--------------------------------------------------------------------------
| Read CHANGED_FILES
|--------------------------------------------------------------------------
|
| GitHub Actions akan mengirim:
|
| urls/HomeDecorBitluxy59/Living Room.txt
| urls/HomeDecorBitluxy59/Kitchen.txt
|
|--------------------------------------------------------------------------
*/

const changedFiles = (process.env.CHANGED_FILES || "")
    .split(/\r?\n/)
    .map(v => v.trim())
    .filter(Boolean);

/*
|--------------------------------------------------------------------------
| Manual Workflow Support
|--------------------------------------------------------------------------
|
| Jika CHANGED_FILES kosong berarti workflow dijalankan manual.
| Maka semua file txt di folder urls akan diproses.
|
|--------------------------------------------------------------------------
*/

if (changedFiles.length === 0) {

    console.log("");
    console.log("Manual workflow detected.");
    console.log("Scanning all txt files...");
    console.log("");

    function scanTxt(dir) {

        const items = fs.readdirSync(dir);

        for (const item of items) {

            const fullPath = path.join(dir, item);

            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {

                scanTxt(fullPath);

            }

            else if (item.toLowerCase().endsWith(".txt")) {

                changedFiles.push(
                    fullPath.replace(/\\/g, "/")
                );

            }

        }

    }

    scanTxt(URLS_DIR);

}

/*
|--------------------------------------------------------------------------
| Show changed files
|--------------------------------------------------------------------------
*/

console.log("");
console.log("========== Changed Files ==========");

for (const file of changedFiles) {

    console.log(file);

}

console.log("==================================");
console.log("");

/*
|--------------------------------------------------------------------------
| Build Jobs
|--------------------------------------------------------------------------
|
| Mengubah:
|
| urls/HomeDecorBitluxy59/Living Room.txt
|
| menjadi
|
| {
|    category:"HomeDecorBitluxy59",
|    categorySlug:"homedecorbitluxy59",
|    page:"Living Room",
|    pageSlug:"living-room",
|    txtPath:"urls/HomeDecorBitluxy59/Living Room.txt"
| }
|
|--------------------------------------------------------------------------
*/

const jobs = [];

for (const txtPath of changedFiles) {

    const relative = txtPath.replace(/^urls[\\/]/, "");

    const parts = relative.split(/[\\/]/);

    if (parts.length < 2) {

        console.log(`Skip invalid path: ${txtPath}`);

        continue;

    }

    const category = parts[0];

    const txtFile = parts.slice(1).join("/");

    const page = path.parse(txtFile).name;

    jobs.push({

        category,

        categorySlug: slugify(category),

        page,

        pageSlug: slugify(page),

        txtPath

    });

}

/*
|--------------------------------------------------------------------------
| Show Jobs
|--------------------------------------------------------------------------
*/

console.log("");
console.log("========== Jobs ==========");

for (const job of jobs) {

    console.log("");

    console.log("Category :", job.category);

    console.log("Page     :", job.page);

    console.log("TXT      :", job.txtPath);

}

console.log("");
console.log("==========================");
console.log("");


/*
|--------------------------------------------------------------------------
| Prepare Download Jobs
|--------------------------------------------------------------------------
*/

const downloadJobs = [];

for (const job of jobs) {

    console.log("");
    console.log(`Reading : ${job.txtPath}`);

    const lines = fs.readFileSync(
        job.txtPath,
        "utf8"
    )
    .split(/\r?\n/)
    .map(v => v.trim())
    .filter(Boolean);

    const outputDir = path.join(
        IMAGES_DIR,
        job.categorySlug,
        job.pageSlug
    );

    ensureDir(outputDir);

    let nextNumber = getNextNumber(
        outputDir,
        job.pageSlug
    );

    for (const url of lines) {

        downloadJobs.push({
        
            url,
        
            outputDir,
        
            pageSlug: job.pageSlug,
        
            number: nextNumber++
        
        });
        
    }

    console.log(
        `Found ${lines.length} image URLs`
    );

}

/*
|--------------------------------------------------------------------------
| Summary
|--------------------------------------------------------------------------
*/

console.log("");

console.log("========== Download Jobs ==========");

console.log(
    `Total Jobs : ${downloadJobs.length}`
);

console.log("");

console.log("===================================");

console.log("");


/*
|--------------------------------------------------------------------------
| Download Images
|--------------------------------------------------------------------------
*/

async function downloadImage(job) {

    const downloadWithRetry = async (retry = 3) => {

        try {

            const response = await axios({

                url: job.url,

                method: "GET",

                responseType: "arraybuffer",

                timeout: 30000,

                headers: {
                    "User-Agent": "Mozilla/5.0"
                }

            });

            const contentType =
                response.headers["content-type"] || "";

            let ext = "jpg";

            if (contentType.includes("png")) ext = "png";
            else if (contentType.includes("webp")) ext = "webp";
            else if (contentType.includes("gif")) ext = "gif";
            else if (contentType.includes("avif")) ext = "avif";
            else if (contentType.includes("jpeg")) ext = "jpg";

            const filename =
                `${job.pageSlug}-${String(job.number).padStart(4, "0")}.${ext}`;

            const filePath =
                path.join(job.outputDir, filename);

            if (fs.existsSync(filePath)) {

                console.log(`Skip : ${filename}`);

                return;

            }

            fs.writeFileSync(
                filePath,
                response.data
            );

            console.log(`✓ ${filename}`);

        }

        catch (err) {

            if (retry > 0) {

                console.log(
                    `Retry (${retry}) : ${job.url}`
                );

                return downloadWithRetry(retry - 1);

            }

            console.log(`✗ Failed : ${job.url}`);

        }

    };

    return downloadWithRetry();

}


/*
|--------------------------------------------------------------------------
| Run Downloads
|--------------------------------------------------------------------------
*/

console.log("");
console.log("Starting downloads...");
console.log("");

await Promise.all(

    downloadJobs.map(job =>
        limit(() => downloadImage(job))
    )

);

console.log("");
console.log("Downloads completed.");
console.log("");


