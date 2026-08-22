const API_URL =
    "https://converthub-6urh.onrender.com";


const chooseBtn =
    document.getElementById("chooseBtn");

const fileInput =
    document.getElementById("fileInput");

const fileInfo =
    document.getElementById("fileInfo");

const settings =
    document.getElementById("settings");

const modeSelect =
    document.getElementById("modeSelect");

const targetBox =
    document.getElementById("targetBox");

const targetValue =
    document.getElementById("targetValue");

const targetUnit =
    document.getElementById("targetUnit");

const qualitySelect =
    document.getElementById("qualitySelect");

const actionArea =
    document.getElementById("actionArea");

const compressBtn =
    document.getElementById("compressBtn");

const converterBox =
    document.getElementById("converterBox");


let selectedFile = null;


/* =========================
   CHOOSE PDF
========================= */

chooseBtn.addEventListener(
    "click",
    function () {

        fileInput.value = "";

        fileInput.click();

    }
);


/* =========================
   PDF SELECTED
========================= */

fileInput.addEventListener(
    "change",
    function () {

        const file =
            fileInput.files[0];

        if (!file) {
            return;
        }


        if (
            file.type !==
                "application/pdf" &&
            !file.name
                .toLowerCase()
                .endsWith(".pdf")
        ) {

            alert(
                "Please select a PDF file."
            );

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
                📄 ${escapeHTML(
                    file.name
                )}
            </div>

            <span class="file-size">
                Original size:
                ${formatBytes(
                    file.size
                )}
            </span>

        `;


        settings.style.display =
            "block";


        actionArea.style.display =
            "block";


        const heading =
            converterBox.querySelector(
                "h2"
            );


        if (heading) {

            heading.textContent =
                "PDF selected";

        }

    }
);


/* =========================
   MODE CHANGE
========================= */

modeSelect.addEventListener(
    "change",
    function () {

        if (
            modeSelect.value ===
            "target"
        ) {

            targetBox.style.display =
                "block";

        } else {

            targetBox.style.display =
                "none";

        }

    }
);


/* =========================
   COMPRESS BUTTON
========================= */

compressBtn.addEventListener(
    "click",
    compressPDF
);


/* =========================
   COMPRESS PDF
========================= */

async function compressPDF() {

    if (!selectedFile) {

        alert(
            "Please select a PDF first."
        );

        return;
    }


    let targetBytes = "";


    /*
     * =========================
     * CUSTOM TARGET SIZE
     * =========================
     */

    if (
        modeSelect.value ===
        "target"
    ) {

        const value =
            Number(
                targetValue.value
            );


        if (
            !Number.isFinite(value) ||
            value <= 0
        ) {

            alert(
                "Please enter a valid target size."
            );

            return;
        }


        if (
            targetUnit.value ===
            "MB"
        ) {

            targetBytes =
                Math.round(
                    value *
                    1024 *
                    1024
                );

        } else {

            targetBytes =
                Math.round(
                    value *
                    1024
                );

        }


        if (
            targetBytes >=
            selectedFile.size
        ) {

            alert(
                "Target size must be smaller than the original PDF."
            );

            return;
        }

    }


    /*
     * =========================
     * FORM DATA
     * =========================
     */

    const formData =
        new FormData();


    formData.append(
        "file",
        selectedFile
    );


    formData.append(
        "mode",
        modeSelect.value
    );


    formData.append(
        "quality",
        qualitySelect.value
    );


    if (targetBytes) {

        formData.append(
            "targetBytes",
            targetBytes
        );

    }


    /*
     * =========================
     * LOADING UI
     * =========================
     */

    converterBox.innerHTML = `

        <div class="upload-icon">
            ⏳
        </div>

        <h2>
            Compressing PDF...
        </h2>

        <p>
            ${
                modeSelect.value ===
                "target"
                    ? "Trying to reach your target size..."
                    : "Optimizing your PDF..."
            }
        </p>

        <small>
            Please wait...
        </small>

    `;


    actionArea.style.display =
        "none";

    settings.style.display =
        "none";

    fileInfo.style.display =
        "none";


    /*
     * =========================
     * SEND TO SERVER
     * =========================
     */

    try {

        const response =
            await fetch(
                API_URL +
                "/convert/pdf-compress",
                {
                    method: "POST",
                    body: formData
                }
            );


        /*
         * SERVER ERROR
         */

        if (!response.ok) {

            let message =
                "PDF compression failed.";


            try {

                const data =
                    await response.json();


                message =
                    data.error ||
                    message;

            } catch (error) {

                console.error(
                    error
                );

            }


            throw new Error(
                message
            );

        }


        /*
         * =========================
         * GET RESULT
         * =========================
         */

        const blob =
            await response.blob();


        const compressedSize =
            blob.size;


        const originalSize =
            selectedFile.size;


        /*
         * Calculate difference
         */

        const savedBytes =
            originalSize -
            compressedSize;


        const wasCompressed =
            compressedSize <
            originalSize;


        const savedPercent =
            originalSize > 0 &&
            wasCompressed
                ? (
                    (
                        savedBytes /
                        originalSize
                    ) * 100
                )
                    .toFixed(1)
                : "0.0";


        /*
         * Check target
         */

        let targetReached = true;


        if (
            modeSelect.value ===
                "target" &&
            targetBytes
        ) {

            targetReached =
                compressedSize <=
                targetBytes;

        }


        /*
         * =========================
         * DOWNLOAD URL
         * =========================
         */

        const downloadURL =
            URL.createObjectURL(
                blob
            );


        /*
         * =========================
         * RESULT TITLE
         * =========================
         */

        let title = "";

        let icon = "";

        let message = "";


        if (wasCompressed) {

            title =
                "Compression Complete!";

            icon = "✓";


            if (
                modeSelect.value ===
                    "target" &&
                !targetReached
            ) {

                message =
                    "Target size could not be reached, but the PDF was compressed as much as possible.";

            } else {

                message =
                    savedPercent +
                    "% smaller";

            }

        } else {

            title =
                "No Compression Needed";

            icon = "✓";


            message =
                "This PDF could not be reduced further.";

        }


        /*
         * =========================
         * RESULT UI
         * =========================
         */

        converterBox.innerHTML = `

            <div class="upload-icon">
                ${icon}
            </div>

            <h2>
                ${title}
            </h2>

            <p>
                Original:
                ${formatBytes(
                    originalSize
                )}
            </p>

            <p>
                New size:
                ${formatBytes(
                    compressedSize
                )}
            </p>

            <p>
                ${message}
            </p>

            ${
                modeSelect.value ===
                    "target" &&
                targetBytes
                    ? `
                        <p>
                            Target:
                            ${formatBytes(
                                targetBytes
                            )}
                        </p>
                    `
                    : ""
            }

            <a
                href="${downloadURL}"
                download="ConvertHub-Compressed.pdf"
                class="choose-btn"
                style="
                    display:inline-block;
                    text-decoration:none;
                "
            >
                Download PDF
            </a>

            <br><br>

            <button
                type="button"
                class="convert-btn"
                onclick="location.reload()"
            >
                Compress Another PDF
            </button>

        `;


    } catch (error) {

        console.error(
            "PDF COMPRESS ERROR:",
            error
        );


        /*
         * =========================
         * ERROR UI
         * =========================
         */

        converterBox.innerHTML = `

            <div class="upload-icon">
                !
            </div>

            <h2>
                Compression Failed
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
   FORMAT BYTES
========================= */

function formatBytes(bytes) {

    if (
        !Number.isFinite(bytes) ||
        bytes <= 0
    ) {

        return "0 Bytes";

    }


    const units = [

        "Bytes",
        "KB",
        "MB",
        "GB"

    ];


    const index =
        Math.min(
            Math.floor(
                Math.log(bytes) /
                Math.log(1024)
            ),
            units.length - 1
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
        )

        +

        " "

        +

        units[index]

    );

}


/* =========================
   ESCAPE HTML
========================= */

function escapeHTML(text) {

    return String(text)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}