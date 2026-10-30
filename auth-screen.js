

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
 
forgotForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const email = document.getElementById("forgotEmail").value.trim();
    const messageLine = document.getElementById("forgotMessage");
    messageLine.textContent = "";
    messageLine.className = "auth-error";
    if (!email) {
        messageLine.textContent = "Please enter your email";
        return;
    }
    try {
        const message = await requestReset(email);
        messageLine.textContent = message;
        messageLine.classList.add("auth-ok")

    } catch (error) {
        messageLine.textContent = error.message
    }
})

const resetForm = document.getElementById("resetForm");
const resetToken = new URLSearchParams(window.location.search).get("reset");
if (resetToken) {
    signInForm.classList.add("auth-hidden");
    resetForm.classList.remove("auth-hidden");
}

resetForm.addEventListener("submit",  async function (event) {
    event.preventDefault()
    const password = document.getElementById("resetPassword").value;
    const confirm = document.getElementById("resetConfirm").value;
    const messageLine = document.getElementById("resetMessage");
    messageLine.textContent = ""
   messageLine.className = "auth-error";
    
    if (password.length < 8) {
        messageLine.textContent = "Your new password must have at least 8 characters."
        return;
    }
    if (password !== confirm) {
        messageLine.textContent = "The two passwords do not match." 
        return
    }
    try {
        const message = await resetPassword(resetToken, password);
        document.getElementById("resetPassword").value = ""
        document.getElementById("resetConfirm").value = ""
        messageLine.textContent = message
            messageLine.classList.add("auth-ok");
    } catch (error) {
        messageLine.textContent = error.message;
    }
})
document.getElementById("resetBackToSignIn").addEventListener("click", function () {
    window.history.replaceState(null, "", window.location.pathname);
    resetForm.classList.add("auth-hidden");
    signInForm.classList.remove("auth-hidden");
})
document.getElementById("resetAskNew").addEventListener("click", function () {
    window.history.replaceState(null, "", window.location.pathname);
    resetForm.classList.add("auth-hidden");
    forgotForm.classList.remove("auth-hidden");
})