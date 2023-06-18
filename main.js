/*
#  UDPR
#  main.js
#
#  Copyright © 2023 Certchip Corp. All rights reserved.
#  Created by GYUYOUNG KANG on 2023/04/15.
#
*/

const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path')
const { clipboard } = require('electron');
const dgram = require('dgram');

var hash = require('bindings')('hash');
//console.log(hash.hash32("cLine2d"));
//console.log(hash.hash64("cLine2d"));

const settings = require('electron-settings');

process.env.NODE_ENV = 'production';

const globals = {};
globals.isDev = process.env.NODE_ENV !== 'production';
globals.isMac = process.platform === 'darwin';
globals.port = 7000;
globals.fontsize = 20;


const loadConfig = () => {
    const config = settings.get('config').then((config) => {
        if (config) {
            if (config.port) globals.port = config.port;
            if (config.fontsize) globals.fontsize = config.fontsize;
            if (config.linenumber) globals.linenumber = config.linenumber;
            if (config.blend) globals.blend = config.blend;
            if (config.tag) globals.tag = config.tag;

            openServer();    

            globals.mainWindow.setTitle(`UDP Message Receiver 1.0.2 : ${globals.port}`);    
            toRenderer({font_size: globals.fontsize, port_number: globals.port, line_number: globals.linenumber, blend_check: globals.blend, tag_check: globals.tag});    
        } else {
            openServer();    

            globals.mainWindow.setTitle(`UDP Message Receiver 1.0.2 : ${globals.port}`);    
            toRenderer({font_size: globals.fontsize, port_number: globals.port, line_number: globals.linenumber, blend_check: globals.blend, tag_check: globals.tag});
        }
    });
}

const saveConfig = () => {
    const config = {
        port: globals.port,
        fontsize: globals.fontsize,
        linenumber: globals.linenumber,
        blend: globals.blend,
        tag: globals.tag
    };
    settings.set('config', config);    
}

function stringToBytes(str) {
    const buffer = Buffer.from(str, 'utf8');
    return Array.prototype.slice.call(buffer, 0);
}
  

// UDP 서버 생성
const openServer = () => {
    globals.server = dgram.createSocket('udp4');

    // 메시지 수신 이벤트 핸들러
    globals.server.on('message', (msg, rinfo) => {
        //console.log(">>>>msg", msg);
        const receivedData = msg.toString('utf8');
        //console.log(">>>>receivedData", receivedData);
        //console.log(`Received message from ${Array.prototype.slice.call(msg, 0)}`);
        //console.log(`Received message from ${rinfo.address}:${rinfo.port}: ${msg}`);
        //const receivedData = msg.toString('utf8')
        //console.log(">>>>receivedData", receivedData);
        //console.log(">>> receivedData", receivedData);

        let msgObj;
        try {
            msgObj = JSON.parse(receivedData);
            //console.log(">>>>msgObj", msgObj);
        } catch (e) {
            //const decoder = new TextDecoder();
            //const string = decoder.decode(msg);
            //console.log(">>>>e", e);
            msgObj = {msg: receivedData};
        }
        toRenderer(msgObj);
    });
    
    // 서버 시작
    globals.server.bind(globals.port, () => {
        console.log(`UDP server listening on port ${globals.port}`);
    });    
}
const closeServer = () => {
    if (globals.server) {
        globals.server.close();
        globals.server = null;
    }
}



const createWindow = () => {
    switch (process.platform) {
        case 'win32': globals.icon = path.join(__dirname, './assets/win', 'icon.ico'); break;
        case 'darwin': globals.icon = path.join(__dirname, './assets/mac', 'icon.icns'); break;
        case 'linux': globals.icon = path.join(__dirname, './assets/linux', 'icon.png'); break;
    }

    globals.mainWindow = new BrowserWindow({
        title: 'UDP Message Receiver',
        width: globals.isDev ? 1220 : 720,
        height: 800,
        webPreferences: {
            nodeIntegration: true,      // is default value after Electron v5
            contextIsolation: true,     // protect against prototype pollution
            enableRemoteModule: false,  // turn off remote
            nativeWindowOpen: true,
            worldSafeExecuteJavaScript: true,
            webviewTag: true,
            preload: path.join(__dirname, 'preload.js')
        },
        frame: true,
        icon: globals.icon
    })

    // 변수 값을 HTML에 적용
    globals.mainWindow.webContents.on('did-finish-load', () => {
        loadConfig();
    });    

    // Open devtools if in dev env
    if (globals.isDev) {
        globals.mainWindow.webContents.openDevTools();
    }
    
    globals.mainWindow.on('closed', () => {
        globals.mainWindow = null;
    }); 

    globals.mainWindow.loadFile('./app/index.html');
}


app.whenReady().then(() => {
    createWindow()
  
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        closeServer();
        app.quit()
    } 
})



// 렌더러로 부터 메시지를 수신한 것이다.
ipcMain.on("r2m", (event, data) => {
    fromRenderer(data);
});

function hash_str_uint32(str) {
    return hash.hash32(str);
}  
function hash_str_uint64(str) {
    return hash.hash64(str);
}
  
function apiProcess(data) {
    if (data.port_number != null) {
        const port = data.port_number * 1;
        if (port > 0 && port < 65536) {
            closeServer();
            setTimeout(() => {
                globals.port = port;
                openServer();    
                globals.mainWindow.setTitle(`UDP Message Receiver 1.0.2 : ${globals.port}`);    
                saveConfig();
            }, 300);
        }
    }
    if (data.fontsize != null) {
        globals.fontsize = data.fontsize;
        saveConfig();
    }
    if (data.tag_check != null) {
        globals.tag = data.tag_check;
        saveConfig();
    }
    if (data.linenumber_check != null) {
        globals.linenumber = data.linenumber_check;
        saveConfig();
    }
    if (data.blend_check != null) {
        if (data.blend_check===true) {
            globals.mainWindow.setAlwaysOnTop(true);
            globals.mainWindow.setOpacity(0.8);
        } else {
            globals.mainWindow.setAlwaysOnTop(false);
            globals.mainWindow.setOpacity(1.0);
        }
        globals.blend = data.blend_check;
        saveConfig();
    }
    if (data.hash_input != null && data.hash_input!=="") {
        const value = data.hash_input.toString().trim();
        if (value !== "") {
            // cLine2d => 711538294
            var hash = hash_str_uint32(value);
            toRenderer({hash_value: value, hash_result: hash});
        }
    }

    if (data.hash64_input != null) {
        const value = data.hash64_input.toString().trim();
        if (value !== "") {
            // cLine2d => -6476917445953505674
            var hash = hash_str_uint64(value);
            toRenderer({hash64_value: value, hash64_result: hash});
        }
    }
}

// 렌더러로 부터 온 메시지를 처리한다.
function fromRenderer(data) {
    if ( typeof data === 'object' ) {
        console.log(`Data from renderer json ${JSON.stringify(data)}`);
        apiProcess(data);
    } else {
        console.log(`Data from renderer ${data}`);
    }
}
// 렌더러로 메시지를 보낸다.
function toRenderer(data) {    
    globals.mainWindow.webContents.send("m2r", data);
}
