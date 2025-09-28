const { dir } = await import('../../dir.js');

const { callbackify, connect , express, app, server, io, Parser_db, fs, sqlite3, SerialPort, ReadlineParser, listPortsCb, promisify, archiver} = await import(`${dir.expression}`);
let data;

let counter_cmd = 0;
let counter = 0;
let lastCounter = 0;
let index = 0;
let shiftValue = 0;

import deasync from 'deasync';
import axios from 'axios'; // Node.js

function getLastNRows(db, table, column, shiftValue) {
    shiftValue = Math.max(1, shiftValue);
    let done = false;
    let result = [];

    db.all(`
        SELECT ${column} 
        FROM ${table} 
        WHERE rowid > (SELECT MAX(rowid) - ? FROM ${table})
        ORDER BY rowid DESC
    `, [shiftValue], (err, rows) => {
        if (err) throw err;
        result = rows.map(r => r[column]);
        done = true;
    });

    while(!done) { deasync.runLoopOnce(); } // blocks until done
    console.log(result);
    return result;
}

const header = 
  "indice," +
  "TimeStamp," +
  "RocketName," +
  "freq," +
  "counter," +
  "state," +
  "gps_latitude," +
  "gps_longitude," +
  "altitude," +
  "apogee," +
  "voltageMon," +
  "last_ack," +
  "last_nack," +
  "RSSI," +
  "SNR," +
  "PacketLength\n";

function changeDataType(dataIn,dataType){
    switch (dataType) {
        case 'INTEGER':
            return parseInt(dataIn, 10);
        case 'REAL':
            return parseFloat(dataIn);
        case 'TEXT':
            return String(dataIn);
        default:
            return dataIn;
    }
}

function getGenerateData() {
  const now = new Date().toISOString();
  let data = "";

  data += "Falcon9,";                         // RocketName
  data += "433.0,";                           // freq
  data += counter + ",";                            // counter
  data += "FLY,";                             // state
  data += "14.8566,";                         // gps_latitude
  data += "100.6362,";                        // gps_longitude
  data += (1000 + counter * 10) + ",";              // altitude
  data += (1100 + counter * 10) + ",";              // apogee
  data += "3.7,";                             // voltageMon
  data += Math.random().toFixed(2) + ",";     // last_ack
  data += Math.random().toFixed(2) + ",";     // last_nack
  data += (-70 + Math.random() * 2).toFixed(1) + ","; // RSSI
  data += (7 + Math.random()).toFixed(2) + ",";       // SNR
  data += "128";                              // PacketLength
  data += "\n";

  return data;
}

const interval = setInterval(() => {
    counter++;
}, 2000); // run every 2000ms


export function routineData(line){
    let boardData = data["0"]; // assuming single board for API

    const now = new Date();
    line = index + "," + now.toLocaleTimeString() + "," + line;
    const trimmed = line.trim();

    const parts = trimmed.split(boardData.delimiter);

    if(parts[Object.keys(boardData.data_format).findIndex(x => x === "counter")] == lastCounter){
        return;
    }
    lastCounter = parts[Object.keys(boardData.data_format).findIndex(x => x === "counter")];

    // console.log(`get data CSV:`, trimmed);

    let dbData = [];
    let IOData = {"boardNumber" : "0"}; // assuming single board for API
    console.log("data length : " + String(parts.length));
    if (parts.length === Object.keys(boardData.data_format).length) {
        
        let i = 0
        for (const [nameData, typeData] of Object.entries(boardData.data_format)) {
            dbData.push(String(parts[i]));
            i += 1;
        }
        const database_run = `INSERT INTO ${boardData.db.nameSensorDB} 
                        (${Object.entries(boardData.data_format)
                            .map(([key,type]) => `${key}`)
                            .join(", ")}) 
                        VALUES (${Object.entries(boardData.data_format)
                            .map(() => `?`)
                            .join(", ")})`;

        boardData.db.sensor.run(database_run, dbData,
            (err) => {
                if (err) {
                    console.error(`❌ DB sensor ${boardData.db.nameSensorDB} Error:`, err.message);
                } else {
                    console.log('✅ Inserted sensor:', parts);
                }
            }
        );

        shiftValue = Math.min(boardData.shiftValue,index);

        // Usage
        for (const [nameData, typeData] of Object.entries(boardData.data_format)) {
            IOData[nameData] = getLastNRows(boardData.db.sensor, boardData.db.nameSensorDB, nameData, shiftValue);
        }

        index++;
        // ✅ ส่งให้หน้าเว็บ
        io.emit('sensor-data', IOData);
    } 
    else {
        console.log(`cmd length ${parts.length} , format length ${Object.keys(boardData.data_format).length}`);

        const cmd = trimmed;
        // ✅ บันทึกลงฐานข้อมูล
        boardData.db.command.run(`INSERT INTO ${boardData.db.nameCommandDB} (command) VALUES (?)`, [cmd],
            (err) => {
                if (err) {
                    console.error(`❌ DB cmd ${boardData.db.nameCommandDB} Error:`, err.message);
                } else {
                    console.log('✅ Inserted cmd: ', cmd);
                }
            }
        );
        counter_cmd++;
        // ✅ ส่งให้หน้าเว็บ
        IOData.command = cmd;
        IOData.counter = counter_cmd;
        io.emit('cmd-data', IOData);
    }
}

export function initializeAPI() {
    const interval = setInterval(() => {
        axios.get('http://localhost:3000/simulateCSV', {
            headers: {
                'Content': 'text/csv'
            }
            })
            .then(response => {
                routineData(response.data);
                // console.log('API data:', response.data);
            })
            .catch(error => {
                console.error('Error fetching API:', error);
            });
    }, 100); // fetch every 2 seconds
}

export function setupAPIRoutes() {

    // Express route
    app.get('/simulateCSV', (req, res) => {
        let csv = "";
        
        csv += getGenerateData();
        
        res.setHeader('Content-Type', 'text/csv');
        res.send(csv);
    });

    app.post('/simulateJSON', (req, res) => {
        const rows = [];
        for (let i = 0; i <= 0; i++) {
            rows.push(getGenerateData().split(',')); // simple JSON array
        }
        res.json(rows);
    });
}

export function syncData_API(dataIn){
    data = dataIn;
}
