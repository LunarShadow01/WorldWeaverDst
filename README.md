# World Weaver (dst) 
## Remotely Host and manage don't starve together dedicated servers

this repository includes 2 parts
- A nodejs backend
- A react + vite front end

## compromises and vulnerability (Important)
The entire project is diluted down to the bare bone framework required.
to make the setup process as non technical as possible, even for development.
as such:
* Users are stored locally on disk in the data.json
  not using a database
* The project as it stands now does not implement SSL encryption
  this means that communication outside local machines should be
  separately encrypted to avoid middle man attacks
* Configuring the app is still work in progress for this proof of concept
  thus, manual config editing is still the default way to go
* Given the new authentication system, using pass keys instead of passwords and email/username
  there is no way to generate new users at this time.
* The default user for development purposes has a weak universal pass key

* To summerize the system as it stands right now is a proof of concept, not intended for use
  as an online service or deployment, externalize connections to the server at your own risk

## backend
the backend contains a manager and a socket server
using npm start will setup the web socket
and verify all the directory structure
before scanning the directory structure for
dedicated servers
* npm start will launch the backend
  with nodemon which on hot reload
* hot reloading with nodemon
  will close any dedicated server process
  monitoring the main process
  when hot reloading accures

at the moment the backend
requires 2 variables to be manually set
in the generate file called "data.json"
before it can be used:

a path to a folder containing SteamCMD
* for installing and updating game files

and a valid cluster token issued by a klei account holder
* clusters require a token to start and validate with the authentication servers
* you can generate new cluster tokens or use existing ones
  [on the klei accounts page](https://accounts.klei.com/account/game/servers?game=DontStarveTogether)

optionally other variables can be set:

game_files_dir
* to specific where the game files will be installed to

clusters_dir
* where the world files will be saved to

## front end
since this app is intended to be used
with privately hosted managers
the main page of the app is a list containing
all the saved managers a user has defined

new managers can be added with the plus icon
with the important field being the ip to the manager
* these manager entries are stored locally on device cache

## dev setup
* inside both ./world-weaver and ./Server
1) install depencencies with `npm i`
2) start the node process
  * `npm start` for the server
  * `npm run dev` for the client (world-weaver)