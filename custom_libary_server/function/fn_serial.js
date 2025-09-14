const { dir } = await import('../../dir.js');

const { callbackify, connect , express, app, server, io, Parser_db, fs, sqlite3, SerialPort, ReadlineParser, listPortsCb, promisify, archiver} = await import(`${dir.expression}`);
let data;
let counter_cmd = 0;
let index = 0;

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

function reconnectPort(boardNumber) {
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            if (data[boardNumber].connectOrNot === true) {
                resolve(boardNumber);
                clearInterval(interval);
            }
        }, 1000);
    });
}

function run_port(boardNumber){
    reconnectPort(boardNumber).then((boardNumber) => {
        console.log(`Opening port: ${data[boardNumber].COM_PORT}`);

        let boardData = data[boardNumber];
        console.log(`Connect to Board ${boardNumber} baudRate:`, boardData.baudRate);
        boardData.serial = new SerialPort({ path: boardData.COM_PORT, baudRate: parseInt(boardData.baudRate) });
        boardData.parser = boardData.serial.pipe(new ReadlineParser({ delimiter: '\n' }));

        // โค้ดอื่นที่ต้องใช้ serial parser รันต่อที่นี่
        boardData.parser.on('data', (line) => {
            const now = new Date();
            line = now.toLocaleTimeString() + "," + line;
            const trimmed = line.trim();
            console.log(`${boardData.COM_PORT} get data CSV:`, trimmed);

            const parts = trimmed.split(boardData.delimiter);
            let dbData = [];
            let IOData = {"boardNumber" : boardNumber};
            
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

            if (boardData.connectOrNot === false) {
                console.log(`🔌 Disconnecting serial ${boardNumber} as per user request...`);
                if (boardData.parser) {
                    boardData.serial.unpipe(boardData.parser);
                    boardData.parser.removeAllListeners();
                    boardData.parser = null;
                }
                boardData.serial.removeAllListeners();
                if (boardData.serial.isOpen) {
                    boardData.serial.close((err) => {
                    if (err) console.error(`Error closing Serial ${boardNumber}:`, err);
                    else console.log(`Serial ${boardNumber} port closed`);
                    run_port(boardNumber); // เรียกหลังปิด port
                    });
                } else {
                    run_port(boardNumber); // ถ้า port ปิดอยู่แล้ว
                }
                boardData.serial = null;
            }
        });

        boardData.serial.on('error', (err) => {
            console.error(`❌ Serial ${boardNumber} Error:`, err.message);
            run_port(boardNumber);
        });

        boardData.serial.on('close', () => {
            console.warn(`⚠️ Serial ${boardNumber} port closed, reconnecting...`);
            run_port(boardNumber);
        });
    });
};

export function startPort(){
    for(let boardNumber of Object.keys(data)) {
        run_port(boardNumber);
    }
}

export function syncData_serial(dataIn){
    data = dataIn;
}