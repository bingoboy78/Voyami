export const USER_COOKIE_NAME = 'current_user_id';

/**
 * Читает значение куки по имени на клиенте.
 */
export function getCookie(name: string): string | null {
  if (typeof window === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

/**
 * Устанавливает куку на клиенте.
 */
export function setCookie(name: string, value: string, days = 365) {
  if (typeof window === 'undefined') return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `; expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value || ''}${expires}; path=/; SameSite=Lax`;
}

/**
 * Удаляет куку на клиенте.
 */
export function deleteCookie(name: string) {
  if (typeof window === 'undefined') return;
  document.cookie = `${name}=; Max-Age=-99999999; path=/; SameSite=Lax`;
}

export function getUserIdCookie(): string | null {
  return getCookie(USER_COOKIE_NAME);
}

export function setUserIdCookie(userId: string) {
  setCookie(USER_COOKIE_NAME, userId);
}

export function deleteUserIdCookie() {
  deleteCookie(USER_COOKIE_NAME);
}
