# electron

An Electron application with React

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```

### Windows automatic updates

The installed Windows app checks GitHub Releases when the user clicks **Update app**, then downloads the installer. The user can restart the app to install the downloaded update. Installer assets are published to the public `riteshainable-arch/allrounder-pos` repository. The release workflow uses the repository's built-in `GITHUB_TOKEN`; no personal access token is required.

To publish a new Windows build, increment the version in `package.json` and `package-lock.json` (for example, run `npm version patch --no-git-tag-version`), commit the version change together with the code changes, and push or merge to `main`. GitHub Actions builds the installer and publishes a release. The first release can also be started with **Actions → Publish Windows release → Run workflow**. Each release must have a higher version than the previous one.

Before publishing, set the repository Actions variable `VITE_BASE_URL` to the absolute HTTP(S) base URL of the backend API. Add it under **Settings → Secrets and variables → Actions → Variables**. Vite bundles this value into the app, so it must be a non-secret URL without embedded credentials; do not put tokens or passwords in it. The release workflow validates that this variable is present before building.

The first build using this release repository must be installed manually. Later builds can be downloaded from within the installed app.
