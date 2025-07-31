---
applyTo: .github/instructions/Release.instructions.md
---

When asked to create a new release, please follow these steps:

1. **Update Version Number**: Increment the version number in `package.json`, `src-tauri/Cargo.toml`, and `src-tauri/tauri.conf.json` to reflect the new release version.
2. **Update Changelog**: Add a new section in `CHANGELOG.md` for the new version, detailing the changes made since the last release.
3. **Commit Changes**: Commit the changes with a message like "Bump version to x.x.x".
4. **Push to Release Branch**: Push the changes to the `release` branch to trigger the publish workflow.
5. **Monitor Workflow**: Check the GitHub Actions tab to ensure the workflow runs successfully and creates the release.
6. **Note**: Don't create a new git tag manually - it is created automatically by the GitHub Action when the workflow runs.

You can refer to the `.github/workflows/publish.yml` file for details on how the release process is automated.
