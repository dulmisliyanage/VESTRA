
const cloudinary = require("../config/cloudinary");
const Store = require("../models/Store");

// Check actual image file signatures
function isSupportedImage(buffer) {
    if (!buffer || buffer.length < 12) {
        return false;
    }

    // JPEG
    const jpeg =
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff;

    // PNG
    const png =
        buffer.subarray(0, 8).equals(
            Buffer.from([
                137, 80, 78, 71, 13, 10, 26, 10
            ])
        );

    // WebP
    const webp =
        buffer.toString("ascii", 0, 4) === "RIFF" &&
        buffer.toString("ascii", 8, 12) === "WEBP";

    return jpeg || png || webp;
}

async function uploadProductImage(req, res) {
    try {
        // Ensure the seller has an approved store
        const store = await Store.findOne({
            ownerId: req.user._id,
            approvalStatus: "approved"
        });

        if (!store) {
            return res.status(403).json({
                message: "An approved seller store is required"
            });
        }

        if (!req.file) {
            return res.status(400).json({
                message: "Please select an image"
            });
        }

        if (!isSupportedImage(req.file.buffer)) {
            return res.status(400).json({
                message: "Invalid image file"
            });
        }

        // Upload the image to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: `vestra/products/${store._id}`,
                    resource_type: "image",
                    format: "webp",
                    transformation: [
                        {
                            width: 1600,
                            height: 1600,
                            crop: "limit"
                        }
                    ]
                },
                (error, uploadedImage) => {
                    if (error) {
                        return reject(error);
                    }

                    resolve(uploadedImage);
                }
            );

            stream.end(req.file.buffer);
        });

        return res.status(201).json({
            message: "Image uploaded successfully",
            imageUrl: result.secure_url,
            publicId: result.public_id
        });

    } catch (error) {
        console.error("Image upload error:", error);

        return res.status(500).json({
            message: "Unable to upload image"
        });
    }
}

module.exports = {
    uploadProductImage
};
