const multer = require("multer");
const storage = multer.memoryStorage(); // Armazena o arquivo em memória
const upload = multer({ storage });

module.exports = upload;
