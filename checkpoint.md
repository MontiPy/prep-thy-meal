## Next session plan

- Ensure Node 22 is active in the repo shell: `export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 22.18.0 && node -v`.
- Clean install deps then add MUI: `rm -rf node_modules package-lock.json && npm install && npm install @mui/material @emotion/react @emotion/styled @mui/icons-material @mui/x-data-grid`.
- Remove Tailwind usage/config once MUI is in: delete Tailwind/PostCSS entries and strip Tailwind classes from components.
- Wrap app with MUI `ThemeProvider` + `CssBaseline`; rebuild shell nav with MUI AppBar/Tabs/BottomNavigation.
- Rebuild Planner and Ingredients screens with MUI components (Cards, Grid, TextField, Select, Buttons; DataGrid for ingredients table) and keep 3-col card grid default.
- Verify UI and rerun `npm test` if available after migration.
