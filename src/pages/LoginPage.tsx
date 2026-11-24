import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { loginRequest } from "../api/auth";
import { selectIsAuthenticated, useAuthStore } from "../store/authStore";

export default function LoginPage() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isAuth = useAuthStore(selectIsAuthenticated);
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/profile";

  if (isAuth) return <Navigate to="/profile" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { accessToken, refreshToken, user } = await loginRequest({ username, password });
      setSession({ accessToken, refreshToken }, user);
      navigate(from, { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError("Неверный логин или пароль");
      } else {
        setError("Не удалось подключиться к серверу. Запущен ли npm run server?");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="center">
      <form className="panel" onSubmit={onSubmit}>
        <h1>Вход в аккаунт</h1>
        <p className="muted">Тестовый пользователь: admin / 123456</p>

        <label>
          Логин
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
        </label>

        <label>
          Пароль
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>

        {error && <p className="error" role="alert">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Входим…" : "Войти"}
        </button>
      </form>
    </main>
  );
}
