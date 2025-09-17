const { dir } = await import('../../dir.js');

const { callbackify, connect , express, app, server, io, Parser_db, fs, sqlite3, SerialPort, ReadlineParser, listPortsCb, promisify, archiver} = await import(`${dir.expression}`);
let data;

let counter_cmd = 0;
let index = 0;

import axios from 'axios'; // Node.js

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


function generateRow(i) {
  const now = new Date().toISOString();
  let data = "";

  data += i + ",";                            // indice
  data += now + ",";                          // TimeStamp
  data += "Falcon9,";                         // RocketName
  data += "433.0,";                           // freq
  data += i + ",";                            // counter
  data += "FLY,";                             // state
  data += "14.8566,";                         // gps_latitude
  data += "100.6362,";                        // gps_longitude
  data += (1000 + i * 10) + ",";              // altitude
  data += (1100 + i * 10) + ",";              // apogee
  data += "3.7,";                             // voltageMon
  data += Math.random().toFixed(2) + ",";     // last_ack
  data += Math.random().toFixed(2) + ",";     // last_nack
  data += (-70 + Math.random() * 2).toFixed(1) + ","; // RSSI
  data += (7 + Math.random()).toFixed(2) + ",";       // SNR
  data += "128";                              // PacketLength
  data += "\n";

  return data;
}

export function  routineData(line){
    let boardData = data["0"]; // assuming single board for API

    const now = new Date();
    line = now.toLocaleTimeString() + "," + line;
    const trimmed = line.trim();
    console.log(`get data CSV:`, trimmed);

    const parts = trimmed.split(boardData.delimiter);
    let dbData = [];
    let IOData = {"boardNumber" : "0"}; // assuming single board for API
    
    if (parts.length === Object.keys(boardData.data_format).length) {
        
        let i = 0
        for (const [nameData, typeData] of Object.entries(boardData.data_format)) {
            dbData.push(String(parts[i]));
            IOData[nameData] = changeDataType(parts[i],typeData);
            i += 1;
        }
        IOData["index"] = index;
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
                routineData(data);
                console.log('API data:', response.data);
            })
            .catch(error => {
                console.error('Error fetching API:', error);
            });
    }, 2000); // fetch every 2 seconds
}

export function setupAPIRoutes() {
    // in your Express server setup// API fetch
    axios.get('http://localhost:3000/simulateCSV', {
        headers: { 'Accept': 'text/csv' }
    })
    .then(response => {
        const lines = response.data.trim().split('\n');
        lines.forEach(line => routineData(line));
        console.log('API data fetched');
    })
    .catch(console.error);

    // Express route
    app.get('/simulateCSV', (req, res) => {
        let csv = "";
        for (let i = 0; i <= 0; i++) {
            csv += generateRow(i);
        }
        res.setHeader('Content-Type', 'text/csv');
        res.send(csv);
    });

    app.post('/simulateJSON', (req, res) => {
        const rows = [];
        for (let i = 0; i <= 0; i++) {
            rows.push(generateRow(i).split(',')); // simple JSON array
        }
        res.json(rows);
    });
}

export function syncData_API(dataIn){
    data = dataIn;
}
