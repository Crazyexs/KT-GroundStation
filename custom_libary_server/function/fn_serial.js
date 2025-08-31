let SerialPort, Parser, fs, sqlite3, callbackify;
let data;

function changeDataType(dataIn,dataType){
    switch (dataType) {
        case 'INTEGER':
            return parseInt(dataIn, 32);
        case 'REAL':
            return parseFloat(dataIn);
        case 'TEXT':
            return String(dataIn);
        default:
            return dataIn;
    }
}

export function configureSerial(expression) {
    SerialPort = expression.SerialPort;
    Parser = expression.ReadlineParser;
    fs = expression.fs;
    sqlite3 = expression.sqlite3;
    callbackify = expression.callbackify;
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

        boardData = data[boardNumber];
        boardData.serial = new SerialPort({ path: boardData.COM_PORT, baudRate: boardData.baudRate });
        boardData.parser = boardData.serial.pipe(new ReadlineParser({ delimiter: '\n' }));

        // โค้ดอื่นที่ต้องใช้ serial parser รันต่อที่นี่
        boardData.parser.on('data', (line) => {
            const trimmed = line.trim();
            console.log(`${boardData.COM_PORT} get data CSV:`, trimmed);

            const parts = trimmed.split(boardData.delimiter);
            if (parts.length === Object.keys(boardData.data_format).length) {
                
                let dbData = {};
                let IOData = {boardNumber : boardNumber};
                let i = 0
                for (const [nameData, typeData] of Object.entries(boardData.data_format)) {
                    dbData.push(changeDataType(parts[i], typeData));
                    IOData[nameData] = changeDataType(parts[i], typeData);
                    i += 1;
                }
                const database_run = `INSERT INTO ${boardData.db.nameSensorDB} 
                                (${Object.entries(data_setting.data_format)
                                    .map(([key,type]) => `${key}`)
                                    .join(", ")}) 
                                VALUES (${Object.entries(data_setting.data_format)
                                    .map(() => `?`)
                                    .join(", ")})`;

                boardData.db.sensor.run(database_run, dbData,
                    (err) => {
                        if (err) {
                            console.error(`❌ DB sensor ${boardNumber} Error:`, err.message);
                        } else {
                            console.log('✅ Inserted:', parts);
                        }
                    }
                );

                // ✅ ส่งให้หน้าเว็บ
                io.emit('sensor-data', IOData);
            } 
            else {
                const cmd = trimmed;
                // ✅ บันทึกลงฐานข้อมูล
                boardData.db.command.run(`INSERT INTO ${boardData.db.nameCommandDB} (cmd) VALUES (?)`, [cmd],
                    (err) => {
                        if (err) {
                            console.error(`❌ DB cmd ${boardNumber} Error:`, err.message);
                        } else {
                            console.log('✅ Inserted:', cmd);
                        }
                    }
                );
            
                // ✅ ส่งให้หน้าเว็บ
                io.emit('cmd-data', cmd);
            }

            if (connectOrNot === false) {
                console.log(`🔌 Disconnecting serial ${boardNumber} as per user request...`);
                if (parser) {
                    serial.unpipe(parser);
                    parser.removeAllListeners();
                    parser = null;
                }
                serial.removeAllListeners();
                if (serial.isOpen) {
                    serial.close((err) => {
                    if (err) console.error(`Error closing Serial ${boardNumber}:`, err);
                    else console.log(`Serial ${boardNumber} port closed`);
                    run_port(boardNumber); // เรียกหลังปิด port
                    });
                } else {
                    run_port(boardNumber); // ถ้า port ปิดอยู่แล้ว
                }
                serial = null;
            }
        });

        serial.on('error', (err) => {
            console.error(`❌ Serial ${boardNumber} Error:`, err.message);
            run_port(boardNumber);
        });

        serial.on('close', () => {
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