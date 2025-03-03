const multer = require("multer");
const path = require("path");
const ErrorHandler = require("./errorHandler");

module.exports = multer({
    limits: { fileSize: 20 * 1024 * 1024 },
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        let ext = path.extname(file.originalname).toLowerCase();
        if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png" && ext !== ".pdf" && ext !== ".docx" && ext !== ".doc" && ext !== ".xlsx") {
            cb(new ErrorHandler("Unsupported file type!"), false);
            return;
        }
        cb(null, true);
    },
});