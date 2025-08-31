import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { callbackify } from 'node:util';

const listPortsCb = callbackify(SerialPort.list);

export { SerialPort, ReadlineParser, listPortsCb };
