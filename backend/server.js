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

const upload = multer({
    dest: uploadDir,
    limits: {
        fileSize: 100 * 1024 * 1024
    }
});

const allowedFormats = [
    "mp3",
    "wav",
    "flac",
    "aac",
    "m4a",
    "ogg",
    "opus"
];

const mimeTypes = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    flac: "audio/flac",
    aac: "audio/aac",
    m4a: "audio/mp4",
    ogg: "audio/ogg",
    opus: "audio/opus"
};

app.get("/", (req, res) => {
    res.json({
        name: "ConvertHub API",
        status: "online",
        service: "Audio Converter"
    });
});

app.post("/convert/audio", upload.single("file"), (req, res) => {

    if (!req.file) {
        return res.status(400).json({
            error: "No file uploaded"
        });
    }

    const outputFormat = String(req.body.format || "mp3").toLowerCase();

    if (!allowedFormats.includes(outputFormat)) {
        fs.unlink(req.file.path, () => {});

        return res.status(400).json({
            error: "Unsupported output format"
        });
    }

    const input = req.file.path;

    const originalName = path.parse(req.file.originalname).name
        .replace(/[^a-zA-Z0-9._-]/g, "_");

    const output = path.join(
        outputDir,
        `${Date.now()}-${originalName}.${outputFormat}`
    );

    const args = [
        "-y",
        "-i", input
    ];

    if (outputFormat === "mp3") {
        args.push("-codec:a", "libmp3lame", "-b:a", "192k");
    }

    if (outputFormat === "wav") {
        args.push("-codec:a", "pcm_s16le");
    }

    if (outputFormat === "flac") {
        args.push("-codec:a", "flac");
    }

    if (outputFormat === "aac") {
        args.push("-codec:a", "aac", "-b:a", "192k");
    }

    if (outputFormat === "m4a") {
        args.push("-codec:a", "aac", "-b:a", "192k");
    }

    if (outputFormat === "ogg") {
        args.push("-codec:a", "libvorbis", "-b:a", "192k");
    }

    if (outputFormat === "opus") {
        args.push("-codec:a", "libopus", "-b:a", "128k");
    }

    args.push(output);

    execFile(
        "ffmpeg",
        args,
        {
            timeout: 10 * 60 * 1000
        },
        (error, stdout, stderr) => {

            fs.unlink(input, () => {});

            if (error) {
                console.error(stderr);

                if (fs.existsSync(output)) {
                    fs.unlink(output, () => {});
                }

                return res.status(500).json({
                    error: "Audio conversion failed"
                });
            }

            res.download(
                output,
                `${originalName}.${outputFormat}`,
                {
                    headers: {
                        "Content-Type":
                            mimeTypes[outputFormat] || "application/octet-stream"
                    }
                },
                () => {
                    fs.unlink(output, () => {});
                }
            );
        }
    );
});

app.listen(PORT, () => {
    console.log(`ConvertHub API running on port ${PORT}`);
});
