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

function showUser(user) {
    const parts = user.full_name.trim().split(" ");
    let letters = parts[0][0];
    if (parts.length > 1) {
        letters = letters + parts[parts.length - 1][0];
    }
    document.getElementById("menuButton").textContent = letters.toUpperCase();
    document.getElementById("menuName").textContent = user.full_name
    document.getElementById("menuEmail").textContent = user.email;
}