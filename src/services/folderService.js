const folderModel = require("../models/folderModel");

async function createFolder(projectId, name) {
  return folderModel.create({ projectId, name });
}

async function listFolders(projectId) {
  return folderModel.findByProject(projectId);
}

async function renameFolder(id, name) {
  return folderModel.update(id, { name });
}

async function deleteFolder(id) {
  return folderModel.remove(id);
}

module.exports = { createFolder, listFolders, renameFolder, deleteFolder };