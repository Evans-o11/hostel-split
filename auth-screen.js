const authScreen = document.getElementById("authScreen");
const signInForm = document.getElementById("signInForm");
const signUpForm = document.getElementById("signUpForm");
const forgotForm = document.getElementById("forgotForm");

document.getElementById("showSignUp").addEventListener("click", function () {
    signInForm.classList.add("auth-hidden");
    signUpForm.classList.remove("auth-hidden");
})
document.getElementById("showSignIn").addEventListener("click", function () {
     signUpForm.classList.add("auth-hidden");
     signInForm.classList.remove("auth-hidden");
})

document.getElementById("showForgot").addEventListener("click", function (){
    signInForm.classList.add("auth-hidden")
    forgotForm.classList.remove("auth-hidden")
})
document.getElementById("backToSignIn").addEventListener("click", function () {
    forgotForm.classList.add("auth-hidden");
      signInForm.classList.remove("auth-hidden");
})


signInForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const email = document.getElementById("signInEmail").value.trim();
    const password = document.getElementById("signInPassword").value;
    const erroLine = document.getElementById("signInError");
    erroLine.textContent = "";
    if (!email || !password) {
        erroLine.textContent = "Please enter your email and password.";
        return;
    }
    try {
        await signIn(email, password);
        document.getElementById("signInPassword").value = ""
        authScreen.classList.add("auth-hidden");
    } catch (error) {
        erroLine.textContent = error.message;
    }

})
signUpForm.addEventListener("submit", async function (event) {
         event.preventDefault();
     const fullName = document.getElementById("signUpName").value.trim();
     const email = document.getElementById("signUpEmail").value.trim();
     const password = document.getElementById("signUpPassword").value;
     const errorLine = document.getElementById("signUpError");
     errorLine.textContent = ""
     if (!fullName || !email || password.length < 8) {
         errorLine.textContent = "Please enter your name, your email and a password of at least 8 characters."
         return;
     }
     try {
         await signUp(fullName, email, password);
         document.getElementById("signUpPassword").value = ""
          authScreen.classList.add("auth-hidden");
     } catch (error) {
        errorLine.textContent = error.message 
     }
})
 
