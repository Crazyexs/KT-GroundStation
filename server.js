/*server.js */
  
  // directory
const dir = { init: "./custom_libary/__init__/",
  function: "./custom_libary/function/",
  config: "./custom_libary/config/"
}

  // expression
let expression = {};

  // read config
const data_setting = require(dir.config + 'data_setting.json');
const setting = require(dir.config + 'setting.json');

const config = {
  "data_setting": data_setting,
  "setting": setting
}

  // import express
import { callbackify, connect } from dir.init + 'node_init.js';
import { express, app, server, io } from dir.init + 'server_init.js';
import { Parser_db, fs, sqlite3,db} from dir.init + 'db_init.js';
import { SerialPort, ReadlineParser, listPortsCb } from dir.init + 'serial_init.js';

expression.callbackify = callbackify;
expression.connect = connect;
expression.express = express;
expression.app = app;
expression.server = server;
expression.io = io;
expression.Parser_db = Parser_db;
expression.fs = fs;
expression.sqlite3 = sqlite3;
expression.ReadlineParser = ReadlineParser;
expression.listPortsCb = listPortsCb;

  // import init function
import {initializeServer} from dir.init + 'server_init.js';
import {initializeDatabase} from dir.init + 'db_init.js';

  // import function  
import { syncData_serial} from dir.function + "fn_serial";
import { syncData_IO} from dir.function + "fn_IO";

  // import syncData
import { initSyncData } from "./sync_data";
let data = initSyncData(config.data_setting, db);

  // export syncData
syncData_serial(data);
syncData_IO(data);

  // initialize
initializeServer();
initializeDatabase(config);






io.on('connection', (socket) => {
  console.log('🌐 Web client connected');

  socket.on('select-port', (data) => {
    COM_PORT = data.port;
    connectOrNot = data.connectOrNot;
    console.log('🔄 Selected port from client:', COM_PORT);
    console.log('🔄 Connect or Disconnect port:', connectOrNot);
  });

  socket.on('uplink', (msg) => {
    console.log('🔄 Received command from client:', msg);

    // คุณสามารถส่งคำสั่งนี้ออก serial port ได้ เช่น:
    if (serial && serial.writable) {
      serial.write(`cmd ${msg}\n`);
    }
    
  });
});

reconnectPort();