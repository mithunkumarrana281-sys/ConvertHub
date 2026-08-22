const API_URL = "https://converthub-6urh.onrender.com";

const chooseBtn = document.getElementById("chooseBtn");
const fileInput = document.getElementById("fileInput");
const imageList = document.getElementById("imageList");
const actionArea = document.getElementById("actionArea");
const convertBtn = document.getElementById("convertBtn");
const converterBox = document.getElementById("converterBox");

let selectedFiles = [];


/* =========================
   CHOOSE FILES
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

        alert("Maximum 20 images allowed.");

        return;
    }


    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];


    const invalidFile = files.find(
        file => !allowedTypes.includes(file.type)
    );


    if (invalidFile) {

        alert(
            "Only JPG, JPEG, PNG and WEBP images are supported."
        );

        return;
    }


    selectedFiles = files;

    displayFiles();

});


/* =========================
   DISPLAY FILES
========================= */

function displayFiles() {

    imageList.innerHTML = "";

    selectedFiles.forEach(
        (file, index) => {

            const item =
                document.createElement("div");

            item.className = "image-item";


            const img =
                document.createElement("img");

            img.src =
                URL.createObjectURL(file);


            const info =
                document.createElement("div");

            info.className =
                "image-info";


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

            remove.className =
                "remove-btn";

            remove.type =
                "button";

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


            item.appendChild(img);

            item.appendChild(info);

            item.appendChild(remove);

            imageList.appendChild(item);

        }
    );


    if (selectedFiles.length > 0) {

        actionArea.style.display =
            "block";

        converterBox.querySelector("h2")
            .textContent =
            selectedFiles.length +
            " image(s) selected";

    } else {

        actionArea.style.display =
            "none";

        converterBox.querySelector("h2")
            .textContent =
            "Select your images";

    }

}


/* =========================
   CREATE PDF
========================= */

convertBtn.addEventListener(
    "click",
    createPDF
);


async function createPDF() {

    if (selectedFiles.length === 0) {

        alert(
            "Please select at least one image."
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
            Creating PDF...
        </h2>

        <p>
            Please wait while your PDF is being created.
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
                "/convert/image-to-pdf",
                {
                    method: "POST",
                    body: formData
                }
            );


        if (!response.ok) {

            let message =
                "PDF creation failed.";

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
            URL.createObjectURL(
                blob
            );


        converterBox.innerHTML = `

            <div class="upload-icon">
                ✓
            </div>

            <h2>
                PDF Created!
            </h2>

            <p>
                Your PDF is ready.
            </p>

            <a
                href="${downloadURL}"
                download="ConvertHub-Images.pdf"
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
                Convert More Images
            </button>

        `;

    } catch (error) {

        console.error(
            "PDF ERROR:",
            error
        );


        converterBox.innerHTML = `

            <div class="upload-icon">
                !
            </div>

            <h2>
                PDF Creation Failed
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
        ) +
        " " +
        units[index]
    );

}