const express = require("express");
const router = express.Router();
const upload = require("../middleware/UploadMiddleware");
const cloudinary = require("../../main/config/cloudinary");
const streamifier = require("streamifier");

// CHAIN OF RESPONSIBILITY PATTERN: Pipeline de upload
// upload.single("image") -> validação -> cloudinary -> resposta
router.post("/", upload.single("image"), async (req, res) => {
  try {
    // CHAIN STEP 1: Validar se arquivo foi enviado
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    // CHAIN STEP 2: Configurar stream de upload para Cloudinary
    const streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "produtos" },
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    // CHAIN STEP 3: Executar upload e retornar URL
    const result = await streamUpload(req);
    res.json({ success: true, url: result.secure_url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message, error });
  }
});

module.exports = router;
