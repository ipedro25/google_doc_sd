const projectService = require("../services/projectService");

/**
 * Bloqueia o pedido se o utilizador autenticado não for membro do projecto
 * identificado por req.params[paramName]. Usar em rotas de /projects/:id/... .
 */
function requireProjectMember(paramName = "id") {
  return async function (req, res, next) {
    try {
      const projectId = req.params[paramName];
      const isMember = await projectService.isMember(projectId, req.user.id);
      if (!isMember) {
        return res.status(403).json({ error: "Não tens acesso a este projecto." });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

/** Só deixa passar se o utilizador for o 'owner' do projecto. */
function requireProjectOwner(paramName = "id") {
  return async function (req, res, next) {
    try {
      const projectId = req.params[paramName];
      const role = await projectService.getRole(projectId, req.user.id);
      if (role !== "owner") {
        return res.status(403).json({ error: "Só o dono do projecto pode fazer isto." });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { requireProjectMember, requireProjectOwner };