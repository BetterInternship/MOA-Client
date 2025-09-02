# BetterInternship MOA

A platform for managing MOAs and other similar agreements.

## Running Locally

```bash
npm run dev
```

## Build Client API

```bash
npm run spec
```

## Code Formatting with Prettier

This project uses Prettier to maintain a consistent code style.

### Manual Formatting

Format all files in the codebase:
```bash
npm run format
```

Check for formatting issues without changing files:
```bash
npm run format:check
```

### Auto-format on Save (Recommended)

If you’re using VS Code:

1. Install the Prettier - Code formatter extension.
2. Open your settings.json (Command Palette → "Preferences: Open Settings (JSON)") and add:
```
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true
}
```
3. Save any file — it will be automatically formatted.
    > Note: Build output folders and dependencies (like .next and node_modules) are ignored via .prettierignore.