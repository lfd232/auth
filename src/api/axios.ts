import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore } from "../store/authStore";
import type { TokenPair } from "./types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

/** Основной экземпляр — с перехватчиками. */
export const api: AxiosInstance = axios.create({ baseURL: BASE_URL });

/** «Чистый» экземпляр без перехватчиков — для /auth/refresh (чтобы не зациклиться). */
const bare: AxiosInstance = axios.create({ baseURL: BASE_URL });

const PUBLIC_URLS = ["/auth/login", "/auth/refresh"];
const isPublic = (url?: string) => PUBLIC_URLS.some((p) => url?.includes(p));

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

/* ------------------------------------------------------------------ */
/* 1. REQUEST: добавляем access-токен ко всем защищённым запросам      */
/* ------------------------------------------------------------------ */
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken && !isPublic(config.url)) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

/* ------------------------------------------------------------------ */
/* 2. RESPONSE: ловим 401 → refresh → повтор исходного запроса         */
/* ------------------------------------------------------------------ */

// Один общий refresh на все параллельные запросы, получившие 401
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const { refreshToken, setTokens } = useAuthStore.getState();
  if (!refreshToken) throw new Error("Refresh-токен отсутствует");

  const { data } = await bare.post<TokenPair>("/auth/refresh", { refreshToken });
  setTokens(data);
  return data.accessToken;
}

function forceLogout() {
  useAuthStore.getState().logout();
  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;

    // Не 401, нет конфига, это login/refresh или уже повторяли — отдаём ошибку дальше
    if (
      error.response?.status !== 401 ||
      !original ||
      original._retry ||
      isPublic(original.url)
    ) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const newAccessToken = await refreshPromise;

      original.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(original); // повтор исходного запроса
    } catch (refreshError) {
      // refresh-токен отсутствует или недействителен
      forceLogout();
      return Promise.reject(refreshError);
    }
  }
);
