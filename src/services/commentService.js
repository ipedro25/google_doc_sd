const commentModel = require("../models/commentModel");

function generateId() {
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createComment({ documentId, authorName, quote, text }) {
  const id = generateId();
  return commentModel.create({ id, documentId, authorName, quote, text });
}

async function listComments(documentId) {
  return commentModel.findByDocument(documentId);
}

async function resolveComment(id, resolved) {
  const comment = await commentModel.setResolved(id, resolved);
  if (!comment) throw Object.assign(new Error("Comentário não encontrado"), { name: "NotFoundError" });
  return comment;
}

async function deleteComment(id) {
  const comment = await commentModel.remove(id);
  if (!comment) throw Object.assign(new Error("Comentário não encontrado"), { name: "NotFoundError" });
  return comment;
}

module.exports = { createComment, listComments, resolveComment, deleteComment };