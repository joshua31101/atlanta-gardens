## Atlanta Gardens, Farms, and Orchards

- [Getting Started](#getting-started)
- [Folder Structure](#folder-structure)


## Getting Started
1) Install Node.js and npm
2) Run "npm install" in the root directory
3) Run "npm run dev"
4) Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Folder Structure
```
cs-4400-phase-3/
  node_modules/
  README.md
  package.json
  controllers/
  views/
  server.js
```
* `/controllers` keeps all the controllers/routes.
* `/views` has all the client-side files.
* `server.js` is the node.js server entry file.

You must **create a file `.env` in the root folder for environmental variables to connect to mySQL DB**
```
DB_HOST=value
DB_USERNAME=value
DB_PASSWORD=value
DB_NAME=value
```
