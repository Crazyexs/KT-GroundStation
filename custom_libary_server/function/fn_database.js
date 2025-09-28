/* Dowload CSV file */
const { dir } = await import('../../dir.js');

const { callbackify, connect , express, app, server, io, Parser_db, fs, sqlite3, SerialPort, ReadlineParser, listPortsCb, promisify, archiver} = await import(`${dir.expression}`);
let data;
let p;

import path from "path";

export function setupDownloadRoutes() {
  app.get('/download_database',async (req, res) => {
    const tempFolder = path.join('./', 'temp_csv');

    if (!fs.existsSync(tempFolder)) {
      fs.mkdirSync(tempFolder);
    }
    const dbAll = promisify((database, sql, cb) => database.all(sql, [], cb));

    const promises = [];

    for(const [boardNumber, value] of Object.entries(data)) {
      let db = value.db;
      console.log(db)
      // for (const [name, database] of Object.entries(db.sensor)) {
        p = dbAll(db.sensor, `SELECT * FROM ${db.nameSensorDB}`).then(rows => {
          if (!rows || rows.length === 0) {
            console.warn(`No data found in ${db.nameSensorDB}, creating empty CSV with headers`);
            return;
          }
          const csv = new Parser_db({ fields: Object.keys(rows[0]) }).parse(rows);
          fs.writeFileSync(path.join(tempFolder, `${db.nameSensorDB}.csv`), csv);
        });
        promises.push(p);
      // }
      // for (const [name, database] of Object.entries(db.command)) {
        p = dbAll(db.command, `SELECT * FROM ${db.nameCommandDB}`).then(rows => {
          if (!rows || rows.length === 0) {
            console.warn(`No data found in ${db.nameCommandDB}, creating empty CSV with headers`);
            return;
          }
          const csv = new Parser_db({ fields: Object.keys(rows[0]) }).parse(rows);
          fs.writeFileSync(path.join(tempFolder, `${db.nameCommandDB}.csv`), csv);
        });
        promises.push(p);

      // }
    }
    await Promise.all(promises); // wait until all CSVs are written

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=data.zip');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);
    archive.directory(tempFolder, false); // add all files from temp folder
    archive.finalize();

    // 4️⃣ Optional: cleanup temp folder after sending
    archive.on('end', () => {
      fs.rmSync(tempFolder, { recursive: true, force: true });
    });
  });
}


export function resetDatabase(){
  app.get('/reset-db', (req, res) => {
    console.log("Database reset")
    for(const [boardNumber,boardData] of Object.entries(data)){
      const databaseData = boardData.db;
      databaseData.sensor.run("DELETE FROM " + databaseData.nameSensorDB);
      databaseData.command.run("DELETE FROM " + databaseData.nameCommandDB);
    }
    res.send("Database reset");
  });
}

export function syncData_database(dataIn){
  data = dataIn;
}