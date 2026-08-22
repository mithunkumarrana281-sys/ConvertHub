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

app.get("/", (req, res) => {
    res.json({
        name: "ConvertHub API",
        status: "online"
    });
});

app.post("/convert/m4a-to-mp3", upload.single("file"), (req, res) => {

    if (!req.file) {
        return res.status(400).json({
            error: "No file uploaded"
        });
    }

    const input = req.file.path;
    const output = path.join(
        outputDir,
        `${path.parse(req.file.originalname).name}.mp3`
    );

    execFile(
        "ffmpeg",
        [
            "-y",
            "-i", input,
            "-vn",
            "-codec:a", "libmp3lame",
            "-b:a", "192k",
            output
        ],
        (error, stdout, stderr) => {

            fs.unlink(input, () => {});

            if (error) {
                console.error(stderr);

                return res.status(500).json({
                    error: "Conversion failed"
                });
            }

            res.download(
                output,
                path.basename(output),
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
