/*server.js */

  // import modules
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

  // directory
const dir = { init: "./custom_libary_server/__init__/",
  function: "./custom_libary_server/function/",
  config: "./config/"
}

  // expression
let expression = {};

  // import express
const { callbackify, connect } = await import(`${dir.init}node_init.js`);
const { express, app, server, io } = await import(`${dir.init}server_init.js`);
const { Parser_db, fs, sqlite3, db } = await import(`${dir.init}db_init.js`);
const { SerialPort, ReadlineParser, listPortsCb } = await import(`${dir.init}serial_init.js`);

  // assign expression
expression.callbackify = callbackify;
expression.connect = connect;
expression.express = express;
expression.app = app;
expression.server = server;
expression.io = io;
expression.Parser_db = Parser_db;
expression.fs = fs;
expression.sqlite3 = sqlite3;
expression.SerialPort = SerialPort;
expression.ReadlineParser = ReadlineParser;
expression.listPortsCb = listPortsCb;

console.log('Setup expression success');

  // read config
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const data_setting = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, dir.config, 'data_setting.json'), 'utf-8')
);
const setting = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, dir.config, 'setting.json'), 'utf-8')
);

const config = {
  "data_setting" : data_setting,
  "setting" : setting
};

console.log('Config success', config);

  // import init function
const { initializeServer } = await import(`${dir.init}server_init.js`);
const { initializeDatabase } = await import(`${dir.init}db_init.js`);

console.log('import init function success');

  // import function
const { syncData_database, configureDatabase, setupDownloadRoutes, resetDatabase } = await import(`${dir.function}fn_database.js`);
const { syncData_serial, configureSerial, startPort } = await import(`${dir.function}fn_serial.js`);
const { syncData_IO, configureIO, setupIOroutes, sendPortAvailable } = await import(`${dir.function}fn_IO.js`);

console.log('import function success');

  // import syncData
const { initSyncData } = await import('./sync_data.js');

console.log('import syncData success');

  // initialize syncData
let data = initSyncData(config.data_setting, db);

console.log('initialize syncData success');

  // export syncData
syncData_database(data);
syncData_serial(data);
syncData_IO(data);

console.log('syncData success');

  // initialize
initializeServer(config.setting);
initializeDatabase(config.data_setting);

console.log('initialize success');

  // Config function
configureDatabase(expression);
configureSerial(expression);
configureIO(expression);

console.log('Config success');

  // main
setupDownloadRoutes();
resetDatabase();
startPort();
setupIOroutes();
sendPortAvailable();

console.log('finish setup');