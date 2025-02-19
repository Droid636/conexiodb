const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const { mysqlConnection, UserModel } = require("./db");

const app = express();
const PORT = 5000;

// 🛠️ Middleware
app.use(cors()); // Permitir peticiones desde el frontend
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads")); // Servir imágenes

// 📸 Configuración de Multer para subir imágenes
const storage = multer.diskStorage({
    destination: "./uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Nombre único para el archivo
    }
});
const upload = multer({ storage });

// 📌 Ruta para registrar usuarios
app.post("/register", upload.single("image"), async (req, res) => {
    try {
        const { text_field, password, date_field, opinion, database } = req.body;
        const image = req.file ? req.file.filename : null;

        console.log("📥 Recibida solicitud de registro:", req.body);

        if (!text_field || !password) {
            return res.status(400).json({ message: "Los campos text_field y password son obligatorios" });
        }

        if (database === "mysql") {
            const query = "INSERT INTO users (text_field, password, image, date_field, opinion) VALUES (?, ?, ?, ?, ?)";
            mysqlConnection.query(query, [text_field, password, image, date_field, opinion], (err, result) => {
                if (err) {
                    console.error("❌ Error al insertar en MySQL:", err);
                    return res.status(500).json({ message: "Error en MySQL" });
                }
                console.log("✅ Registro guardado en MySQL:", result);
                res.json({ message: "Registro guardado en MySQL" });
            });
        } else if (database === "mongodb") {
            try {
                const newUser = new UserModel({
                    text_field,
                    password,
                    image,
                    date_field: date_field ? new Date(date_field) : null,
                    opinion
                });

                const savedUser = await newUser.save();
                console.log("✅ Registro guardado en MongoDB:", savedUser);
                res.json({ message: "Registro guardado en MongoDB" });
            } catch (mongoError) {
                console.error("❌ Error al insertar en MongoDB:", mongoError);
                res.status(500).json({ message: "Error en MongoDB", error: mongoError.message });
            }
        } else {
            res.status(400).json({ message: "Base de datos no especificada" });
        }
    } catch (error) {
        console.error("❌ Error en el servidor:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
});

// 📌 Ruta para obtener usuarios y mostrarlos en la tabla
app.get("/get-users", async (req, res) => {
    try {
        const { database } = req.query;

        if (database === "mysql") {
            mysqlConnection.query("SELECT * FROM users", (err, result) => {
                if (err) {
                    console.error("❌ Error obteniendo usuarios de MySQL:", err);
                    return res.status(500).json({ message: "Error en MySQL" });
                }
                res.json(result);
            });
        } else if (database === "mongodb") {
            const users = await UserModel.find({});
            res.json(users);
        } else {
            res.status(400).json({ message: "Base de datos no especificada" });
        }
    } catch (error) {
        console.error("❌ Error en el servidor:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
});

// 📌 Ruta para obtener un usuario específico (para editar)
app.get("/get-user/:id", async (req, res) => {
    try {
        const { id } = req.params;
        console.log(id)
        const { database } = req.query;

        if (database === "mysql") {
            const query = "SELECT * FROM users WHERE id = ?";
            mysqlConnection.query(query, [id], (err, result) => {
                if (err) {
                    console.error("❌ Error obteniendo usuario de MySQL:", err);
                    return res.status(500).json({ message: "Error en MySQL" });
                }
                if (result.length === 0) {
                    return res.status(404).json({ message: "Usuario no encontrado en MySQL" });
                }
                res.json(result[0]);
            });
        } else if (database === "mongodb") {
            const user = await UserModel.findById(id);
            if (!user) return res.status(404).json({ message: "Usuario no encontrado en MongoDB" });

            res.json(user);
        } else {
            res.status(400).json({ message: "Base de datos no especificada" });
        }
    } catch (error) {
        console.error("❌ Error en el servidor:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
});

// 📌 Ruta para actualizar usuario
app.put("/update-user/:id", upload.single("image"), async (req, res) => {
    try {
        const { database } = req.body;
        const { id } = req.params;
        const { text_field, password, date_field, opinion } = req.body;
        const image = req.file ? req.file.filename : null;

        console.log("📥 Datos recibidos para actualizar:", { id, database, text_field, password, date_field, opinion, image });

        if (!text_field || !password) {
            return res.status(400).json({ message: "Los campos text_field y password son obligatorios" });
        }

        if (database === "mysql") {
            const query = "UPDATE users SET text_field = ?, password = ?, image = ?, date_field = ?, opinion = ? WHERE id = ?";
            mysqlConnection.query(query, [text_field, password, image, date_field, opinion, id], (err, result) => {
                if (err) {
                    console.error("❌ Error al actualizar en MySQL:", err);
                    return res.status(500).json({ message: "Error en MySQL" });
                }
                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: "Usuario no encontrado en MySQL" });
                }
                res.json({ message: "Usuario actualizado en MySQL" });
            });
        } else if (database === "mongodb") {
            const updateData = {
                text_field,
                password,
                date_field: date_field ? new Date(date_field) : null,
                opinion
            };
            if (image) updateData.image = image;

            const updatedUser = await UserModel.findByIdAndUpdate(id, updateData, { new: true });
            if (!updatedUser) return res.status(404).json({ message: "Usuario no encontrado en MongoDB" });

            res.json({ message: "Usuario actualizado en MongoDB" });
        } else {
            res.status(400).json({ message: "Base de datos no especificada" });
        }
    } catch (error) {
        console.error("❌ Error en el servidor:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
});

// 📌 Ruta para eliminar usuario
app.delete("/delete-user/:id", async (req, res) => {
    try {
        const { database } = req.query;
        const { id } = req.params;

        if (database === "mysql") {
            const query = "DELETE FROM users WHERE id = ?";
            mysqlConnection.query(query, [id], (err, result) => {
                if (err) {
                    console.error("❌ Error al eliminar en MySQL:", err);
                    return res.status(500).json({ message: "Error en MySQL" });
                }
                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: "Usuario no encontrado en MySQL" });
                }
                res.json({ message: "Usuario eliminado de MySQL" });
            });
        } else if (database === "mongodb") {
            const deletedUser = await UserModel.findByIdAndDelete(id);
            if (!deletedUser) return res.status(404).json({ message: "Usuario no encontrado en MongoDB" });

            res.json({ message: "Usuario eliminado de MongoDB" });
        } else {
            res.status(400).json({ message: "Base de datos no especificada" });
        }
    } catch (error) {
        console.error("❌ Error en el servidor:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
});

// 🚀 Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});