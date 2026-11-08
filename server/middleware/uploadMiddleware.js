
const multer = require("multer");

// Store uploaded files temporarily in memory
const storage = multer.memoryStorage();

// Maximum image size: 5 MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const upload = multer({
    storage,

    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1
    },

    fileFilter: (req, file, callback) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.mimetype)) {
            return callback(
                new Error("Only JPG, PNG and WebP images are allowed")
            );
        }

        callback(null, true);
    }
});

module.exports = upload;
