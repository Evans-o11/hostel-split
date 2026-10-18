const bcrypt = require("bcryptjs");
async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}
async function  checkPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}
module.exports = { hashPassword, checkPassword };