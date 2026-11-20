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

The installed Windows app checks GitHub Releases when the user clicks **Update app**, then downloads the installer. The user can restart the app to install the downloaded update. Installer assets are published to the public `riteshainable-arch/allrounder-pos` repository; the source code can remain private.

Before publishing:

1. Create a fine-grained personal access token with **Contents: Read and write** permission for `riteshainable-arch/allrounder-pos`.
2. In this source repository, add the token under **Settings → Secrets and variables → Actions** as `RELEASE_REPO_TOKEN`.

To publish a new Windows build, increment the version in `package.json` and `package-lock.json` (for example, run `npm version patch --no-git-tag-version`), commit the version change together with the code changes, and push or merge to `main`. GitHub Actions builds the installer and publishes a release. The first release can also be started with **Actions → Publish Windows release → Run workflow**. Each release must have a higher version than the previous one.

The new release repository currently has no releases, so the updater cannot offer an update until the first Windows release is published. Builds already installed on cashiers' machines keep the update feed URL bundled when they were built; install the first build using this release repository manually before relying on future in-app updates.
