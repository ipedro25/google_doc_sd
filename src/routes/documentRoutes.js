const express = require("express");
const router  = express.Router();
const documentService = require("../services/documentService");
const versionService  = require("../services/versionService");
const commentService  = require("../services/commentService");
const presenceService = require("../services/presenceService");
const projectService  = require("../services/projectService");
const sharingService  = require("../services/documentSharingService");
const documentModel   = require("../models/documentModel");
const { asyncHandler, authErrorHandler } = require("../middleware/authMiddleware");
const { authenticate } = require("../middleware/authenticate");

// Todas as rotas de documentos exigem utilizador autenticado
router.use(authenticate);

/**
 * Se o documento pertencer a um projecto, confirma que o utilizador é
 * membro desse projecto. Se for um documento "solto" (pessoal), confirma
 * que é o dono, um colaborador convidado, ou que o documento não tem dono
 * definido (compatibilidade com documentos antigos).
 *
 * Guarda em req.docRole: 'owner', 'editor', 'viewer' ou null (sem restrição
 * — caso legado). Útil para bloquear PATCH a quem só tem acesso de leitura.
 */
async function ensureDocumentAccess(req, res, next) {
  try {
    const doc = await documentModel.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Document not found" });

    if (doc.project_id) {
      const isMember = await projectService.isMember(doc.project_id, req.user.id);
      if (!isMember) return res.status(403).json({ error: "Não tens acesso a este documento." });
      req.docRole = null; // acesso a projectos não distingue editor/leitor por agora
    } else if (doc.created_by === req.user.id) {
      req.docRole = "owner";
    } else if (!doc.created_by) {
      req.docRole = null; // documento antigo, sem dono — sem restrição
    } else {
      const role = await sharingService.getRole(req.params.id, req.user.id);
      if (!role) return res.status(403).json({ error: "Não tens acesso a este documento." });
      req.docRole = role; // 'editor' ou 'viewer'
    }

    req.doc = doc;
    next();
  } catch (err) {
    next(err);
  }
}

// ─── Document Routes ───────────────────────────────────────────────────────────

/**
 * GET /documents
 * Lista os documentos "soltos" (fora de qualquer projecto) — paginado.
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const docs = await documentService.findAll({
      page:  parseInt(page, 10),
      limit: Math.min(parseInt(limit, 10), 100),
      userId: req.user.id,
    });
    res.status(200).json(docs);
  })
);

/**
 * GET /documents/active-status
 * Devolve quantas pessoas estão neste momento a editar/ver cada documento.
 * IMPORTANTE: esta rota tem de vir antes de "/:id" para não ser interpretada
 * como um ID de documento.
 */
router.get(
  "/active-status",
  asyncHandler(async (req, res) => {
    res.status(200).json(presenceService.getAllActiveCounts());
  })
);

/**
 * GET /documents/:id
 * Carrega um documento existente ou cria um novo se não existir.
 */
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    // Nota: loadOrCreate cria o documento se ainda não existir na BD, por
    // isso o check de acesso ao projecto é feito depois de o termos carregado
    // (documentos novos ainda não têm project_id de qualquer forma).
    const doc = await documentService.loadOrCreate(req.params.id, req.user.id);
    if (!doc) return res.status(404).json({ error: "Document not found" });

    if (doc.project_id) {
      const isMember = await projectService.isMember(doc.project_id, req.user.id);
      if (!isMember) return res.status(403).json({ error: "Não tens acesso a este documento." });
    } else if (doc.created_by && doc.created_by !== req.user.id) {
      const role = await sharingService.getRole(req.params.id, req.user.id);
      if (!role) return res.status(403).json({ error: "Não tens acesso a este documento." });
    }

    res.status(200).json(doc);
  })
);

/**
 * POST /documents
 * Cria um novo documento — opcionalmente já dentro de um projecto/pasta.
 */
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, type, template, projectId, folderId } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: "Document name is required" });
    }

    if (projectId) {
      const isMember = await projectService.isMember(projectId, req.user.id);
      if (!isMember) return res.status(403).json({ error: "Não tens acesso a este projecto." });
    }

    const doc = await documentService.create({
      name: name.trim(),
      type,
      template,
      projectId: projectId || null,
      folderId: folderId || null,
      createdBy: req.user.id,
    });
    res.status(201).json(doc);
  })
);

/**
 * PATCH /documents/:id
 * Actualiza name, word_html ou excel_data de um documento.
 */
router.patch(
  "/:id",
  ensureDocumentAccess,
  asyncHandler(async (req, res) => {
    if (req.docRole === "viewer") {
      return res.status(403).json({ error: "Só tens acesso de leitura a este documento." });
    }

    const allowedFields = ["name", "word_html", "excel_data"];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowedFields.includes(k))
    );

    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: `At least one of [${allowedFields.join(", ")}] is required` });
    }

    // Serializa excel_data se vier como array
    if (updates.excel_data && Array.isArray(updates.excel_data)) {
      updates.excel_data = JSON.stringify(updates.excel_data);
    }

    // Regista quem foi o autor desta alteração
    updates.last_edited_by = req.user.name;
    updates.last_edited_at = new Date();

    const doc = await documentService.update(req.params.id, updates);
    if (!doc) return res.status(404).json({ error: "Document not found" });

    // Cria versão automática quando o conteúdo é actualizado
    if (updates.word_html || updates.excel_data) {
      versionService.createVersion(req.params.id, req.user.name).catch(err =>
        console.error("[DocumentRoutes] Versão automática falhou:", err.message)
      );
    }

    res.status(200).json(doc);
  })
);

/**
 * DELETE /documents/:id
 * Remove um documento e todas as suas versões.
 */
router.delete(
  "/:id",
  ensureDocumentAccess,
  asyncHandler(async (req, res) => {
    if (req.docRole === "editor" || req.docRole === "viewer") {
      return res.status(403).json({ error: "Só o dono do documento o pode eliminar." });
    }
    const deleted = await documentService.remove(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Document not found" });
    res.status(200).json({ message: "Document deleted successfully" });
  })
);

/**
 * GET /documents/:id/versions
 * Lista as versões de um documento.
 */
router.get(
  "/:id/versions",
  ensureDocumentAccess,
  asyncHandler(async (req, res) => {
    const versions = await versionService.listVersions(req.params.id);
    res.status(200).json(versions);
  })
);

/**
 * POST /documents/:id/versions/restore/:versionId
 * Restaura o documento para uma versão anterior.
 */
router.post(
  "/:id/versions/restore/:versionId",
  ensureDocumentAccess,
  asyncHandler(async (req, res) => {
    const doc = await versionService.restoreVersion(req.params.versionId);
    res.status(200).json({ message: "Document restored", doc });
  })
);

/**
 * GET /documents/:id/comments
 */
router.get(
  "/:id/comments",
  ensureDocumentAccess,
  asyncHandler(async (req, res) => {
    const comments = await commentService.listComments(req.params.id);
    res.status(200).json(comments);
  })
);

/**
 * POST /documents/:id/comments  { text, quote }
 */
router.post(
  "/:id/comments",
  ensureDocumentAccess,
  asyncHandler(async (req, res) => {
    const { text, quote } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: "O texto do comentário é obrigatório" });
    const comment = await commentService.createComment({
      documentId: req.params.id,
      authorName: req.user.name,
      quote: quote || null,
      text: text.trim(),
    });
    res.status(201).json(comment);
  })
);

/**
 * GET /documents/:id/share
 * Lista com quem este documento está partilhado.
 */
router.get(
  "/:id/share",
  ensureDocumentAccess,
  asyncHandler(async (req, res) => {
    const collaborators = await sharingService.listCollaborators(req.params.id);
    res.status(200).json(collaborators);
  })
);

/**
 * POST /documents/:id/share  { email, role }
 * Convida alguém para o documento. Só o dono pode partilhar.
 */
router.post(
  "/:id/share",
  ensureDocumentAccess,
  asyncHandler(async (req, res) => {
    if (req.docRole && req.docRole !== "owner") {
      return res.status(403).json({ error: "Só o dono do documento o pode partilhar." });
    }
    const { email, role } = req.body;
    if (!email?.trim()) return res.status(400).json({ error: "Email é obrigatório" });
    if (role && !["editor", "viewer"].includes(role)) {
      return res.status(400).json({ error: "Papel inválido (usa 'editor' ou 'viewer')" });
    }
    await sharingService.shareDocument(req.params.id, email.trim(), role || "editor");
    res.status(201).json({ message: "Documento partilhado" });
  })
);

/**
 * DELETE /documents/:id/share/:userId
 * Remove o acesso de alguém. O dono pode remover qualquer um; um
 * colaborador também se pode remover a si próprio ("deixar de colaborar").
 */
router.delete(
  "/:id/share/:userId",
  ensureDocumentAccess,
  asyncHandler(async (req, res) => {
    const isSelfRemoval = req.params.userId === req.user.id;
    if (req.docRole && req.docRole !== "owner" && !isSelfRemoval) {
      return res.status(403).json({ error: "Só o dono do documento pode remover outras pessoas." });
    }
    await sharingService.unshareDocument(req.params.id, req.params.userId);
    res.status(200).json({ message: "Acesso removido" });
  })
);

// ─── Error Handler ─────────────────────────────────────────────────────────────

router.use(authErrorHandler);

module.exports = router;