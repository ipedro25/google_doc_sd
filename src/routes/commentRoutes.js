const express = require("express");
const router  = express.Router();
const commentService = require("../services/commentService");
const commentModel   = require("../models/commentModel");
const projectService = require("../services/projectService");
const documentModel  = require("../models/documentModel");
const { asyncHandler, authErrorHandler } = require("../middleware/authMiddleware");
const { authenticate } = require("../middleware/authenticate");

router.use(authenticate);

/** Confirma que o comentário existe e que o utilizador tem acesso ao documento a que pertence. */
async function ensureAccess(req, res, next) {
  try {
    const comment = await commentModel.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: "Comentário não encontrado" });

    const doc = await documentModel.findById(comment.document_id);
    if (doc?.project_id) {
      const isMember = await projectService.isMember(doc.project_id, req.user.id);
      if (!isMember) return res.status(403).json({ error: "Não tens acesso a este documento." });
    }

    req.comment = comment;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /comments/:id  { resolved: true|false }
 */
router.patch(
  "/:id",
  ensureAccess,
  asyncHandler(async (req, res) => {
    const comment = await commentService.resolveComment(req.params.id, !!req.body.resolved);
    res.status(200).json(comment);
  })
);

/**
 * DELETE /comments/:id
 */
router.delete(
  "/:id",
  ensureAccess,
  asyncHandler(async (req, res) => {
    await commentService.deleteComment(req.params.id);
    res.status(200).json({ message: "Comentário eliminado" });
  })
);

router.use(authErrorHandler);
module.exports = router;