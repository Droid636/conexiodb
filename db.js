const mysql = require("mysql2");
const mongoose = require("mongoose");

// 🌟 Conexión a MySQL
const mysqlConnection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "bryan",
    database: "simple_db"
});

mysqlConnection.connect(err => {
    if (err) console.error("Error conectando a MySQL:", err);
    else console.log(" Conectado a MySQL");
});

// 🌟 Conexión a MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/simple_db", { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
.then(() => console.log(" Conectado a MongoDB"))
.catch(err => console.error("Error conectando a MongoDB:", err));

const userSchema = new mongoose.Schema({
    text_field: String,
    password: String,
    image: String,
    date_field: Date,
    opinion: String
});

const UserModel = mongoose.model("User", userSchema);

module.exports = { mysqlConnection, UserModel };
