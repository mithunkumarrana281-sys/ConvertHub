const API_URL = "https://converthub-6urh.onrender.com";

const chooseBtn = document.getElementById("chooseBtn");
const fileInput = document.getElementById("fileInput");
const converterBox = document.getElementById("converterBox");

chooseBtn.addEventListener("click", () => {
    fileInput.click();
});


fileInput.addEventListener("change", () => {

    const file = fileInput.files[0];

    if (!file) return;

    const extension = file.name
        .split(".")
        .pop()
        .toLowerCase();

    const supported = [
        "jpg",
        "jpeg",
        "png",
        "webp",
        "bmp",
        "tif",
        "tiff"
    ];

    if (!supported.includes(extension)) {

        alert("This image format is not supported.");

        fileInput.value = "";

        return;
    }


    converterBox.innerHTML = `

        <div class="upload-icon">🖼️</div>

        <h2>${file.name}</h2>

        <p>Select output format</p>

        <select id="formatSelect"
            style="
                padding:13px;
                width:180px;
                border:1px solid #d9dde6;
                border-radius:8px;
                font-size:15px;
                margin-bottom:20px;
            ">

            <option value="jpg">JPG</option>
            <option value="png">PNG</option>
            <option value="webp">WEBP</option>
            <option value="bmp">BMP</option>
            <option value="tiff">TIFF</option>

        </select>

        <br>

        <button class="choose-btn" id="convertBtn">
            Convert Now
        </button>

        <small>
            File size: ${formatBytes(file.size)}
        </small>
    `;


    document
        .getElementById("convertBtn")
        .addEventListener("click", convertImage);

});


async function convertImage() {

    const file = fileInput.files[0];

    const format =
        document.getElementById("formatSelect").value;


    const formData = new FormData();

    formData.append("file", file);
    formData.append("format", format);


    converterBox.innerHTML = `

        <div class="upload-icon">⏳</div>

        <h2>Converting...</h2>

        <p>
            Please wait while ConvertHub processes your image.
        </p>

    `;


    try {

        const response = await fetch(
            `${API_URL}/convert/image`,
            {
                method: "POST",
                body: formData
            }
        );


        if (!response.ok) {

            let message = "Image conversion failed.";

            try {
                const data = await response.json();
                message = data.error || message;
            } catch {}

            throw new Error(message);
        }


        const blob = await response.blob();

        const downloadURL =
            URL.createObjectURL(blob);


        const originalName =
            file.name.replace(/\.[^/.]+$/, "");


        const downloadName =
            `${originalName}.${format}`;


        converterBox.innerHTML = `

            <div class="upload-icon">✓</div>

            <h2>Conversion Complete!</h2>

            <p>${downloadName}</p>

            <a
                href="${downloadURL}"
                download="${downloadName}"
                class="choose-btn"
                style="
                    display:inline-block;
                    text-decoration:none;
                "
            >
                Download ${format.toUpperCase()}
            </a>

            <br><br>

            <button
                class="choose-btn"
                onclick="location.reload()"
            >
                Convert Another
            </button>

        `;

    } catch (error) {

        console.error(error);

        converterBox.innerHTML = `

            <div class="upload-icon">!</div>

            <h2>Conversion Failed</h2>

            <p>${error.message}</p>

            <button
                class="choose-btn"
                onclick="location.reload()"
            >
                Try Again
            </button>

        `;
    }
}


function formatBytes(bytes) {

    if (bytes === 0) return "0 Bytes";

    const units = [
        "Bytes",
        "KB",
        "MB",
        "GB"
    ];

    const i =
        Math.floor(
            Math.log(bytes) / Math.log(1024)
        );

    return (
        parseFloat(
            (bytes / Math.pow(1024, i))
            .toFixed(2)
        )
        + " "
        + units[i];
    );
}