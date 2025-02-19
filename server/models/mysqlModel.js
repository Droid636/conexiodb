const { mysqlConnection } = require("../../db");

const createUserTable = `
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        text VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        image VARCHAR(255),
        date DATE NOT NULL,
        longText TEXT NOT NULL
    )
`;
mysqlConnection.query(createUserTable, (err) => {
    if (err) console.error("Error creando tabla:", err);
});

const insertUser = (userData, callback) => {
    const sql = "INSERT INTO users (text, password, image, date, longText) VALUES (?, ?, ?, ?, ?)";
    mysqlConnection.query(sql, userData, callback);
};

module.exports = { insertUser };
