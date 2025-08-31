const dir = { init: "./__init__/",
  function: "./custom_libary_server/function/",
  config: "./config/"
}

const { callbackify, connect } = await import(`${dir.init}node_init.js`);
const { express, app, server, io } = await import(`${dir.init}server_init.js`);
const { Parser_db, fs, sqlite3} = await import(`${dir.init}db_init.js`);
const { SerialPort, ReadlineParser, listPortsCb } = await import(`${dir.init}serial_init.js`);

export {callbackify, connect, express, app, server, io, Parser_db, fs, sqlite3, SerialPort, ReadlineParser, listPortsCb };