const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, "uploads");
const outputDir = path.join(__dirname, "outputs");

fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });

const upload = multer({
    dest: uploadDir,
    limits: {
        fileSize: 100 * 1024 * 1024
    }
});


/* =========================
   FORMATS
========================= */

const audioFormats = [
    "mp3", "wav", "flac", "aac",
    "m4a", "ogg", "opus"
];

const imageFormats = [
    "jpg", "jpeg", "png",
    "webp", "bmp", "tiff"
];

const mimeTypes = {

    mp3: "audio/mpeg",
    wav: "audio/wav",
    flac: "audio/flac",
    aac: "audio/aac",
    m4a: "audio/mp4",
    ogg: "audio/ogg",
    opus: "audio/opus",

    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    bmp: "image/bmp",
    tiff: "image/tiff"
};


/* =========================
   HELPER
========================= */

function safeName(name) {

    return path.parse(name)
        .name
        .replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
        );
}


function removeFile(file) {

    if (file && fs.existsSync(file)) {
        fs.unlink(file, () => {});
    }
}


function removeFiles(files) {

    if (!files) return;

    files.forEach(file => {
        removeFile(file);
    });
}


/* =========================
   API STATUS
========================= */

app.get("/", (req, res) => {

    res.json({

        name: "ConvertHub API",

        status: "online",

        services: [
            "Audio Converter",
            "Image Converter",
            "Image to PDF",
            "PDF Merge",
            "PDF Split",
            "PDF to JPG",
            "PDF Compress"
        ]

    });

});


/* =========================
   AUDIO CONVERTER
========================= */

app.post(
    "/convert/audio",
    upload.single("file"),
    (req, res) => {

        if (!req.file) {

            return res.status(400).json({
                error: "No audio file uploaded"
            });

        }

        const format =
            String(
                req.body.format || "mp3"
            ).toLowerCase();

        if (!audioFormats.includes(format)) {

            removeFile(req.file.path);

            return res.status(400).json({
                error: "Unsupported audio format"
            });

        }

        const input = req.file.path;

        const name =
            safeName(
                req.file.originalname
            );

        const output =
            path.join(
                outputDir,
                `${Date.now()}-${name}.${format}`
            );

        const args = [
            "-y",
            "-i",
            input
        ];

        if (format === "mp3") {

            args.push(
                "-codec:a",
                "libmp3lame",
                "-b:a",
                "192k"
            );

        }

        if (format === "wav") {

            args.push(
                "-codec:a",
                "pcm_s16le"
            );

        }

        if (format === "flac") {

            args.push(
                "-codec:a",
                "flac"
            );

        }

        if (format === "aac") {

            args.push(
                "-codec:a",
                "aac",
                "-b:a",
                "192k"
            );

        }

        if (format === "m4a") {

            args.push(
                "-codec:a",
                "aac",
                "-b:a",
                "192k"
            );

        }

        if (format === "ogg") {

            args.push(
                "-codec:a",
                "libvorbis",
                "-b:a",
                "192k"
            );

        }

        if (format === "opus") {

            args.push(
                "-codec:a",
                "libopus",
                "-b:a",
                "128k"
            );

        }

        args.push(output);

        execFile(
            "ffmpeg",
            args,
            {
                timeout:
                    10 * 60 * 1000
            },
            (error, stdout, stderr) => {

                removeFile(input);

                if (error) {

                    console.error(
                        "AUDIO ERROR:",
                        stderr
                    );

                    removeFile(output);

                    return res.status(500).json({
                        error:
                            "Audio conversion failed"
                    });

                }

                res.download(
                    output,
                    `${name}.${format}`,
                    {
                        headers: {
                            "Content-Type":
                                mimeTypes[format]
                        }
                    },
                    () => {
                        removeFile(output);
                    }
                );

            }
        );

    }
);


/* =========================
   IMAGE CONVERTER
========================= */

app.post(
    "/convert/image",
    upload.single("file"),
    (req, res) => {

        if (!req.file) {

            return res.status(400).json({
                error:
                    "No image file uploaded"
            });

        }

        const format =
            String(
                req.body.format || "png"
            ).toLowerCase();

        if (!imageFormats.includes(format)) {

            removeFile(req.file.path);

            return res.status(400).json({
                error:
                    "Unsupported image format"
            });

        }

        const input = req.file.path;

        const name =
            safeName(
                req.file.originalname
            );

        const actualFormat =
            format === "jpeg"
                ? "jpg"
                : format;

        const output =
            path.join(
                outputDir,
                `${Date.now()}-${name}.${actualFormat}`
            );

        const args = [
            "-y",
            "-i",
            input,
            "-frames:v",
            "1"
        ];

        if (
            format === "jpg" ||
            format === "jpeg"
        ) {

            args.push(
                "-q:v",
                "2"
            );

        }

        args.push(output);

        execFile(
            "ffmpeg",
            args,
            {
                timeout:
                    5 * 60 * 1000
            },
            (error, stdout, stderr) => {

                removeFile(input);

                if (error) {

                    console.error(
                        "IMAGE ERROR:",
                        stderr
                    );

                    removeFile(output);

                    return res.status(500).json({
                        error:
                            "Image conversion failed"
                    });

                }

                res.download(
                    output,
                    `${name}.${actualFormat}`,
                    {
                        headers: {
                            "Content-Type":
                                mimeTypes[
                                    actualFormat
                                ]
                        }
                    },
                    () => {
                        removeFile(output);
                    }
                );

            }
        );

    }
);


/* =========================
   IMAGE TO PDF
========================= */

app.post(
    "/convert/image-to-pdf",
    upload.array("files", 20),
    async (req, res) => {

        if (
            !req.files ||
            req.files.length === 0
        ) {

            return res.status(400).json({
                error:
                    "No images uploaded"
            });

        }

        const files = req.files;

        const jpgFiles = [];

        const pdf =
            path.join(
                outputDir,
                `converthub-${Date.now()}.pdf`
            );

        try {

            for (
                let i = 0;
                i < files.length;
                i++
            ) {

                const jpg =
                    path.join(
                        outputDir,
                        `pdf-${Date.now()}-${i}.jpg`
                    );

                await new Promise(
                    (resolve, reject) => {

                        execFile(
                            "ffmpeg",
                            [
                                "-y",
                                "-i",
                                files[i].path,
                                "-q:v",
                                "2",
                                "-frames:v",
                                "1",
                                jpg
                            ],
                            {
                                timeout:
                                    2 * 60 * 1000
                            },
                            (
                                error,
                                stdout,
                                stderr
                            ) => {

                                if (error) {

                                    console.error(
                                        stderr
                                    );

                                    reject(error);

                                    return;
                                }

                                jpgFiles.push(jpg);

                                resolve();

                            }
                        );

                    }
                );

            }


            await new Promise(
                (resolve, reject) => {

                    execFile(
                        "img2pdf",
                        [
                            "-o",
                            pdf,
                            ...jpgFiles
                        ],
                        {
                            timeout:
                                5 * 60 * 1000
                        },
                        (
                            error,
                            stdout,
                            stderr
                        ) => {

                            if (error) {

                                console.error(
                                    stderr
                                );

                                reject(error);

                                return;
                            }

                            resolve();

                        }
                    );

                }
            );


            removeFiles(
                files.map(
                    file => file.path
                )
            );


            res.download(
                pdf,
                "ConvertHub-Images.pdf",
                {
                    headers: {
                        "Content-Type":
                            "application/pdf"
                    }
                },
                () => {

                    removeFiles(jpgFiles);
                    removeFile(pdf);

                }
            );


        } catch (error) {

            console.error(
                "IMAGE TO PDF ERROR:",
                error
            );

            removeFiles(
                files.map(
                    file => file.path
                )
            );

            removeFiles(jpgFiles);

            removeFile(pdf);

            return res.status(500).json({
                error:
                    "Could not create PDF"
            });

        }

    }
);


/* =========================
   PDF MERGE
========================= */

app.post(
    "/convert/pdf-merge",
    upload.array("files", 20),
    (req, res) => {

        if (
            !req.files ||
            req.files.length < 2
        ) {

            return res.status(400).json({
                error:
                    "Please upload at least 2 PDF files"
            });

        }

        const files = req.files;

        const output =
            path.join(
                outputDir,
                `merged-${Date.now()}.pdf`
            );

        const inputs =
            files.map(
                file => file.path
            );

        execFile(
            "qpdf",
            [
                "--empty",
                "--pages",
                ...inputs,
                "--",
                output
            ],
            {
                timeout:
                    5 * 60 * 1000
            },
            (error, stdout, stderr) => {

                removeFiles(inputs);

                if (error) {

                    console.error(
                        "PDF MERGE ERROR:",
                        stderr
                    );

                    removeFile(output);

                    return res.status(500).json({
                        error:
                            "PDF merge failed"
                    });

                }

                res.download(
                    output,
                    "ConvertHub-Merged.pdf",
                    {
                        headers: {
                            "Content-Type":
                                "application/pdf"
                        }
                    },
                    () => {
                        removeFile(output);
                    }
                );

            }
        );

    }
);


/* =========================
   PDF SPLIT
========================= */

app.post(
    "/convert/pdf-split",
    upload.single("file"),
    (req, res) => {

        if (!req.file) {

            return res.status(400).json({
                error:
                    "No PDF uploaded"
            });

        }

        const input =
            req.file.path;

        const outputDirSplit =
            path.join(
                outputDir,
                `split-${Date.now()}`
            );

        fs.mkdirSync(
            outputDirSplit,
            {
                recursive: true
            }
        );


        execFile(
            "pdfseparate",
            [
                input,
                path.join(
                    outputDirSplit,
                    "page-%d.pdf"
                )
            ],
            {
                timeout:
                    5 * 60 * 1000
            },
            (error, stdout, stderr) => {

                removeFile(input);

                if (error) {

                    console.error(
                        "PDF SPLIT ERROR:",
                        stderr
                    );

                    fs.rmSync(
                        outputDirSplit,
                        {
                            recursive: true,
                            force: true
                        }
                    );

                    return res.status(500).json({
                        error:
                            "PDF split failed"
                    });

                }

                /*
                 * Create ZIP using qpdf is not suitable
                 * for ZIP, so use system zip command.
                 */

                const zip =
                    `${outputDirSplit}.zip`;

                execFile(
                    "zip",
                    [
                        "-j",
                        zip,
                        path.join(
                            outputDirSplit,
                            "*.pdf"
                        )
                    ],
                    (zipError) => {

                        /*
                         * If shell wildcard does not expand,
                         * create ZIP using find-style list.
                         */

                        if (zipError) {

                            fs.rmSync(
                                outputDirSplit,
                                {
                                    recursive: true,
                                    force: true
                                }
                            );

                            removeFile(zip);

                            return res.status(500).json({
                                error:
                                    "Could not package split PDF"
                            });

                        }

                        res.download(
                            zip,
                            "ConvertHub-Split-PDF.zip",
                            () => {

                                fs.rmSync(
                                    outputDirSplit,
                                    {
                                        recursive: true,
                                        force: true
                                    }
                                );

                                removeFile(zip);

                            }
                        );

                    }
                );

            }
        );

    }
);


/* =========================
   PDF TO JPG
========================= */

app.post(
    "/convert/pdf-to-jpg",
    upload.single("file"),
    (req, res) => {

        if (!req.file) {

            return res.status(400).json({
                error:
                    "No PDF uploaded"
            });

        }

        const input =
            req.file.path;

        const folder =
            path.join(
                outputDir,
                `pdfjpg-${Date.now()}`
            );

        fs.mkdirSync(
            folder,
            {
                recursive: true
            }
        );

        const prefix =
            path.join(
                folder,
                "page"
            );


        execFile(
            "pdftoppm",
            [
                "-jpeg",
                "-r",
                "150",
                input,
                prefix
            ],
            {
                timeout:
                    10 * 60 * 1000
            },
            (error, stdout, stderr) => {

                removeFile(input);

                if (error) {

                    console.error(
                        "PDF TO JPG ERROR:",
                        stderr
                    );

                    fs.rmSync(
                        folder,
                        {
                            recursive: true,
                            force: true
                        }
                    );

                    return res.status(500).json({
                        error:
                            "PDF to JPG failed"
                    });

                }

                /*
                 * Return the first page for now.
                 * Multi-page ZIP can be added in frontend/backend
                 * as a separate option.
                 */

                const firstPage =
                    path.join(
                        folder,
                        "page-1.jpg"
                    );

                if (
                    !fs.existsSync(firstPage)
                ) {

                    fs.rmSync(
                        folder,
                        {
                            recursive: true,
                            force: true
                        }
                    );

                    return res.status(500).json({
                        error:
                            "Could not create JPG"
                    });

                }

                res.download(
                    firstPage,
                    "ConvertHub-Page-1.jpg",
                    () => {

                        fs.rmSync(
                            folder,
                            {
                                recursive: true,
                                force: true
                            }
                        );

                    }
                );

            }
        );

    }
);


/* =========================
   PDF COMPRESS
========================= */

app.post(
    "/convert/pdf-compress",
    upload.single("file"),
    (req, res) => {

        if (!req.file) {

            return res.status(400).json({
                error:
                    "No PDF uploaded"
            });

        }

        const input =
            req.file.path;

        const output =
            path.join(
                outputDir,
                `compressed-${Date.now()}.pdf`
            );


        execFile(
            "gs",
            [
                "-sDEVICE=pdfwrite",
                "-dCompatibilityLevel=1.4",
                "-dPDFSETTINGS=/ebook",
                "-dNOPAUSE",
                "-dQUIET",
                "-dBATCH",
                `-sOutputFile=${output}`,
                input
            ],
            {
                timeout:
                    10 * 60 * 1000
            },
            (error, stdout, stderr) => {

                removeFile(input);

                if (error) {

                    console.error(
                        "PDF COMPRESS ERROR:",
                        stderr
                    );

                    removeFile(output);

                    return res.status(500).json({
                        error:
                            "PDF compression failed"
                    });

                }

                res.download(
                    output,
                    "ConvertHub-Compressed.pdf",
                    {
                        headers: {
                            "Content-Type":
                                "application/pdf"
                        }
                    },
                    () => {
                        removeFile(output);
                    }
                );

            }
        );

    }
);


/* =========================
   START SERVER
========================= */

app.listen(
    PORT,
    () => {

        console.log(
            `ConvertHub API running on port ${PORT}`
        );

    }
);
