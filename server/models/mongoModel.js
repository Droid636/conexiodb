const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    text: { type: String, required: true },
    password: { type: String, required: true },
    image: { type: String },
    date: { type: Date, required: true },
    longText: { type: String, required: true },
});

module.exports = mongoose.model("User", UserSchema);
