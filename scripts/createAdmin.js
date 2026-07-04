require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const userModel = require("../models/users");

const [name, email, password] = process.argv.slice(2);

if (!name || !email || !password) {
  console.log("Usage: node scripts/createAdmin.js \"Admin Name\" admin@example.com StrongPassword123");
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(process.env.DATABASE, { useNewUrlParser: true, useUnifiedTopology: true });
    const existing = await userModel.findOne({ email: email.toLowerCase() });
    if (existing) {
      existing.name = name;
      existing.password = bcrypt.hashSync(password, 10);
      existing.userRole = 1;
      await existing.save();
      console.log("Existing user was updated to admin successfully.");
    } else {
      await userModel.create({
        name,
        email: email.toLowerCase(),
        password: bcrypt.hashSync(password, 10),
        userRole: 1,
      });
      console.log("Admin user created successfully.");
    }
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
