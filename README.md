## This demo shows zoomsdk works in main process in electron, but not in renderer process where `SDKAuth` never trigger `authcb`

## usage

### requirements

- electron: 1.4.13
- node: 6.10.3

### install

- `npm i`

### main process

- `npm run start:main`

in terminal console you can see zoomsdk init and auth successfully, and clicking join meeting button can invoke native zoom interface

### renderer process

- `npm run start:renderer`

in broswer console you can see after call `SDKAuth`, `authcb` never triggered. I've checked network packets with wireshark, in main process zoomsdk made a `/sdk/auth` post request, but in renderer process it didn't