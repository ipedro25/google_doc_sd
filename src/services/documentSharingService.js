const collaboratorModel = require("../models/documentCollaboratorModel");
const userModel = require("../models/userModel");

async function shareDocument(documentId, email, role = "editor") {
  const user = await userModel.findByEmail(email);
  if (!user) throw Object.assign(new Error("Não existe nenhum utilizador com esse email"), { name: "NotFoundError" });
  return collaboratorModel.add(documentId, user.id, role);
}

async function unshareDocument(documentId, userId) {
  return collaboratorModel.remove(documentId, userId);
}

async function listCollaborators(documentId) {
  return collaboratorModel.listByDocument(documentId);
}

async function getRole(documentId, userId) {
  return collaboratorModel.getRole(documentId, userId);
}

module.exports = { shareDocument, unshareDocument, listCollaborators, getRole };