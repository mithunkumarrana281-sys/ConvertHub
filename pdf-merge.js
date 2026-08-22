const API_URL = "https://converthub-6urh.onrender.com";

const chooseBtn = document.getElementById("chooseBtn");
const fileInput = document.getElementById("fileInput");
const fileList = document.getElementById("fileList");
const actionArea = document.getElementById("actionArea");
const mergeBtn = document.getElementById("mergeBtn");
const converterBox = document.getElementById("converterBox");

let selectedFiles = [];


/* =========================
   CHOOSE PDF FILES
========================= */

chooseBtn.addEventListener("click", function () {

    fileInput.value = "";

    fileInput.click();

});


/* =========================
   FILE SELECTED
========================= */

fileInput.addEventListener("change", function () {

    const files = Array.from(fileInput.files);

    if (files.length === 0) {
        return;
    }


    if (files.length > 20) {

        alert("Maximum 20 PDF files allowed.");

        return;
    }


    const invalidFile = files.find(
        file =>
            file.type !== "application/pdf" &&
            !file.name.toLowerCase().endsWith(".pdf")
    );


    if (invalidFile) {

        alert("Only PDF files are supported.");

        return;
    }


    selectedFiles = files;

    displayFiles();

});


/* =========================
   DISPLAY FILES
========================= */

function displayFiles() {

    fileList.innerHTML = "";


    selectedFiles.forEach(
        (file, index) => {

            const item =
                document.createElement("div");

            item.className =
                "file-item";


            const number =
                document.createElement("div");

            number.className =
                "file-number";

            number.textContent =
                index + 1;


            const info =
                document.createElement("div");

            info.className =
                "file-info";


            const name =
                document.createElement("strong");

            name.textContent =
                file.name;


            const size =
                document.createElement("small");

            size.textContent =
                formatBytes(file.size);


            info.appendChild(name);

            info.appendChild(size);


            const remove =
                document.createElement("button");

            remove.type =
                "button";

            remove.className =
                "remove-btn";

            remove.textContent =
                "Remove";


            remove.addEventListener(
                "click",
                function () {

                    selectedFiles.splice(
                        index,
                        1
                    );

                    displayFiles();

                }
            );


            item.appendChild(number);

            item.appendChild(info);

            item.appendChild(remove);

            fileList.appendChild(item);

        }
    );


    if (selectedFiles.length >= 2) {

        actionArea.style.display =
            "block";

        converterBox.querySelector("h2")
            .textContent =
            selectedFiles.length +
            " PDF files selected";

    } else {

        actionArea.style.display =
            "none";

        if (selectedFiles.length === 1) {

            converterBox.querySelector("h2")
                .textContent =
                "Select at least 2 PDF files";

        } else {

            converterBox.querySelector("h2")
                .textContent =
                "Select PDF files";

        }

    }

}


/* =========================
   MERGE PDF
========================= */

mergeBtn.addEventListener(
    "click",
    mergePDFs
);


async function mergePDFs() {

    if (selectedFiles.length < 2) {

        alert(
            "Please select at least 2 PDF files."
        );

        return;
    }


    const formData =
        new FormData();


    selectedFiles.forEach(
        file => {

            formData.append(
                "files",
                file
            );

        }
    );


    converterBox.innerHTML = `

        <div class="upload-icon">
            ⏳
        </div>

        <h2>
            Merging PDFs...
        </h2>

        <p>
            Please wait while your PDF files are merged.
        </p>

        <small>
            Do not close this page.
        </small>

    `;


    actionArea.style.display =
        "none";


    try {

        const response =
            await fetch(
                API_URL +
                "/convert/pdf-merge",
                {
                    method: "POST",
                    body: formData
                }
            );


        if (!response.ok) {

            let message =
                "PDF merge failed.";

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
                PDFs Merged!
            </h2>

            <p>
                Your merged PDF is ready.
            </p>

            <a
                href="${downloadURL}"
                download="ConvertHub-Merged.pdf"
                class="choose-btn"
                style="
                    display:inline-block;
                    text-decoration:none;
                "
            >
                Download Merged PDF
            </a>

            <br><br>

            <button
                type="button"
                class="convert-btn"
                onclick="location.reload()"
            >
                Merge More PDFs
            </button>

        `;

    } catch (error) {

        console.error(
            "PDF MERGE ERROR:",
            error
        );


        converterBox.innerHTML = `

            <div class="upload-icon">
                !
            </div>

            <h2>
                Merge Failed
            </h2>

            <p>
                ${error.message}
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
   FILE SIZE
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
        )
        +
        " " +
        units[index]
    );

}