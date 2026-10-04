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
    
} 