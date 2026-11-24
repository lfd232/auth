import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { fetchProfile } from "../api/auth";
import { selectIsAuthenticated, useAuthStore } from "../store/authStore";

export default function ProtectedRoute() {
  const isAuth = useAuthStore(selectIsAuthenticated);
  const location = useLocation();
  const [checked, setChecked] = useState(false);

  // При загрузке страницы (в том числе после F5) проверяем токены на сервере.
  // access недействителен → interceptor пробует refresh;
  // refresh тоже недействителен → logout() и редирект на /login.
  useEffect(() => {
    if (!isAuth) return;
    let cancelled = false;
    fetchProfile()
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setChecked(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isAuth) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (!checked) {
    return <main className="center"><p className="muted">Проверяем сессию…</p></main>;
  }
  return <Outlet />;
}
