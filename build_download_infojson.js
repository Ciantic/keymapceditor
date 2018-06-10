// @ts-check

// Maintains a cache of all info.json files in /.~info.json.cache/ directory
// (Downloads only the missing info.json files)

const request = require("request-promise");
const fs = require("fs");
const path = require("path");

const INFO_JSON_CACHE_DIR = ".~info.json.cache";

/**
 * Chunking (immutable)
 *
 * @template T
 * @param arr {T[]}
 * @param size {number}
 * @return T[]
 */
const chunk = (arr, size) => {
    let copy = [...arr];
    let results = [];
    while (copy.length) results.push(copy.splice(0, size));
    return results;
};

/**
 * Convert URL to filename
 * @param url {string}
 */
const urlToFilename = url => {
    return url.replace(/[^a-z0-9.]+/gi, "_");
};

/**
 * Request URL by GET
 *
 * @param {string} url
 */
const get = url => {
    return request.get({
        headers: {
            "User-Agent": "Request",
        },
        url: url,
        json: true,
    });
};

/**
 * Main program
 *
 * @returns {Promise<{[key: string]: any}>}
 */
const getInfoJsonMap = async (clearCache = false) => {
    console.log("Downloading info.json listing from GitHub...");
    /** @type {{items: {html_url: string}[]}[]} */
    let searchResults = await Promise.all([
        get(
            "https://api.github.com/search/code?q=filename:info.json+repo:qmk/qmk_firmware&per_page=100"
        ),
        get(
            "https://api.github.com/search/code?q=filename:info.json+repo:qmk/qmk_firmware&per_page=100&page=2"
        ),
    ]);

    /** @type {string[]} */
    let urls = [];

    // Get raw GitHub urls to the info.json contents
    searchResults.forEach(result => {
        urls.push(
            ...result.items.map(item =>
                // Convert html_url to raw github url for download
                item.html_url
                    .replace("https://github.com", "https://raw.githubusercontent.com")
                    .replace("/blob", "")
            )
        );
    });

    // Existing downloads
    if (!fs.existsSync(INFO_JSON_CACHE_DIR)) fs.mkdirSync(INFO_JSON_CACHE_DIR);
    let files = fs.readdirSync(INFO_JSON_CACHE_DIR);

    // Clear the cache on demand
    if (clearCache) {
        console.log("Clearing the info.json cache...");
        files.forEach(t => fs.unlinkSync(path.join(INFO_JSON_CACHE_DIR, t)));
        files = [];
    }

    /** @type {string[]} */
    let downloadedFiles = [];

    console.log("Downloading the missing files...");

    // Download urls with 10 in parallel
    for (const downloadGroup of chunk(urls, 10)) {
        // Blocks until 10 is downloaded
        await Promise.all(
            downloadGroup
                .map(t => ({
                    url: t,
                    cacheFilename: urlToFilename(t),
                }))

                // Only if cached file is missing
                .filter(f => files.indexOf(f.cacheFilename) === -1)

                // Then download and store to cache
                .map(r =>
                    get(r.url).then(infoJson => {
                        // TODO: It would be possible to validate INFO.json file here
                        fs.writeFileSync(
                            path.join(INFO_JSON_CACHE_DIR, r.cacheFilename),
                            JSON.stringify({
                                url: r.url,
                                infoJson: infoJson,
                                keymapUrl: r.url, // TODO: CONVERT TO KEYMAP URL
                            })
                        );
                        downloadedFiles.push(r.url);
                    })
                )
        );
    }
    console.log("Downloaded info.json files:", downloadedFiles.length);
    console.log("Cached info.json files:", files.length);

    // Returns the filepaths to the info.json files
    /** @type {[string, Object][]} */
    let infoJsonFiles = fs
        .readdirSync(INFO_JSON_CACHE_DIR)
        .map(cachedFilename => {
            let fileContents = fs.readFileSync(
                path.join(INFO_JSON_CACHE_DIR, cachedFilename),
                "utf8"
            );
            /** @type {{url: string; infoJson: any; keymapUrl: string}} */
            let parsed;
            try {
                parsed = JSON.parse(fileContents);
            } catch (e) {
                console.error("Unable to parse info.json file: ", cachedFilename);
                console.log("Continuing regardless of error...");
                return;
            }

            let keyMatch = parsed.url.match(/keyboards\/(.*?)\/info.json/);
            if (!keyMatch) {
                console.log("Discarding info.json file, not in keyboards: ", cachedFilename);
                return;
            }

            if (!parsed.infoJson.keyboard_name) {
                console.log("Discarding info.json file, no name: ", cachedFilename);
                return;
            }

            /** @type {[string, Object]} */
            let result = [
                keyMatch[1],
                {
                    ...parsed.infoJson,
                    _defaultKeymapUrl: parsed.keymapUrl.replace(
                        "info.json",
                        "keymaps/default/keymap.c"
                    ),
                },
            ];
            return result;
        })
        .filter(t => t);

    let infoJsonMap = {};
    infoJsonFiles.sort((a, b) => (a[0] > b[0] ? 1 : a[0] === b[0] ? 0 : -1));
    infoJsonFiles.forEach(([key, infoJson]) => {
        infoJsonMap[key] = infoJson;
    });
    return infoJsonMap;
};

module.exports = {
    getInfoJsonMap: getInfoJsonMap,
};

// Ran as an individual script
if (require.main === module) {
    (async () => {
        console.log("This script downloads info.json files from QMK repository to a local cache");
        console.log("Help: Run with --clear-cache to empty the cache first (forces redownload)");
        try {
            await getInfoJsonMap(process.argv.indexOf("--clear-cache") !== -1);
        } catch (err) {
            console.error(err);
            console.error("Died with error code 1");
            process.exit(1);
        }
        console.log("Done, no errors");
    })();
}
