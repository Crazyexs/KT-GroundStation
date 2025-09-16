/*server.js */
const express = require('express');
const path = require('path');
const http = require('http');

// Server
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// dowload csv file
const { Parser } = require('json2csv');
const fs = require('fs');

// Port
const PORT = 1234;

// Init page
app.use(express.static(path.join(__dirname, 'public')));

// Serial
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { callbackify } = require('node:util');
const listPorts = callbackify(SerialPort.list);

let serial;
let parser;
const now = new Date();

// data base
let db = new sqlite3.Database('sensor_data.db');
let db_cmd = new sqlite3.Database('cmd.db');
let db_txData = new sqlite3.Database('txData.db');

/*-------------------------------------------------------------------------------------------------*/

//Function list avalable port
async function listAvailablePorts() {
  try {
    // Get all previously granted ports
    const ports = await navigator.serial.getPorts();

    if (ports.length === 0) {
      console.log("No ports available. Requesting a new one...");
      
      // Ask user to select a port
      const newPort = await navigator.serial.requestPort();
      ports.push(newPort);
    }

    // Display available ports
    ports.forEach((port, index) => {
      console.log(`Port ${index + 1}:`, port.getInfo());
    });

    return ports; // Return the list of ports
  } catch (err) {
    console.error("Error listing ports:", err);
    return [];
  }
}












// Find port
function waitForPort() {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      SerialPort.list().then(ports => {
        if (ports.length > 0) {
          clearInterval(interval);
          console.log("Found port:", ports[0].path);
          resolve(ports[0]);
        } else {
          console.log("Waiting for serial port...");
        }
      });
    }, 1000); // เช็คทุก 1 วิ
  });
}

// Find and open port
waitForPort().then(port => {
  console.log(`Opening port: ${port.path}`);

  serial = new SerialPort({ path: port.path, baudRate: 115200 });

)} 

const interval = setinterval

  socket.on('uplink', (msg) => {
    console.log('🔄 Received command from client:', msg);

    // คุณสามารถส่งคำสั่งนี้ออก serial port ได้ เช่น:
    if (serial && serial.writable) {
      serial.write(`cmd ${msg}\n`);
    }
    
  });
});
});

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

//run function