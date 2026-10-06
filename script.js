const buttons = document.querySelectorAll("nav button");
buttons.forEach(function (button) {
  button.addEventListener("click", function () {
    showScreen(button.dataset.screen);
  });
});


const screens = document.querySelectorAll(".screen");
function showScreen(name) {
  
  screens.forEach(function (screen) {
    screen.classList.remove("screen-active");
  });
    const shownScreen = document.getElementById("screen" + name);
  shownScreen.classList.add("screen-active");
  buttons.forEach(function (button) {
    button.dataset.screen === name ? button.classList.add("active") : button.classList.remove("active");

    
  });
    
}