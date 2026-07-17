const express = require("express");
const router  = express.Router();
const folderModel   = require("../models/folderModel");
const folderService = require("../services/folderService");
const projectService = require("../services/projectService");
const { asyncHandler, authErrorHandler } = require("../middleware/authMiddleware");
const { authenticate } = require("../middleware/authenticate");

router.use(authenticate);

/** Confirma que a pasta existe e que o utilizador pertence ao projecto dela. */
async function ensureAccess(req, res, next) {
  try {
    const folder = await folderModel.findById(req.params.id);
    if (!folder) return res.status(404).json({ error: "Pasta não encontrada" });

    const isMember = await projectService.isMember(folder.project_id, req.user.id);
    if (!isMember) return res.status(403).json({ error: "Não tens acesso a esta pasta" });

    req.folder = folder;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /folders/:id  { name }
 */
router.patch(
  "/:id",
  ensureAccess,
  asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Nome inválido" });
    const folder = await folderService.renameFolder(req.params.id, name.trim());
    res.status(200).json(folder);
  })
);

/**
 * DELETE /folders/:id
 * Os documentos dentro da pasta não são apagados — ficam na raiz do projecto.
 */
router.delete(
  "/:id",
  ensureAccess,
  asyncHandler(async (req, res) => {
    await folderService.deleteFolder(req.params.id);
    res.status(200).json({ message: "Pasta eliminada" });
  })
);

router.use(authErrorHandler);
module.exports = router;