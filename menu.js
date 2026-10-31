const menuButton = document.getElementById("menuButton");
const menuPanel = document.getElementById("menuPanel");
const menuWrap = document.querySelector(".menu-wrap");

menuButton.addEventListener("click", function () {
    menuPanel.classList.toggle("menu-hidden")
})
document.addEventListener("click", function (event) {
    if (!menuWrap.contains(event.target)){
        menuPanel.classList.add("menu-hidden");
        }
})
document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        menuPanel.classList.add("menu-hidden");
    }
})