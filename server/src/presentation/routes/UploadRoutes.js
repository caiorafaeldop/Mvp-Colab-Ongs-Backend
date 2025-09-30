const express = require('express');
const upload = require('../middleware/UploadMiddleware');

// Exporta uma função que recebe o storageBridge via DI
module.exports = function createUploadRoutes(storageBridge) {
  const router = express.Router();

  // CHAIN OF RESPONSIBILITY PATTERN: Pipeline de upload
  // upload.single("image") -> validação -> storageBridge -> resposta
  router.post('/', upload.single('image'), async (req, res) => {
    try {
      // CHAIN STEP 1: Validar se arquivo foi enviado
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      // CHAIN STEP 2: Executar upload via bridge (cloud/local)
      const result = await storageBridge.uploadFile(req.file, { folder: 'produtos' });

      // CHAIN STEP 3: Tratar resposta padronizada
      if (!result || result.success === false) {
        const message = result?.error || 'Upload failed';
        return res.status(500).json({ success: false, message });
      }

      return res.json({ success: true, url: result.url, provider: result.provider });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  return router;
};
