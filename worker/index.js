// Doras Survivor — Worker de Cloudflare.
// Sirve el juego (carpeta public/) y una API mínima de puntajes:
//   GET  /api/top    -> { top: [3 mejores], names: [nombres conocidos], total }
//   POST /api/score  -> guarda { name, score, seconds, won } y responde con el puesto.
// Los puntajes viven en KV (binding SCORES) bajo una sola clave "board".

const BOARD_KEY = "board";
const MAX_PLAYERS = 500;
const MAX_NAMES = 200;
const TOP_SIZE = 3;

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

// Nombre visible: sin caracteres raros, espacios colapsados, máximo 16.
function cleanName(raw) {
  if (typeof raw !== "string") return "";
  return raw
    .normalize("NFC")
    .replace(/[^\p{L}\p{N} ._\-¡!¿?]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 16);
}

const nameKey = (name) => name.toLocaleLowerCase("es");

async function readBoard(env) {
  const board = await env.SCORES.get(BOARD_KEY, "json");
  return board && typeof board.players === "object" ? board : { players: {} };
}

function ranking(board) {
  return Object.values(board.players).sort((a, b) => b.score - a.score || a.date - b.date);
}

function summary(board) {
  const ranked = ranking(board);
  const recent = Object.values(board.players)
    .sort((a, b) => b.date - a.date)
    .slice(0, MAX_NAMES)
    .map((p) => p.name);
  return {
    top: ranked.slice(0, TOP_SIZE).map(({ name, score, won }) => ({ name, score, won: !!won })),
    names: recent,
    total: ranked.length
  };
}

async function handleScore(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "JSON inválido" }, 400);
  }
  const name = cleanName(body.name);
  const score = Math.floor(Number(body.score));
  const seconds = Math.max(0, Number(body.seconds) || 0);
  if (!name) return json({ error: "Falta el nombre" }, 400);
  if (!Number.isFinite(score) || score < 0 || score > 1000000) return json({ error: "Puntaje inválido" }, 400);
  // Freno básico contra puntajes inventados: el juego no da más que esto por segundo jugado.
  if (score > seconds * 150 + 8000) return json({ error: "Ese puntaje no cuadra con el tiempo jugado" }, 400);

  const board = await readBoard(env);
  const key = nameKey(name);
  const prev = board.players[key];
  const now = Date.now();
  let improved = false;
  if (!prev || score > prev.score) {
    board.players[key] = { name, score, won: !!body.won, date: now };
    improved = true;
  } else {
    prev.date = now; // se usa para ordenar el autocompletado por actividad reciente
  }

  // Si hay demasiados jugadores, se descartan los de menor puntaje.
  const keys = Object.keys(board.players);
  if (keys.length > MAX_PLAYERS) {
    ranking(board)
      .slice(MAX_PLAYERS)
      .forEach((p) => delete board.players[nameKey(p.name)]);
  }
  await env.SCORES.put(BOARD_KEY, JSON.stringify(board));

  const ranked = ranking(board);
  const mine = board.players[key];
  const rank = ranked.findIndex((p) => nameKey(p.name) === key) + 1;
  const third = ranked[TOP_SIZE - 1];
  return json({
    ...summary(board),
    rank,
    best: mine.score,
    improved,
    toPodium: rank > TOP_SIZE && third ? third.score - mine.score + 1 : 0
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: JSON_HEADERS });
      try {
        if (url.pathname === "/api/top" && request.method === "GET") {
          return json(summary(await readBoard(env)));
        }
        if (url.pathname === "/api/score" && request.method === "POST") {
          return await handleScore(request, env);
        }
        return json({ error: "No existe" }, 404);
      } catch (err) {
        return json({ error: "Error del servidor" }, 500);
      }
    }
    return env.ASSETS.fetch(request);
  }
};
