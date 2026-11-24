# Жизненный цикл сессии: React + TypeScript + Axios + Zustand

## Запуск
```bash
npm install
npm start        # mock-сервер (порт 4000) + Vite (порт 5173)
```
Откройте http://localhost:5173 — логин `admin`, пароль `123456`.

## Что где
| Требование | Файл |
|---|---|
| Форма входа → `/auth/login`, сохранение токенов | `src/pages/LoginPage.tsx`, `src/store/authStore.ts` |
| Request-interceptor (Authorization) | `src/api/axios.ts` |
| Response-interceptor: 401 → `/auth/refresh` → повтор запроса | `src/api/axios.ts` |
| Неудачный refresh → редирект на `/login` | `forceLogout()` в `src/api/axios.ts` |
| Восстановление после F5 | `persist` в `authStore.ts` (localStorage) |
| Выход: удаление токенов и сброс Zustand | `logout()` в `authStore.ts` |
| Защита маршрутов | `src/components/ProtectedRoute.tsx` |

## Как проверить
1. Войти → на странице профиля нажать «Защищённый запрос» (токен прикреплён).
2. Подождать 15 сек (access протухнет) или нажать «Испортить access» → «Защищённый запрос»: пройдёт refresh и запрос повторится.
3. «Испортить access и refresh» → «Защищённый запрос»: редирект на `/login`, localStorage очищен.
4. F5 на `/profile` — пользователь остаётся авторизованным.
5. «Выйти» — в localStorage нет ключа `auth-storage`, `/profile` недоступен.
