const { app, BrowserWindow, ipcMain, dialog } = require("electron");

// ========================================
// ------------zoom sdk logic--------------
// ========================================
const ZOOMSDKMOD = require("../lib/zoom_sdk.js");
const MEETING_STATUSES = {
  0: 'MEETING_STATUS_IDLE',
  1: 'MEETING_STATUS_CONNECTING',
  2: 'MEETING_STATUS_WAITINGFORHOST',
  3: 'MEETING_STATUS_INMEETING',
  4: 'MEETING_STATUS_DISCONNECTING',
  5: 'MEETING_STATUS_RECONNECTING',
  6: 'MEETING_STATUS_FAILED',
  7: 'MEETING_STATUS_ENDED',
  8: 'MEETING_STATUS_UNKNOW',
  9: 'MEETING_STATUS_LOCKED',
  10: 'MEETING_STATUS_UNLOCKED',
  11: 'MEETING_STATUS_IN_WAITING_ROOM',
  12: 'MEETING_STATUS_WEBINAR_PROMOTE',
  13: 'MEETING_STATUS_WEBINAR_DEPROMOTE',
  14: 'MEETING_STATUS_JOIN_BREAKOUT_ROOM',
  15: 'MEETING_STATUS_LEAVE_BREAKOUT_ROOM'
}


let sdkReady = false;

let zoomsdk = null;
let zoomauth = null;
let zoommeeting = null;
let win;

let originalConsoleLog = console.log
const mylog = function (...args) {
  win.webContents.send('log', { args })
  console.log('[MAIN PROCESS]', ...args)
}

// get sdk instance
function setZoomSDKInstance() {
  zoomsdk = ZOOMSDKMOD.ZoomSDK.getInstance({
    path: '../lib/zoomsdk/build/Release/',
    threadsafemode: 0,
    apicallretcb: function (apiname, ret) {
      mylog(`[info][api called] apiname: ${apiname}, ret: ${ret}`);
      if ("InitSDK" == apiname && ZOOMSDKMOD.ZoomSDKError.SDKERR_SUCCESS == ret) {

        // get zoom auth module
        zoomauth = zoomsdk.GetAuth({
          authcb: status => {
            // it's the callback after auth, can be triggered if zoom sdk runs in main process
            mylog("[info][auth callack] status", status);
            sdkReady =
              status === ZOOMSDKMOD.ZOOMAUTHMOD.ZoomAuthResult.AUTHRET_SUCCESS;
          }
        });

        // get zoom meeting module
        zoommeeting = zoomsdk.GetMeeting({
          meetingstatuscb: (...args) => mylog(
            '[info][meeting status callback]',
            MEETING_STATUSES[args[0]]
          ),
          meetinguserjoincb: (...args) => mylog(
            '[info][meeting user join callback]',
            JSON.stringify(args[0])
          ),
          meetinguserleftcb: (...args) => mylog(
            '[info][meeting user left callback]',
            JSON.stringify(args[0])
          )
        });

        mylog('[info]calling sdk auth');
        zoomauth.SDKAuth(
          "PWT7phpeZP00QnlSCXik2vjEzMgdQIJGWqeN",
          "UG6N5OOSgGUuxb0FSzyJW2gPZItojqoEwImp"
        );
      }
    },
    ostype: ZOOMSDKMOD.ZOOM_TYPE_OS_TYPE.WIN_OS
  });
}


// join a schueled meeting
ipcMain.on("join", () => {
  if (!sdkReady) {
    dialog.showOpenDialog({
      title: 'sdk not ready because auth not successful'
    })
    return
  };
  mylog('[info]joining meeting 8700073849');
  zoommeeting.JoinMeeting({
    meetingnum: 8700073849,
    psw: "test",
    username: "2333"
  });
});

ipcMain.on("leave", () => {
  if (!sdkReady) {
    dialog.showOpenDialog({
      title: 'sdk not ready because auth not successful'
    })
    return
  };
  mylog('[info]leave meeting 8700073849');
  sdkReady && zoommeeting.LeaveMeeting();
});

// ========= electron logic =========

function createWindow() {
  win = new BrowserWindow({ width: 1200, height: 900 });
  win.loadURL(__dirname + "/index.html");
  win.webContents.openDevTools();

  // init zoom sdk 
  setZoomSDKInstance();
  setTimeout(() => {
    zoomsdk.InitSDK({
      webdomain: "https://www.zoom.us",
      langid: ZOOMSDKMOD.ZoomSDK_LANGUAGE_ID.LANGUAGE_English
    });
  }, 1000)

}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (win === null) {
    createWindow();
  }
});