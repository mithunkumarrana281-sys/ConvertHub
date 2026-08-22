const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const uploadDir = path.join(__dirname, "uploads");
const outputDir = path.join(__dirname, "outputs");

fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });


/* =========================
   MULTER
========================= */

const upload = multer({
    dest: uploadDir,

    limits: {
        fileSize: 100 * 1024 * 1024
    }
});


/* =========================
   SUPPORTED FORMATS
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
   HOME / API STATUS
========================= */

app.get("/", (req, res) => {

    res.json({

        name: "ConvertHub API",

        status: "online",

        services: [
            "Audio Converter",
            "Image Converter",
            "Image to PDF"
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


        const outputFormat =
            String(
                req.body.format || "mp3"
            ).toLowerCase();


        if (!audioFormats.includes(outputFormat)) {

            fs.unlink(
                req.file.path,
                () => {}
            );

            return res.status(400).json({
                error: "Unsupported audio format"
            });

        }


        const input = req.file.path;


        const originalName =
            path.parse(
                req.file.originalname
            )
            .name
            .replace(
                /[^a-zA-Z0-9._-]/g,
                "_"
            );


        const output =
            path.join(
                outputDir,
                `${Date.now()}-${originalName}.${outputFormat}`
            );


        const args = [
            "-y",
            "-i",
            input
        ];


        if (outputFormat === "mp3") {

            args.push(
                "-codec:a",
                "libmp3lame",
                "-b:a",
                "192k"
            );

        }


        if (outputFormat === "wav") {

            args.push(
                "-codec:a",
                "pcm_s16le"
            );

        }


        if (outputFormat === "flac") {

            args.push(
                "-codec:a",
                "flac"
            );

        }


        if (outputFormat === "aac") {

            args.push(
                "-codec:a",
                "aac",
                "-b:a",
                "192k"
            );

        }


        if (outputFormat === "m4a") {

            args.push(
                "-codec:a",
                "aac",
                "-b:a",
                "192k"
            );

        }


        if (outputFormat === "ogg") {

            args.push(
                "-codec:a",
                "libvorbis",
                "-b:a",
                "192k"
            );

        }


        if (outputFormat === "opus") {

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

                fs.unlink(
                    input,
                    () => {}
                );


                if (error) {

                    console.error(
                        "AUDIO CONVERSION ERROR:"
                    );

                    console.error(stderr);


                    if (
                        fs.existsSync(output)
                    ) {

                        fs.unlink(
                            output,
                            () => {}
                        );

                    }


                    return res.status(500).json({
                        error:
                            "Audio conversion failed"
                    });

                }


                res.download(
                    output,
                    `${originalName}.${outputFormat}`,
                    {
                        headers: {
                            "Content-Type":
                                mimeTypes[
                                    outputFormat
                                ]
                        }
                    },
                    () => {

                        fs.unlink(
                            output,
                            () => {}
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


        const outputFormat =
            String(
                req.body.format || "png"
            ).toLowerCase();


        if (!imageFormats.includes(outputFormat)) {

            fs.unlink(
                req.file.path,
                () => {}
            );

            return res.status(400).json({
                error:
                    "Unsupported image format"
            });

        }


        const input =
            req.file.path;


        const originalName =
            path.parse(
                req.file.originalname
            )
            .name
            .replace(
                /[^a-zA-Z0-9._-]/g,
                "_"
            );


        const actualFormat =
            outputFormat === "jpeg"
                ? "jpg"
                : outputFormat;


        const output =
            path.join(
                outputDir,
                `${Date.now()}-${originalName}.${actualFormat}`
            );


        const args = [
            "-y",
            "-i",
            input,
            "-frames:v",
            "1"
        ];


        if (
            outputFormat === "jpg" ||
            outputFormat === "jpeg"
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

                fs.unlink(
                    input,
                    () => {}
                );


                if (error) {

                    console.error(
                        "IMAGE CONVERSION ERROR:"
                    );

                    console.error(error);

                    console.error(stderr);


                    if (
                        fs.existsSync(output)
                    ) {

                        fs.unlink(
                            output,
                            () => {}
                        );

                    }


                    return res.status(500).json({
                        error:
                            "Image conversion failed"
                    });

                }


                res.download(
                    output,
                    `${originalName}.${actualFormat}`,
                    {
                        headers: {
                            "Content-Type":
                                mimeTypes[
                                    actualFormat
                                ]
                        }
                    },
                    () => {

                        fs.unlink(
                            output,
                            () => {}
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


        const files = req.files;

        const convertedFiles = [];

        const pdfName =
            `converthub-${Date.now()}.pdf`;

        const pdfOutput =
            path.join(
                outputDir,
                pdfName
            );


        try {

            /*
             * Step 1:
             * Convert every uploaded image
             * to JPEG.
             */

            for (
                let i = 0;
                i < files.length;
                i++
            ) {

                const input =
                    files[i].path;


                const jpgOutput =
                    path.join(
                        outputDir,
                        `pdf-${Date.now()}-${i}.jpg`
                    );


                await new Promise(
                    (resolve, reject) => {

                        const args = [
                            "-y",
                            "-i",
                            input,

                            "-q:v",
                            "2",

                            "-frames:v",
                            "1",

                            jpgOutput
                        ];


                        execFile(
                            "ffmpeg",
                            args,
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
                                        "PDF IMAGE CONVERSION ERROR:"
                                    );

                                    console.error(
                                        stderr
                                    );

                                    reject(
                                        error
                                    );

                                    return;
                                }


                                convertedFiles.push(
                                    jpgOutput
                                );


                                resolve();

                            }
                        );

                    }
                );

            }


            /*
             * Step 2:
             * Create PDF using img2pdf.
             */

            await new Promise(
                (resolve, reject) => {

                    const args = [
                        "-o",
                        pdfOutput,
                        ...convertedFiles
                    ];


                    execFile(
                        "img2pdf",
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

                            if (error) {

                                console.error(
                                    "IMG2PDF ERROR:"
                                );

                                console.error(
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


            /*
             * Delete uploaded files
             */

            files.forEach(
                file => {

                    fs.unlink(
                        file.path,
                        () => {}
                    );

                }
            );


            /*
             * Delete temporary JPEG files
             * after PDF download.
             */

            res.download(
                pdfOutput,
                "ConvertHub-Images.pdf",
                {
                    headers: {
                        "Content-Type":
                            "application/pdf"
                    }
                },
                () => {

                    convertedFiles.forEach(
                        file => {

                            fs.unlink(
                                file,
                                () => {}
                            );

                        }
                    );


                    fs.unlink(
                        pdfOutput,
                        () => {}
                    );

                }
            );


        } catch (error) {

            console.error(
                "IMAGE TO PDF ERROR:"
            );

            console.error(error);


            /*
             * Cleanup uploaded files
             */

            files.forEach(
                file => {

                    fs.unlink(
                        file.path,
                        () => {}
                    );

                }
            );


            /*
             * Cleanup temporary JPEGs
             */

            convertedFiles.forEach(
                file => {

                    fs.unlink(
                        file,
                        () => {}
                    );

                }
            );


            if (
                fs.existsSync(pdfOutput)
            ) {

                fs.unlink(
                    pdfOutput,
                    () => {}
                );

            }


            return res.status(500).json({
                error:
                    "Could not create PDF"
            });

        }

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
