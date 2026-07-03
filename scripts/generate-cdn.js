import fs from "fs";
import path from "path";

/*
|--------------------------------------------------------------------------
| CONFIG
|--------------------------------------------------------------------------
*/

const IMAGES_DIR = "./images";
const OUTPUT_DIR = "./urls-generated";

const BASE_CDN =
    "https://cdn.jsdelivr.net/gh/brodlov/cdn/";

if (!fs.existsSync(OUTPUT_DIR)) {

    fs.mkdirSync(OUTPUT_DIR, {
        recursive: true
    });

}

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

function naturalSort(a, b) {

    return a.localeCompare(
        b,
        undefined,
        {
            numeric: true,
            sensitivity: "base"
        }
    );

}

function isImage(file) {

    return /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(file);

}


/*
|--------------------------------------------------------------------------
| Read CHANGED_FILES
|--------------------------------------------------------------------------
*/

const changedFiles = (process.env.CHANGED_FILES || "")
    .split(/\r?\n/)
    .map(v => v.trim())
    .filter(Boolean);


/*
|--------------------------------------------------------------------------
| Manual Workflow
|--------------------------------------------------------------------------
*/

if (changedFiles.length === 0) {

    console.log("Manual workflow");

    function scanTxt(dir) {

        const items = fs.readdirSync(dir);

        for (const item of items) {

            const full = path.join(dir, item);

            const stat = fs.statSync(full);

            if (stat.isDirectory()) {

                scanTxt(full);

            }

            else if (item.endsWith(".txt")) {

                changedFiles.push(
                    full.replace(/\\/g, "/")
                );

            }

        }

    }

    scanTxt("./urls");

}


const jobs = [];

for (const txt of changedFiles) {

    const relative =
        txt.replace(/^urls[\\/]/, "");

    const parts =
        relative.split(/[\\/]/);

    const category =
        slugify(parts[0]);

    const page =
        slugify(path.parse(parts[1]).name);

    jobs.push({

        category,

        page

    });

}


console.log("");

console.log("Generate CDN");

console.log("");

for (const job of jobs) {

    console.log(

        `${job.category}/${job.page}`

    );

}


/*
|--------------------------------------------------------------------------
| Generate CDN URL Lists
|--------------------------------------------------------------------------
*/

for (const job of jobs) {

    const imageDir = path.join(

        IMAGES_DIR,

        job.category,

        job.page

    );

    if (!fs.existsSync(imageDir)) {

        console.log(

            `Skip (folder not found): ${imageDir}`

        );

        continue;

    }

    const files = fs.readdirSync(imageDir)

        .filter(file => isImage(file))

        .sort(naturalSort);

    const urls = [];

    for (const file of files) {

        const relativePath = path.join(

            "images",

            job.category,

            job.page,

            file

        ).replace(/\\/g, "/");

        urls.push(

            BASE_CDN + relativePath

        );

    }

    const outputFile = path.join(

        OUTPUT_DIR,

        `${job.category}-${job.page}.txt`

    );

    fs.writeFileSync(

        outputFile,

        urls.join("\n")

    );

    console.log(

        `✓ ${outputFile}`

    );

}


/*
|--------------------------------------------------------------------------
| Finish
|--------------------------------------------------------------------------
*/

console.log("");

console.log("================================");

console.log("CDN generation completed.");

console.log("================================");

console.log("");
