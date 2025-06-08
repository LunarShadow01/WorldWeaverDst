# World Weaver (dst) 
## Remotely Host and manage don't starve together dedicated servers

this repository includes 2 parts
- A nodejs backend
- A react + vite front end

## backend
the backend contains a manager and a socket server
using npm start will setup the web socket
and verify all the directory structure
before scanning the directory structure for
dedicated servers
* npm start will launch the backend
  with nodemon which on hot reload
  will close any dedicated server process
  monitoring the main process

at the moment the backend
requires 2 variables to be manually set
in the generate file called "data.json"
before it can be used:

a path to a folder containing SteamCMD
* for installing and updating game files

and a valid cluster token issued by a dst account holder
* clusters require a token to start and validate with the authentication servers
* you can generate new cluster tokens or use existing ones
  [on the klei accounts page]([https://pages.github.com/](https://accounts.klei.com/account/game/servers?game=DontStarveTogether))

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
2) start the node process with `npm start`

