const API_URL = "https://converthub-6urh.onrender.com";

const chooseBtn = document.getElementById("chooseBtn");
const fileInput = document.getElementById("fileInput");
const fileInfo = document.getElementById("fileInfo");
const actionArea = document.getElementById("actionArea");
const convertBtn = document.getElementById("convertBtn");
const converterBox = document.getElementById("converterBox");

let selectedFile = null;


/* =========================
   CHOOSE PDF
========================= */

chooseBtn.addEventListener("click", function () {

    fileInput.value = "";
    fileInput.click();

});


/* =========================
   PDF SELECTED
========================= */

fileInput.addEventListener("change", function () {

    const file = fileInput.files[0];

    if (!file) {
        return;
    }


    if (
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")
    ) {

        alert("Please select a PDF file.");

        fileInput.value = "";

        return;
    }


    if (
        file.size >
        100 * 1024 * 1024
    ) {

        alert(
            "Maximum file size is 100 MB."
        );

        fileInput.value = "";

        return;
    }


    selectedFile = file;


    fileInfo.style.display =
        "block";


    fileInfo.innerHTML = `

        <div class="file-name">
            📄 ${escapeHTML(file.name)}
        </div>

        <span class="file-size">
            ${formatBytes(file.size)}
        </span>

    `;


    actionArea.style.display =
        "block";


    converterBox.querySelector("h2")
        .textContent =
        "PDF selected";

});


/* =========================
   CONVERT
========================= */

convertBtn.addEventListener(
    "click",
    convertPDF
);


async function convertPDF() {

    if (!selectedFile) {

        alert(
            "Please select a PDF first."
        );

        return;
    }


    const formData =
        new FormData();


    formData.append(
        "file",
        selectedFile
    );


    converterBox.innerHTML = `

        <div class="upload-icon">
            ⏳
        </div>

        <h2>
            Converting PDF...
        </h2>

        <p>
            Creating JPG image from your PDF.
        </p>

        <small>
            Please wait...
        </small>

    `;


    actionArea.style.display =
        "none";

    fileInfo.style.display =
        "none";


    try {

        const response =
            await fetch(
                API_URL +
                "/convert/pdf-to-jpg",
                {
                    method: "POST",
                    body: formData
                }
            );


        if (!response.ok) {

            let message =
                "PDF to JPG conversion failed.";

            try {

                const data =
                    await response.json();

                message =
                    data.error ||
                    message;

            } catch (error) {

            }

            throw new Error(
                message
            );

        }


        const blob =
            await response.blob();


        const downloadURL =
            URL.createObjectURL(blob);


        converterBox.innerHTML = `

            <div class="upload-icon">
                ✓
            </div>

            <h2>
                Conversion Complete!
            </h2>

            <p>
                Your JPG image is ready.
            </p>

            <a
                href="${downloadURL}"
                download="ConvertHub-Page-1.jpg"
                class="choose-btn"
                style="
                    display:inline-block;
                    text-decoration:none;
                "
            >
                Download JPG
            </a>

            <br><br>

            <button
                type="button"
                class="convert-btn"
                onclick="location.reload()"
            >
                Convert Another PDF
            </button>

        `;

    } catch (error) {

        console.error(
            "PDF TO JPG ERROR:",
            error
        );


        converterBox.innerHTML = `

            <div class="upload-icon">
                !
            </div>

            <h2>
                Conversion Failed
            </h2>

            <p>
                ${escapeHTML(
                    error.message
                )}
            </p>

            <button
                type="button"
                class="choose-btn"
                onclick="location.reload()"
            >
                Try Again
            </button>

        `;

    }

}


/* =========================
   FORMAT SIZE
========================= */

function formatBytes(bytes) {

    if (bytes === 0) {
        return "0 Bytes";
    }


    const units = [
        "Bytes",
        "KB",
        "MB",
        "GB"
    ];


    const index =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );


    return (
        parseFloat(
            (
                bytes /
                Math.pow(
                    1024,
                    index
                )
            ).toFixed(2)
        ) +
        " " +
        units[index]
    );

}


/* =========================
   SAFE TEXT
========================= */

function escapeHTML(text) {

    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}