import Cookies from "js-cookie";

const TOKEN_KEY = "auth_token";
const TOKEN_EXPIRY_DAYS = 7;

export const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return Cookies.get(TOKEN_KEY) || null;
};

export const setStoredToken = (token: string): void => {
  Cookies.set(TOKEN_KEY, token, {
    expires: TOKEN_EXPIRY_DAYS,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
};

export const removeStoredToken = (): void => {
  Cookies.remove(TOKEN_KEY);
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    return true;
  }
};

export const getTokenPayload = (token: string): any => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (error) {
    return null;
  }
};
