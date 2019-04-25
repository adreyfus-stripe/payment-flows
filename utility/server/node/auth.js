// Helpers for password hashing and authentication.
const securePassword = require('secure-password');

// Initialise our password policy
const pwd = securePassword();

const hashPassword = async password => {
  const userPassword = Buffer.from(password);
  const hash = await pwd.hash(userPassword);
  return hash;
};

const verifyPassword = async (user, password) => {
  const userPassword = Buffer.from(password);
  const result = await pwd.verify(userPassword, user.password);
  switch (result) {
    case securePassword.INVALID_UNRECOGNIZED_HASH:
    case securePassword.INVALID:
      console.log(`Invalid hash or wrong password.`);
      return false;
    case securePassword.VALID:
      console.log(`Password verified.`);
      return true;
  }
};

const loginMiddleware = (req, res, next) => {
  console.log(`in login middleware`, req.isAuthenticated());
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  next();
};

exports.pwd = {
  hash: hashPassword,
  verify: verifyPassword,
};

exports.auth = {
  loginMiddleware,
};
