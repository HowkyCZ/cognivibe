# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

# Generating Icons
To generate icons for your Tauri application, you can use the [Tauri Icon Generator](https://tauri.app/v1/guides/icons/).

Update only the app-icon.png file and run:

```bash
npm run tauri icon
```

# Tech opinions
## Keylogging
rdev is used

## Local dashboard data (mock/demo mode)

If you want to test the dashboard UI (chart/cards) without running the server or seeding a database, you can enable a local mock response in the Tauri backend:

```bash
COGNIVIBE_USE_MOCK_DATA=1 npm run tauri:dev
```

This makes the `fetch_batch_scores_cmd` command return generated sample scores for the selected date range.