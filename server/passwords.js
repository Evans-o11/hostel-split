const bcrypt = require("bcryptjs");
const COMMON_PASSWORDS = [
  "password1", "password123", "qwerty123", "abc12345", "iloveyou1", "welcome123", "admin123", "letmein123", "duesly123" , "hostel123"
]
async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}
async function  checkPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}
function passwordProblem(password) {
  if (password.length < 8){
    return "Your password must have at least 8 characters.";
  }
  if (password.length > 64) {
     return "Your password must have at most 64 characters.";
  }
  if (!/[a-zA-Z]/.test(password)) {
     return "Your password must contain at least one letter.";
  }
  if (!/[0-9]/.test(password)) {
    return "Your password must contain at least one number."
  }
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
   return "That password is too common. Please choose another one."; 
  }
  return null;
}

module.exports = { hashPassword, checkPassword, passwordProblem };