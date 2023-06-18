/*
#  UDPR
#  preload.js
#
#  Copyright © 2023 Certchip Corp. All rights reserved.
#  Created by GYUYOUNG KANG on 2023/04/15.
#
*/

const { contextBridge, ipcRenderer } = require("electron");

// 여기서 "api" 를 주면
// renderrer.js 같은곳에서 (여기서는 script.js) 에서 window.api 를 쓸 수 있다.

contextBridge.exposeInMainWorld( "webContents", {
      send: (channel, data) => {
          let validChannels = ["r2m"]; // IPC채널들 추가
          if (validChannels.includes(channel)) {
              ipcRenderer.send(channel, data);
          }
      },
      receive: (channel, func) => {
          let validChannels = ["m2r"]; // IPC채널들 추가
          if (validChannels.includes(channel)) {
              ipcRenderer.on(channel, (event, ...args) => func(...args));
          }
      }
  }
);
