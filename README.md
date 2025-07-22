# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Getting Started

1. Copy `.env.example` to `.env` and provide your Firebase configuration values.
2. Install dependencies and start the development server:

   ```bash
   npm install
   npm run dev
   ```
3. In your Firebase console, open **Authentication** → **Sign-in method** and enable the **Google** provider.

## Mobile Friendly

The layout adjusts to small screens. Navigation buttons stack vertically and tables scroll horizontally when needed so the app works well on phones and desktops.
