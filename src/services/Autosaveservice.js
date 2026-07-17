const pool = require("../config/db");
const { getDocumentState, deleteDocumentState } = require("../redis/documentCache");

const INTERVAL_MS = 10_000; // 10 segundos

/**
 * AutoSave Service
 *
 * Lê o estado mais recente de cada documento do Redis e persiste no PostgreSQL.
 * Muito mais eficiente do que escrever no PostgreSQL a cada evento de socket:
 *   - Redis absorve as escritas em tempo real (rápido)
 *   - PostgreSQL só é escrito a cada 10s (estável)
 *
 * activeRooms: salas com alterações pendentes desde o último ciclo.
 * wordSocket.js e excelSocket.js fazem markEdited(roomId, editorName) sempre
 * que há uma alteração — deixaram de escrever directamente no Postgres.
 *
 * lastEditor: guarda o nome da última pessoa que editou cada sala, para
 * podermos registar "quem editou" no documento e nas versões automáticas.
 */
const activeRooms = new Set();
const lastEditor  = new Map(); // roomId -> nome do último editor

// Último snapshot já gravado por sala, para não criar versões duplicadas
// quando não houve alteração real de conteúdo entre dois ciclos.
const lastSavedSnapshot = new Map();

/**
 * Chamar a partir de wordSocket.js / excelSocket.js sempre que houver uma
 * alteração, para sabermos quem foi o autor quando o autosave gravar.
 */
function markEdited(roomId, editorName) {
  activeRooms.add(roomId);
  if (editorName) lastEditor.set(roomId, editorName);
}

function startAutoSave() {
  const interval = setInterval(async () => {
    if (activeRooms.size === 0) return;

    // Copia e limpa já no início: alterações que cheguem durante o ciclo
    // ficam marcadas de novo e são apanhadas no próximo, não se perdem.
    const roomsToSave = Array.from(activeRooms);
    activeRooms.clear();

    for (const roomId of roomsToSave) {
      try {
        const cached = await getDocumentState(roomId);
        if (!cached) continue;

        const wordHtml   = cached.wordHtml ?? null;
        const excelJson  = JSON.stringify(cached.excelData ?? null);
        const editorName = lastEditor.get(roomId) || null;

        const updated = await pool.query(
          `UPDATE documents
           SET word_html=$1, excel_data=$2::jsonb, updated_at=NOW(),
               last_edited_by=$3, last_edited_at=NOW()
           WHERE id=$4 RETURNING *`,
          [wordHtml, excelJson, editorName, roomId]
        );

        if (updated.rows.length === 0) continue;
        const doc = updated.rows[0];

        // Só cria uma versão nova se o conteúdo mudou desde a última gravação
        const fingerprint = `${wordHtml || ""}::${excelJson}`;
        if (lastSavedSnapshot.get(roomId) === fingerprint) continue;
        lastSavedSnapshot.set(roomId, fingerprint);

        await pool.query(
          "INSERT INTO document_versions (document_id, snapshot, editor_name) VALUES ($1, $2::jsonb, $3)",
          [roomId, JSON.stringify(doc), editorName]
        );

      } catch (err) {
        console.error(`[AutoSave] Erro ao guardar sala ${roomId}:`, err.message);
      }
    }
  }, INTERVAL_MS);

  console.log("[AutoSave] Serviço iniciado — intervalo:", INTERVAL_MS / 1000, "s");

  // Permite parar o serviço graciosamente
  return () => clearInterval(interval);
}

/**
 * Chamar quando uma sala fica sem utilizadores, para limpar o estado
 * em memória e o cache Redis associado.
 */
async function cleanupRoom(roomId) {
  activeRooms.delete(roomId);
  lastSavedSnapshot.delete(roomId);
  lastEditor.delete(roomId);
  await deleteDocumentState(roomId).catch(() => null);
}

module.exports = { startAutoSave, activeRooms, markEdited, cleanupRoom };