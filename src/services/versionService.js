const versionModel  = require("../models/versionModel");
const documentModel = require("../models/documentModel");

async function createVersion(documentId, editorName = null) {
  const doc = await documentModel.findById(documentId);
  if (!doc) throw Object.assign(new Error("Document not found"), { name: "NotFoundError" });

  // Só cria versão se tiver conteúdo
  if (!doc.word_html && !doc.excel_data) return null;

  return versionModel.create({ documentId, snapshot: doc, editorName });
}

async function listVersions(documentId) {
  return versionModel.findByDocument(documentId);
}

async function restoreVersion(versionId) {
  const version = await versionModel.findById(versionId);
  if (!version) throw Object.assign(new Error("Version not found"), { name: "NotFoundError" });

  const snapshot = typeof version.snapshot === "string"
    ? JSON.parse(version.snapshot)
    : version.snapshot;

  await documentModel.update(snapshot.id, {
    name:       snapshot.name,
    word_html:  snapshot.word_html  || null,
    excel_data: snapshot.excel_data || null,
  });

  return snapshot;
}

module.exports = { createVersion, listVersions, restoreVersion };