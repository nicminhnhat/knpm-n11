import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Khi deploy GitHub Pages theo dạng https://user.github.io/repo-name,
  // đặt VITE_BASE_PATH="/repo-name/" trong GitHub Actions hoặc file .env.production.
  base: process.env.VITE_BASE_PATH || "/"
});
