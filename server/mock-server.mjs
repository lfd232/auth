// Мини-бэкенд без зависимостей: node server/mock-server.mjs
import http from "node:http";
import crypto from "node:crypto";

const PORT = 4000;
const ACCESS_TTL_MS = 15_000;        // access живёт 15 секунд — удобно проверять refresh
const REFRESH_TTL_MS = 5 * 60_000;   // refresh живёт 5 минут

const USER = { id: 1, username: "admin", name: "Администратор" };
const PASSWORD = "123456";

const accessTokens = new Map();  // token -> expiresAt
const refreshTokens = new Map(); // token -> expiresAt

const rand = () => crypto.randomBytes(24).toString("hex");

function issueTokens() {
  const accessToken = rand();
  const refreshToken = rand();
  accessTokens.set(accessToken, Date.now() + ACCESS_TTL_MS);
  refreshTokens.set(refreshToken, Date.now() + REFRESH_TTL_MS);
  return { accessToken, refreshToken };
}

const send = (res, status, body) => {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  res.end(JSON.stringify(body));
};

const readJson = (req) =>
  new Promise((resolve) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      try { resolve(JSON.parse(raw || "{}")); } catch { resolve({}); }
    });
  });

http
  .createServer(async (req, res) => {
    if (req.method === "OPTIONS") return send(res, 204, {});

    if (req.method === "POST" && req.url === "/auth/login") {
      const { username, password } = await readJson(req);
      if (username === USER.username && password === PASSWORD) {
        return send(res, 200, { ...issueTokens(), user: USER });
      }
      return send(res, 401, { message: "Неверный логин или пароль" });
    }

    if (req.method === "POST" && req.url === "/auth/refresh") {
      const { refreshToken } = await readJson(req);
      const exp = refreshTokens.get(refreshToken);
      if (!exp || exp < Date.now()) {
        refreshTokens.delete(refreshToken);
        return send(res, 401, { message: "Refresh-токен недействителен" });
      }
      refreshTokens.delete(refreshToken); // ротация
      console.log("refresh: выданы новые токены");
      return send(res, 200, issueTokens());
    }

    if (req.method === "GET" && req.url === "/api/profile") {
      const token = (req.headers.authorization ?? "").replace("Bearer ", "");
      const exp = accessTokens.get(token);
      if (!exp || exp < Date.now()) {
        return send(res, 401, { message: "Access-токен недействителен" });
      }
      return send(res, 200, { user: USER, serverTime: new Date().toLocaleTimeString() });
    }

    send(res, 404, { message: "Not found" });
  })
  .listen(PORT, () => console.log(`Mock API: http://localhost:${PORT}  (access TTL ${ACCESS_TTL_MS / 1000}s)`));
