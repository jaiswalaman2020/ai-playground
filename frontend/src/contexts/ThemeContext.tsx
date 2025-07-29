"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Theme } from "@/types";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (mode: "light" | "dark") => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "component-generator-theme";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<Theme>({ mode: "light" });

  useEffect(() => {
    // Check for stored theme preference
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    if (storedTheme) {
      setThemeState({ mode: storedTheme as "light" | "dark" });
    } else {
      // Check system preference
      const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setThemeState({ mode: systemPrefersDark ? "dark" : "light" });
    }
  }, []);

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;

    if (theme.mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Store theme preference
    localStorage.setItem(THEME_STORAGE_KEY, theme.mode);
  }, [theme.mode]);

  const toggleTheme = () => {
    setThemeState((prev) => ({
      mode: prev.mode === "light" ? "dark" : "light",
    }));
  };

  const setTheme = (mode: "light" | "dark") => {
    setThemeState({ mode });
  };

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
