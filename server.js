/*server.js */

  // import modules
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

  // directory
const dir = { 
  init: "./custom_libary_server/__init__/",
  function: "./custom_libary_server/function/",
  config: "./config/",
  expression: "./custom_libary_server/expression.js"
};

  // import express
const { callbackify, connect , express, app, server, io, Parser_db, fs, sqlite3, SerialPort, ReadlineParser, listPortsCb} = await import(`${dir.expression}`);

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
const { initializeDatabase, syncData_initializeDatabase } = await import(`${dir.init}db_init.js`);

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
let data = initSyncData(config.data_setting);

console.log('initialize syncData success');

  // export syncData
syncData_initializeDatabase(data);
syncData_database(data);
syncData_serial(data);
syncData_IO(data);

console.log('syncData success');

  // initialize
initializeServer(config.setting);
initializeDatabase(config.data_setting);

console.log('initialize success');

console.log('Config success');

  // main
setupDownloadRoutes();
resetDatabase();
startPort();
setupIOroutes();
sendPortAvailable();

console.log('finish setup');

console.log('Data:', data);