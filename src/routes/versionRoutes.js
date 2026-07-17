const express = require("express");
const router  = express.Router();
const versionService = require("../services/versionService");
const { asyncHandler, authErrorHandler } = require("../middleware/authMiddleware");
const { authenticate } = require("../middleware/authenticate");

// Todas as rotas de versões exigem utilizador autenticado
router.use(authenticate);

/**
 * GET /versions/:documentId
 * Lista todas as versões de um documento.
 */
router.get(
  "/:documentId",
  asyncHandler(async (req, res) => {
    const versions = await versionService.listVersions(req.params.documentId);
    res.status(200).json(versions);
  })
);

/**
 * POST /versions/:documentId
 * Cria uma nova versão snapshot do documento.
 */
router.post(
  "/:documentId",
  asyncHandler(async (req, res) => {
    const version = await versionService.createVersion(req.params.documentId);
    res.status(201).json(version);
  })
);

/**
 * POST /versions/restore/:versionId
 * Restaura o documento para uma versão anterior.
 */
router.post(
  "/restore/:versionId",
  asyncHandler(async (req, res) => {
    const doc = await versionService.restoreVersion(req.params.versionId);
    res.status(200).json({ message: "Document restored", doc });
  })
);

router.use(authErrorHandler);
module.exports = router;