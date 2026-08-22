const menuBtn = document.getElementById("menuBtn");
const closeMenu = document.getElementById("closeMenu");
const sideMenu = document.getElementById("sideMenu");
const overlay = document.getElementById("overlay");

function openMenu() {
    sideMenu.classList.add("active");
    overlay.classList.add("active");
}

function closeSideMenu() {
    sideMenu.classList.remove("active");
    overlay.classList.remove("active");
}

menuBtn.addEventListener("click", openMenu);
closeMenu.addEventListener("click", closeSideMenu);
overlay.addEventListener("click", closeSideMenu);


/* Expand / collapse menu */

document.querySelectorAll(".menu-title").forEach(button => {

    button.addEventListener("click", () => {

        const section = button.parentElement;

        section.classList.toggle("open");

    });

});


/* File picker */

const chooseBtn = document.getElementById("chooseBtn");
const fileInput = document.getElementById("fileInput");
const uploadBox = document.getElementById("uploadBox");

chooseBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    fileInput.click();
});

uploadBox.addEventListener("click", () => {
    fileInput.click();
});

fileInput.addEventListener("change", () => {

    if (fileInput.files.length > 0) {

        let names = [];

        for (const file of fileInput.files) {
            names.push(file.name);
        }

        alert(
            "Selected files:\n\n" +
            names.join("\n") +
            "\n\nConverter system will be connected in the next step."
        );
    }

});