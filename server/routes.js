const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const User = require("./models/mongoModel");
const { insertUser } = require("./models/mysqlModel");

const router = express.Router();

// 📌 Configurar almacenamiento de imágenes
const storage = multer.diskStorage({
    destination: "./public/uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage });

// 📌 Ruta para registrar usuario
router.post("/register", upload.single("image"), async (req, res) => {
    try {
        const { text, password, date, longText, database } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

        if (database === "mongodb") {
            // Guardar en MongoDB
            const newUser = new User({ text, password: hashedPassword, image: imagePath, date, longText });
            await newUser.save();
        } else {
            // Guardar en MySQL
            insertUser([text, hashedPassword, imagePath, date, longText], (err) => {
                if (err) throw err;
            });
        }

        res.json({ message: "Usuario registrado correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al registrar usuario" });
    }
});

module.exports = router;
