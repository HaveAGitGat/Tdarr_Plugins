<p align="center">
  <img src="https://s7.gifyu.com/images/GifCroppedTran.gif"/>
</p>

# Tdarr_Plugins

Visit the docs for more info:
https://docs.tdarr.io/docs/plugins/basics

### Development

#### 1. Install NodeJS v22 via nvm

nvm (Node Version Manager) lets you install and switch between Node.js versions.

- macOS / Linux: follow the install instructions at https://github.com/nvm-sh/nvm (copy the `curl` command from that page and paste it into your terminal). Then **close and reopen your terminal**.
- Windows: install nvm-windows instead from https://github.com/coreybutler/nvm-windows/releases (download `nvm-setup.exe` and run it).

Then install and use Node 22:

```
nvm install 22
nvm use 22
```

Verify:

```
node -v
npm -v
```

You should see a version starting with `v22.`.

#### 2. Clone this repo

In your terminal, navigate to where you want the code (for example your home folder or `C:/`), then run:

```
git clone https://github.com/HaveAGitGat/Tdarr_Plugins.git
cd Tdarr_Plugins
```

#### 3. Install dependencies

From inside the `Tdarr_Plugins` folder:

`npm install`

#### 4. Common commands

Run ESLint (auto-fix code style issues):

`npm run lint:fix`

Check plugins using some extra custom rules:

`npm run checkPlugins`

Run tests:

`npm run test`

Run flow plugin tests:

`npm run test:flows`

# Steps to write a Tdarr Flow plugin:

1. Clone this repo (see step 2 above if you haven't already).
2. Open a terminal and set the `pluginsDir` env variable to the location where you cloned this repo. Use the command that matches your OS / shell:
   - macOS / Linux: `export pluginsDir=/path/to/Tdarr_Plugins`
   - Windows (PowerShell): `$env:pluginsDir="C:/Tdarr_Plugins"`
   - Windows (Command Prompt): `set pluginsDir=C:/Tdarr_Plugins`

   Then, **in the same terminal** (so it inherits the env variable), start Tdarr Server or Tdarr Node by running its executable. For example:
   - macOS / Linux: `./Tdarr_Server` or `./Tdarr_Node`
   - Windows: `Tdarr_Server.exe` or `Tdarr_Node.exe`

   The env variable only applies to processes started from that same terminal session. If you close the terminal, you will need to set the variable again before starting Tdarr.

3. Browse the typescript plugins here https://github.com/HaveAGitGat/Tdarr_Plugins/tree/master/FlowPluginsTs/CommunityFlowPlugins and edit one locally, or create a new one.
4. Install TypeScript globally with `npm i -g typescript@5.9.3`, then run `tsc` from the repo folder to compile your changes. `tsc` reads the TypeScript sources from `FlowPluginsTs/` and writes the compiled JavaScript into `FlowPlugins/` (the folder Tdarr actually loads). Do not edit files under `FlowPlugins/` directly, they will be overwritten on the next `tsc` run.
5. Refresh the browser and Tdarr will pick up the changes.

Note: `pluginsDir` directories that contain a `.git` folder (such as when cloning this repo) will cause Tdarr to skip plugin updates, to prevent overwriting your development changes.
