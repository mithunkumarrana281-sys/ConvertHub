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


/* =========================
   DIRECTORIES
========================= */

const uploadDir =
    path.join(__dirname, "uploads");

const outputDir =
    path.join(__dirname, "outputs");

fs.mkdirSync(
    uploadDir,
    { recursive: true }
);

fs.mkdirSync(
    outputDir,
    { recursive: true }
);


/* =========================
   MULTER
========================= */

const upload = multer({

    dest: uploadDir,

    limits: {
        fileSize:
            100 * 1024 * 1024
    }

});


/* =========================
   FORMATS
========================= */

const audioFormats = [
    "mp3",
    "wav",
    "flac",
    "aac",
    "m4a",
    "ogg",
    "opus"
];

const imageFormats = [
    "jpg",
    "jpeg",
    "png",
    "webp",
    "bmp",
    "tiff"
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
   HELPERS
========================= */

function safeName(name) {

    return path
        .parse(name)
        .name
        .replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
        );

}


function removeFile(file) {

    if (
        file &&
        fs.existsSync(file)
    ) {

        try {

            fs.unlinkSync(file);

        } catch (error) {

            console.error(
                "File delete error:",
                error.message
            );

        }

    }

}


function removeFiles(files) {

    if (!Array.isArray(files)) {
        return;
    }

    files.forEach(
        file => removeFile(file)
    );

}


function removeDirectory(dir) {

    if (
        dir &&
        fs.existsSync(dir)
    ) {

        try {

            fs.rmSync(
                dir,
                {
                    recursive: true,
                    force: true
                }
            );

        } catch (error) {

            console.error(
                "Directory delete error:",
                error.message
            );

        }

    }

}


/* =========================
   RUN GHOSTSCRIPT
========================= */

function runGhostscript(
    input,
    output,
    settings
) {

    return new Promise(
        (resolve, reject) => {

            const args = [

                "-sDEVICE=pdfwrite",

                "-dCompatibilityLevel=1.4",

                "-dNOPAUSE",

                "-dBATCH",

                "-dQUIET",

                "-dDetectDuplicateImages=true",

                "-dCompressFonts=true",

                "-dSubsetFonts=true",

                "-dEmbedAllFonts=true",

                "-dAutoRotatePages=/None",

                "-dUseFlateCompression=true",

                "-dDownsampleColorImages=true",

                "-dDownsampleGrayImages=true",

                "-dDownsampleMonoImages=true",

                `-dColorImageResolution=${settings.colorDpi}`,

                `-dGrayImageResolution=${settings.grayDpi}`,

                `-dMonoImageResolution=${settings.monoDpi}`,

                "-dColorImageDownsampleType=/Bicubic",

                "-dGrayImageDownsampleType=/Bicubic",

                "-dMonoImageDownsampleType=/Subsample",

                "-dAutoFilterColorImages=false",

                "-dAutoFilterGrayImages=false",

                "-dColorImageFilter=/DCTEncode",

                "-dGrayImageFilter=/DCTEncode",

                `-dJPEGQ=${settings.jpegQuality}`,

                "-dEncodeColorImages=true",

                "-dEncodeGrayImages=true",

                `-sOutputFile=${output}`,

                input

            ];


            execFile(
                "gs",
                args,
                {
                    timeout:
                        10 * 60 * 1000
                },
                (
                    error,
                    stdout,
                    stderr
                ) => {

                    if (error) {

                        console.error(
                            "Ghostscript error:",
                            stderr
                        );

                        reject(error);

                        return;
                    }


                    if (
                        !fs.existsSync(
                            output
                        )
                    ) {

                        reject(
                            new Error(
                                "Ghostscript did not create output"
                            )
                        );

                        return;
                    }


                    resolve();

                }
            );

        }
    );

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

                error:
                    "No audio file uploaded"

            });

        }


        const format =
            String(
                req.body.format ||
                "mp3"
            ).toLowerCase();


        if (
            !audioFormats.includes(format)
        ) {

            removeFile(
                req.file.path
            );

            return res.status(400).json({

                error:
                    "Unsupported audio format"

            });

        }


        const input =
            req.file.path;


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
            (
                error,
                stdout,
                stderr
            ) => {

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

                        removeFile(
                            output
                        );

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
                req.body.format ||
                "png"
            ).toLowerCase();


        if (
            !imageFormats.includes(format)
        ) {

            removeFile(
                req.file.path
            );

            return res.status(400).json({

                error:
                    "Unsupported image format"

            });

        }


        const input =
            req.file.path;


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
            (
                error,
                stdout,
                stderr
            ) => {

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

                        removeFile(
                            output
                        );

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


        const files =
            req.files;


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
                                        "PDF IMAGE ERROR:",
                                        stderr
                                    );

                                    reject(
                                        error
                                    );

                                    return;
                                }


                                jpgFiles.push(
                                    jpg
                                );


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
                                    "IMG2PDF ERROR:",
                                    stderr
                                );

                                reject(
                                    error
                                );

                                return;
                            }


                            resolve();

                        }
                    );

                }
            );


            removeFiles(
                files.map(
                    file =>
                        file.path
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

                    removeFiles(
                        jpgFiles
                    );

                    removeFile(
                        pdf
                    );

                }
            );


        } catch (error) {

            console.error(
                "IMAGE TO PDF ERROR:",
                error
            );


            removeFiles(
                files.map(
                    file =>
                        file.path
                )
            );


            removeFiles(
                jpgFiles
            );


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

            removeFiles(
                (req.files || [])
                    .map(
                        file =>
                            file.path
                    )
            );


            return res.status(400).json({

                error:
                    "Please upload at least 2 PDF files"

            });

        }


        const files =
            req.files;


        const inputs =
            files.map(
                file =>
                    file.path
            );


        const output =
            path.join(
                outputDir,
                `merged-${Date.now()}.pdf`
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
            (
                error,
                stdout,
                stderr
            ) => {

                removeFiles(
                    inputs
                );


                if (error) {

                    console.error(
                        "PDF MERGE ERROR:",
                        stderr
                    );

                    removeFile(
                        output
                    );

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

                        removeFile(
                            output
                        );

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


        const splitDir =
            path.join(
                outputDir,
                `split-${Date.now()}`
            );


        fs.mkdirSync(
            splitDir,
            {
                recursive: true
            }
        );


        execFile(
            "pdfseparate",
            [

                input,
                path.join(
                    splitDir,
                    "page-%d.pdf"
                )

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

                removeFile(input);


                if (error) {

                    console.error(
                        "PDF SPLIT ERROR:",
                        stderr
                    );

                    removeDirectory(
                        splitDir
                    );

                    return res.status(500).json({

                        error:
                            "PDF split failed"

                    });

                }


                const zip =
                    `${splitDir}.zip`;


                const pageFiles =
                    fs.readdirSync(
                        splitDir
                    )
                    .filter(
                        file =>
                            file
                                .toLowerCase()
                                .endsWith(".pdf")
                    )
                    .map(
                        file =>
                            path.join(
                                splitDir,
                                file
                            )
                    );


                if (
                    pageFiles.length === 0
                ) {

                    removeDirectory(
                        splitDir
                    );

                    return res.status(500).json({

                        error:
                            "No PDF pages were created"

                    });

                }


                execFile(
                    "zip",
                    [

                        "-j",
                        zip,
                        ...pageFiles

                    ],
                    {
                        timeout:
                            5 * 60 * 1000
                    },
                    (
                        zipError,
                        stdout,
                        stderr
                    ) => {

                        removeDirectory(
                            splitDir
                        );


                        if (zipError) {

                            console.error(
                                "ZIP ERROR:",
                                stderr
                            );

                            removeFile(
                                zip
                            );

                            return res.status(500).json({

                                error:
                                    "Could not create ZIP file"

                            });

                        }


                        res.download(
                            zip,
                            "ConvertHub-Split-PDF.zip",
                            {
                                headers: {

                                    "Content-Type":
                                        "application/zip"

                                }
                            },
                            () => {

                                removeFile(
                                    zip
                                );

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
            (
                error,
                stdout,
                stderr
            ) => {

                removeFile(input);


                if (error) {

                    console.error(
                        "PDF TO JPG ERROR:",
                        stderr
                    );

                    removeDirectory(
                        folder
                    );

                    return res.status(500).json({

                        error:
                            "PDF to JPG failed"

                    });

                }


                const firstPage =
                    path.join(
                        folder,
                        "page-1.jpg"
                    );


                if (
                    !fs.existsSync(
                        firstPage
                    )
                ) {

                    removeDirectory(
                        folder
                    );

                    return res.status(500).json({

                        error:
                            "Could not create JPG"

                    });

                }


                res.download(
                    firstPage,
                    "ConvertHub-Page-1.jpg",
                    {
                        headers: {

                            "Content-Type":
                                "image/jpeg"

                        }
                    },
                    () => {

                        removeDirectory(
                            folder
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
    async (req, res) => {

        if (!req.file) {

            return res.status(400).json({

                error:
                    "No PDF uploaded"

            });

        }


        const input =
            req.file.path;


        let originalSize;


        try {

            originalSize =
                fs.statSync(
                    input
                ).size;

        } catch (error) {

            removeFile(input);

            return res.status(500).json({

                error:
                    "Could not read PDF"

            });

        }


        const mode =
            String(
                req.body.mode ||
                "auto"
            ).toLowerCase();


        const quality =
            String(
                req.body.quality ||
                "medium"
            ).toLowerCase();


        const targetBytes =
            Number(
                req.body.targetBytes ||
                0
            );


        /*
         * =========================
         * COMPRESSION PROFILES
         * =========================
         *
         * More aggressive than the
         * previous version.
         *
         * Lower DPI + lower JPEGQ
         * = smaller scanned PDFs.
         */

        const profiles = [

            {
                name: "high",
                colorDpi: 170,
                grayDpi: 170,
                monoDpi: 200,
                jpegQuality: 80
            },

            {
                name: "balanced-high",
                colorDpi: 150,
                grayDpi: 150,
                monoDpi: 180,
                jpegQuality: 70
            },

            {
                name: "balanced",
                colorDpi: 120,
                grayDpi: 120,
                monoDpi: 160,
                jpegQuality: 60
            },

            {
                name: "medium",
                colorDpi: 100,
                grayDpi: 100,
                monoDpi: 140,
                jpegQuality: 50
            },

            {
                name: "strong",
                colorDpi: 85,
                grayDpi: 85,
                monoDpi: 120,
                jpegQuality: 40
            },

            {
                name: "very-strong",
                colorDpi: 72,
                grayDpi: 72,
                monoDpi: 100,
                jpegQuality: 30
            },

            {
                name: "maximum",
                colorDpi: 60,
                grayDpi: 60,
                monoDpi: 80,
                jpegQuality: 20
            }

        ];


        const candidates = [];


        try {

            /*
             * =========================
             * TARGET VALIDATION
             * =========================
             */

            if (
                mode === "target" &&
                targetBytes > 0 &&
                targetBytes >= originalSize
            ) {

                const originalData =
                    fs.readFileSync(
                        input
                    );


                removeFile(input);


                res.setHeader(
                    "Content-Type",
                    "application/pdf"
                );


                res.setHeader(
                    "Content-Disposition",
                    'attachment; filename="ConvertHub-Compressed.pdf"'
                );


                return res.send(
                    originalData
                );

            }


            /*
             * =========================
             * TARGET MODE
             * =========================
             */

            if (
                mode === "target" &&
                targetBytes > 0
            ) {

                console.log(
                    "PDF TARGET:",
                    targetBytes,
                    "bytes"
                );


                /*
                 * Run every compression profile.
                 */

                for (
                    let i = 0;
                    i < profiles.length;
                    i++
                ) {

                    const profile =
                        profiles[i];


                    const output =
                        path.join(
                            outputDir,
                            `pdf-compress-${Date.now()}-${i}.pdf`
                        );


                    try {

                        await runGhostscript(
                            input,
                            output,
                            profile
                        );


                        if (
                            fs.existsSync(
                                output
                            )
                        ) {

                            const size =
                                fs.statSync(
                                    output
                                ).size;


                            console.log(
                                "Compression profile:",
                                profile.name,
                                "=>",
                                size,
                                "bytes"
                            );


                            /*
                             * Only keep files that
                             * are smaller than original.
                             */

                            if (
                                size <
                                originalSize
                            ) {

                                candidates.push({

                                    path:
                                        output,

                                    size:
                                        size,

                                    profile:
                                        profile.name

                                });

                            } else {

                                removeFile(
                                    output
                                );

                            }

                        }

                    } catch (error) {

                        console.error(
                            "Profile failed:",
                            profile.name,
                            error.message
                        );

                        removeFile(
                            output
                        );

                    }

                }


                /*
                 * No compression worked.
                 */

                if (
                    candidates.length === 0
                ) {

                    const originalData =
                        fs.readFileSync(
                            input
                        );


                    removeFile(input);


                    return sendPDFBuffer(
                        res,
                        originalData
                    );

                }


                /*
                 * First choice:
                 *
                 * Largest candidate that is
                 * <= target.
                 *
                 * This gives the best quality
                 * while staying under target.
                 */

                const underTarget =
                    candidates
                        .filter(
                            item =>
                                item.size <=
                                targetBytes
                        )
                        .sort(
                            (a, b) =>
                                b.size -
                                a.size
                        );


                let best;


                if (
                    underTarget.length > 0
                ) {

                    best =
                        underTarget[0];


                    console.log(
                        "Target achieved:",
                        best.size,
                        "bytes"
                    );

                } else {

                    /*
                     * Target could not be reached.
                     *
                     * Use the smallest file
                     * available.
                     */

                    best =
                        candidates
                            .sort(
                                (a, b) =>
                                    a.size -
                                    b.size
                            )[0];


                    console.log(
                        "Target not reached.",
                        "Smallest:",
                        best.size
                    );

                }


                /*
                 * Remove all other candidates.
                 */

                candidates.forEach(
                    candidate => {

                        if (
                            candidate.path !==
                            best.path
                        ) {

                            removeFile(
                                candidate.path
                            );

                        }

                    }
                );


                removeFile(
                    input
                );


                return res.download(
                    best.path,
                    "ConvertHub-Compressed.pdf",
                    {
                        headers: {

                            "Content-Type":
                                "application/pdf"

                        }
                    },
                    () => {

                        removeFile(
                            best.path
                        );

                    }
                );

            }


            /*
             * =========================
             * AUTO MODE
             * =========================
             */

            let selectedProfile;


            if (
                quality === "high"
            ) {

                selectedProfile =
                    profiles[0];

            } else if (
                quality === "low"
            ) {

                selectedProfile =
                    profiles[5];

            } else {

                selectedProfile =
                    profiles[2];

            }


            const output =
                path.join(
                    outputDir,
                    `auto-compressed-${Date.now()}.pdf`
                );


            await runGhostscript(
                input,
                output,
                selectedProfile
            );


            const newSize =
                fs.statSync(
                    output
                ).size;


            /*
             * Never return a larger PDF.
             */

            if (
                newSize >=
                originalSize
            ) {

                const originalData =
                    fs.readFileSync(
                        input
                    );


                removeFile(input);
                removeFile(output);


                return sendPDFBuffer(
                    res,
                    originalData
                );

            }


            removeFile(input);


            return res.download(
                output,
                "ConvertHub-Compressed.pdf",
                {
                    headers: {

                        "Content-Type":
                            "application/pdf"

                    }
                },
                () => {

                    removeFile(
                        output
                    );

                }
            );


        } catch (error) {

            console.error(
                "PDF COMPRESS ERROR:",
                error
            );


            removeFile(
                input
            );


            candidates.forEach(
                candidate => {

                    removeFile(
                        candidate.path
                    );

                }
            );


            return res.status(500).json({

                error:
                    "PDF compression failed"

            });

        }

    }
);


/* =========================
   SEND PDF BUFFER
========================= */

function sendPDFBuffer(
    res,
    buffer
) {

    res.setHeader(
        "Content-Type",
        "application/pdf"
    );

    res.setHeader(
        "Content-Disposition",
        'attachment; filename="ConvertHub-Compressed.pdf"'
    );

    return res.send(
        buffer
    );

}


/* =========================
   ERROR HANDLER
========================= */

app.use(
    (
        error,
        req,
        res,
        next
    ) => {

        console.error(
            "SERVER ERROR:",
            error
        );


        if (
            error &&
            error.code ===
                "LIMIT_FILE_SIZE"
        ) {

            return res.status(413).json({

                error:
                    "File is too large. Maximum size is 100 MB."

            });

        }


        return res.status(500).json({

            error:
                "Something went wrong on the server."

        });

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
