<p align="center">
  <img src="https://s7.gifyu.com/images/GifCroppedTran.gif"/>
</p>


# Tdarr_Plugins

Visit the docs for more info:
https://docs.tdarr.io/docs/plugins/basics


### Development

Make sure NodeJS v16 is installed

Install dependencies:

`npm install`

Run ESLint:

`npm run lint:fix`

Check plugins using some extra custom rules:

`npm run checkPlugins`

Run tests:

`npm run test`


# Steps to write a Tdarr Flow plugin:

1. Clone this repo
2. Set env variable `pluginsDir` to the location of the plugins repo and run Tdarr Server and Node. E.g. `export pluginsDir=C:/Tdarr_Plugins`
3. Browse the typescript plugins here https://github.com/HaveAGitGat/Tdarr_Plugins/tree/master/FlowPluginsTs/CommunityFlowPlugins and make edits locally or create a new one locally: 
4. Make sure typescript is intalled with `npm i -g typescript` then run `tsc` to compile the changes.
5. Refresh the browser and Tdarr will pick up the changes

Note, `pluginsDir` directories that contain a `.git` folder (such as when cloning this repo) will cause Tdarr to skip plugin updates to prevent overwriting development changes.


