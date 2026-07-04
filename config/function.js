const userModel = require("../models/users");

exports.toTitleCase = function (str = "") {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

exports.validateEmail = function (mail = "") {
  return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/.test(mail);
};

exports.emailCheckInDatabase = async function (email) {
  const data = await userModel.findOne({ email });
  return Boolean(data);
};

exports.phoneNumberCheckInDatabase = async function (phoneNumber) {
  const data = await userModel.findOne({ phoneNumber });
  return Boolean(data);
};
