const projectModel = require("../models/projectModel");
const memberModel  = require("../models/projectMemberModel");
const folderModel  = require("../models/folderModel");
const userModel    = require("../models/userModel");

async function createProject({ name, description, organization, ownerId }) {
  const project = await projectModel.create({ name, description, organization, ownerId });
  await memberModel.add(project.id, ownerId, "owner");
  return project;
}

async function listProjectsForUser(userId) {
  return projectModel.findAllForUser(userId);
}

async function getProjectDetail(projectId) {
  const project = await projectModel.findById(projectId);
  if (!project) return null;
  const [members, folders] = await Promise.all([
    memberModel.listMembers(projectId),
    folderModel.findByProject(projectId),
  ]);
  return { ...project, members, folders };
}

async function addMemberByEmail(projectId, email, role = "member") {
  const user = await userModel.findByEmail(email);
  if (!user) throw Object.assign(new Error("Não existe nenhum utilizador com esse email"), { name: "NotFoundError" });
  return memberModel.add(projectId, user.id, role);
}

async function removeMember(projectId, userId) {
  return memberModel.remove(projectId, userId);
}

async function isMember(projectId, userId) {
  if (!projectId) return true; // documentos sem projecto não são restringidos por esta regra
  return memberModel.isMember(projectId, userId);
}

async function getRole(projectId, userId) {
  return memberModel.getRole(projectId, userId);
}

/**
 * Elimina o projecto. Pastas e membros vão com ele (ON DELETE CASCADE);
 * os documentos NÃO são apagados — voltam a ficar "soltos" (ON DELETE SET NULL).
 */
async function deleteProject(projectId) {
  return projectModel.remove(projectId);
}

module.exports = {
  createProject,
  listProjectsForUser,
  getProjectDetail,
  addMemberByEmail,
  removeMember,
  isMember,
  getRole,
  deleteProject,
};