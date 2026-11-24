import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TokenPair, User } from "../api/types";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;

  /** Сохранить сессию после успешного входа */
  setSession: (tokens: TokenPair, user: User) => void;
  /** Обновить только токены (после /auth/refresh) */
  setTokens: (tokens: TokenPair) => void;
  /** Полная очистка сессии: токены, пользователь, localStorage */
  logout: () => void;
}

export const AUTH_STORAGE_KEY = "auth-storage";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,

      setSession: (tokens, user) =>
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user,
        }),

      setTokens: (tokens) =>
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        }),

      logout: () => {
        set({ accessToken: null, refreshToken: null, user: null });
        // persist перезаписывает ключ пустым состоянием — удаляем его целиком
        useAuthStore.persist.clearStorage();
        localStorage.removeItem(AUTH_STORAGE_KEY);
      },
    }),
    {
      name: AUTH_STORAGE_KEY, // ключ в localStorage
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        user: s.user,
      }),
    }
  )
);

/** Пользователь считается авторизованным, пока есть токены. */
export const selectIsAuthenticated = (s: AuthState) =>
  s.accessToken !== null && s.refreshToken !== null;
