import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchProfile } from "../api/auth";
import { useAuthStore } from "../store/authStore";

export default function ProfilePage() {
  const { user, accessToken, refreshToken, setTokens, logout } = useAuthStore();
  const navigate = useNavigate();
  const [log, setLog] = useState<string[]>([]);

  const push = (msg: string) =>
    setLog((l) => [`${new Date().toLocaleTimeString()}  ${msg}`, ...l].slice(0, 12));

  const callProtected = async () => {
    try {
      const data = await fetchProfile();
      push(`OK: ${data.user.name}, время сервера ${data.serverTime}`);
    } catch {
      push("Ошибка запроса (сессия сброшена, если refresh не удался)");
    }
  };

  // Имитация протухшего access-токена → сервер вернёт 401 → сработает refresh
  const breakAccess = () => {
    if (refreshToken) setTokens({ accessToken: "broken.access.token", refreshToken });
    push("access-токен испорчен — нажмите «Защищённый запрос»");
  };

  // Имитация недействительного refresh-токена.
  // Только портим токены — проверка сессии произойдёт при F5 (см. ProtectedRoute)
  const breakRefresh = () => {
    if (accessToken) setTokens({ accessToken: "broken.access.token", refreshToken: "broken.refresh" });
    push("access и refresh испорчены — обновите страницу (F5)");
  };

  const onLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <main className="center">
      <section className="panel wide">
        <header className="row">
          <div>
            <h1>Привет, {user?.name}</h1>
            <p className="muted">Защищённая страница. Обновите её (F5) — сессия сохранится.</p>
          </div>
          <button className="ghost" onClick={onLogout}>Выйти</button>
        </header>

        <div className="tokens">
          <div>
            <span className="muted">access</span>
            <code>{accessToken?.slice(0, 40)}…</code>
          </div>
          <div>
            <span className="muted">refresh</span>
            <code>{refreshToken?.slice(0, 40)}…</code>
          </div>
        </div>

        <div className="actions">
          <button onClick={callProtected}>Защищённый запрос</button>
          <button className="ghost" onClick={breakAccess}>Испортить access</button>
          <button className="ghost" onClick={breakRefresh}>Испортить access и refresh</button>
        </div>

        <pre className="log">{log.length ? log.join("\n") : "Журнал запросов пуст"}</pre>
      </section>
    </main>
  );
}
