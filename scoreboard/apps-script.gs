const SHEET_NAME = 'scores';
const MAX_NAME = 12;
const MAX_SCORE = 8000;
const MAX_KILLS = 20;

function sheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let s = ss.getSheetByName(SHEET_NAME);
  if (!s) {
    s = ss.insertSheet(SHEET_NAME);
    s.appendRow(['at', 'name', 'score', 'killed', 'won', 'theme']);
  }
  return s;
}

function readAll() {
  const rows = sheet().getDataRange().getValues().slice(1);
  return rows.filter(r => r[1]).map(r => ({ at: r[0] instanceof Date ? r[0].toISOString() : String(r[0]), name: String(r[1]), score: Number(r[2]), killed: Number(r[3]), won: r[4] === true || r[4] === 'TRUE', theme: String(r[5] || 'paper') }));
}

function sortScores(list) {
  return list.sort((a, b) => b.score - a.score || b.killed - a.killed || String(a.at).localeCompare(String(b.at)));
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return out({ scores: sortScores(readAll()).slice(0, 10) });
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents || '{}');
  } catch (err) {
    return out({ error: 'bad json' });
  }
  const name = String(body.name || '').replace(/[^\p{L}\p{N} _.'-]/gu, '').trim().slice(0, MAX_NAME) || 'anon';
  const score = Number(body.score);
  const killed = Number(body.killed);
  const valid = Number.isInteger(score) && score >= 0 && score <= MAX_SCORE && score % 100 === 0
    && Number.isInteger(killed) && killed >= 0 && killed <= MAX_KILLS && score <= killed * 400;
  if (!valid) return out({ error: 'nice try' });
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const at = new Date();
    sheet().appendRow([at, name, score, killed, body.won === true && killed === MAX_KILLS, ['paper', 'hearth', 'cyber'].includes(body.theme) ? body.theme : 'paper']);
    const all = sortScores(readAll());
    const rank = all.findIndex(r => r.name === name && r.score === score && r.at === at.toISOString()) + 1;
    return out({ ok: true, rank: rank || null, scores: all.slice(0, 10) });
  } finally {
    lock.releaseLock();
  }
}
