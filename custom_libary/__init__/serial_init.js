const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const listPortsCb = callbackify(SerialPort.list);

module.exports = { SerialPort, ReadlineParser, listPortsCb };