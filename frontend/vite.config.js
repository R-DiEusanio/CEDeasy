import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Questo dice a Vite che il tuo sito ha più di una "porta d'ingresso"
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        register: resolve(__dirname, 'register.html'),
        // Se hai anche login.html, aggiungilo qui sotto:
        // login: resolve(__dirname, 'login.html')
      },
    },
  },
  server: {
    // Questo aiuta Vite a non "rimbalzare" sempre sulla index durante lo sviluppo
    historyApiFallback: false 
  }
});