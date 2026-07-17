const express = require("express");
const router  = express.Router();
const projectService  = require("../services/projectService");
const folderService   = require("../services/folderService");
const documentService = require("../services/documentService");
const { asyncHandler, authErrorHandler } = require("../middleware/authMiddleware");
const { authenticate } = require("../middleware/authenticate");
const { requireProjectMember, requireProjectOwner } = require("../middleware/projectAcess");

router.use(authenticate);

/**
 * GET /projects
 * Lista os projectos onde o utilizador autenticado é membro.
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const projects = await projectService.listProjectsForUser(req.user.id);
    res.status(200).json(projects);
  })
);

/**
 * POST /projects
 * Cria um novo projecto. Quem cria fica automaticamente como "owner".
 */
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: "O nome do projecto é obrigatório" });
    }
    const project = await projectService.createProject({
      name: name.trim(),
      description: description?.trim() || null,
      organization: req.user.organization || null,
      ownerId: req.user.id,
    });
    res.status(201).json(project);
  })
);

/**
 * GET /projects/:id
 * Detalhe do projecto: membros + pastas.
 */
router.get(
  "/:id",
  requireProjectMember("id"),
  asyncHandler(async (req, res) => {
    const project = await projectService.getProjectDetail(req.params.id);
    if (!project) return res.status(404).json({ error: "Projecto não encontrado" });
    res.status(200).json(project);
  })
);

/**
 * PATCH /projects/:id
 * Renomear/editar descrição do projecto.
 */
router.patch(
  "/:id",
  requireProjectMember("id"),
  asyncHandler(async (req, res) => {
    const allowed = ["name", "description"];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: "Nada para actualizar" });
    }
    const project = await require("../models/projectModel").update(req.params.id, updates);
    res.status(200).json(project);
  })
);

/**
 * DELETE /projects/:id
 * Só o dono pode eliminar. Documentos ficam "soltos"; pastas e membros são removidos.
 */
router.delete(
  "/:id",
  requireProjectMember("id"),
  requireProjectOwner("id"),
  asyncHandler(async (req, res) => {
    await projectService.deleteProject(req.params.id);
    res.status(200).json({ message: "Projecto eliminado" });
  })
);

// ─── Membros ─────────────────────────────────────────────────────────────────

/**
 * POST /projects/:id/members  { email, role }
 * Adiciona uma pessoa ao projecto pelo email.
 */
router.post(
  "/:id/members",
  requireProjectMember("id"),
  asyncHandler(async (req, res) => {
    const { email, role } = req.body;
    if (!email?.trim()) return res.status(400).json({ error: "Email é obrigatório" });
    await projectService.addMemberByEmail(req.params.id, email.trim(), role || "member");
    res.status(201).json({ message: "Membro adicionado" });
  })
);

/**
 * DELETE /projects/:id/members/:userId
 */
router.delete(
  "/:id/members/:userId",
  requireProjectMember("id"),
  asyncHandler(async (req, res) => {
    await projectService.removeMember(req.params.id, req.params.userId);
    res.status(200).json({ message: "Membro removido" });
  })
);

// ─── Pastas ──────────────────────────────────────────────────────────────────

/**
 * GET /projects/:id/folders
 */
router.get(
  "/:id/folders",
  requireProjectMember("id"),
  asyncHandler(async (req, res) => {
    const folders = await folderService.listFolders(req.params.id);
    res.status(200).json(folders);
  })
);

/**
 * POST /projects/:id/folders  { name }
 */
router.post(
  "/:id/folders",
  requireProjectMember("id"),
  asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "O nome da pasta é obrigatório" });
    const folder = await folderService.createFolder(req.params.id, name.trim());
    res.status(201).json(folder);
  })
);

// ─── Documentos dentro do projecto ───────────────────────────────────────────

/**
 * GET /projects/:id/documents?folderId=
 * Lista documentos na raiz do projecto (sem ?folderId) ou dentro de uma pasta.
 */
router.get(
  "/:id/documents",
  requireProjectMember("id"),
  asyncHandler(async (req, res) => {
    const { folderId } = req.query;
    const documents = await documentService.findByLocation({
      projectId: req.params.id,
      folderId: folderId || null,
    });
    res.status(200).json(documents);
  })
);

/**
 * POST /projects/:id/documents  { name, type, template, folderId }
 * Cria um documento já dentro do projecto (e, opcionalmente, de uma pasta).
 */
router.post(
  "/:id/documents",
  requireProjectMember("id"),
  asyncHandler(async (req, res) => {
    const { name, type, template, folderId } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "O nome do documento é obrigatório" });
    const doc = await documentService.create({
      name: name.trim(),
      type,
      template,
      projectId: req.params.id,
      folderId: folderId || null,
    });
    res.status(201).json(doc);
  })
);

router.use(authErrorHandler);
module.exports = router;