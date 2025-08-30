/* Dowload CSV file */
let app,Parser,fs,sqlite3,callbackify;
let data;

export function configureDatabase(expression){
  app = expression.app;
  Parser = expression.Parser;
  fs = expression.fs;
  sqlite3 = expression.sqlite3;
  callbackify = expression.callbackify;
}

export function setupDownloadRoutes() {
  app.get('/download_sensor',async (req, res) => {
    const tempFolder = path.join('./', 'temp_csv');

    if (!fs.existsSync(tempFolder)) {
      fs.mkdirSync(tempFolder);
    }
    const dbAll = promisify((database, sql, cb) => database.all(sql, [], cb));

    const promises = [];

    for(const [boardNumber, value] of Object.values(data)) {
      db = value.db;
      for (const [name, database] of Object.entries(db.sensor)) {
        const p = dbAll(database, `SELECT * FROM ${name}`).then(rows => {
          const csv = new Parser().parse(rows);
          fs.writeFileSync(path.join(tempFolder, `${name}.csv`), csv);
        });
        promises.push(p);
      }
      for (const [name, database] of Object.entries(db.command)) {
        const p = dbAll(database, `SELECT * FROM ${name}`).then(rows => {
          const csv = new Parser().parse(rows);
          fs.writeFileSync(path.join(tempFolder, `${name}.csv`), csv);
        });
        promises.push(p);
      }
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
  app.post('/reset-db', (req, res) => {
    for (const [name, database] of Object.entries(data)) {
      database.sensor.run("DELETE FROM " + name);
      database.command.run("DELETE FROM " + name);
    }
    res.send("Database reset");
  });
}

export function syncData_database(dataIn){
  data = dataIn;
}