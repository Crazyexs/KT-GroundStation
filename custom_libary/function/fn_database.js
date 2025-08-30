/* Dowload CSV file */
let app,Parser,fs,sqlite3,callbackify;

export function configureCSVDownload(expression,db){
  app = expression.app;
  Parser = expression.Parser;
  fs = expression.fs;
  sqlite3 = expression.sqlite3;
  callbackify = expression.callbackify;
  db = db;
}
export function setupDownloadRoutes() {
  app.get('/download_sensor',async (req, res) => {
    const tempFolder = path.join('./', 'temp_csv');

    if (!fs.existsSync(tempFolder)) {
      fs.mkdirSync(tempFolder);
    }
    const dbAll = promisify((database, sql, cb) => database.all(sql, [], cb));

    const promises = [];

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
  for (const [name, database] of Object.entries(db.sensor)) {
    database.run("DELETE FROM " + name);
  }
  for (const [name, database] of Object.entries(db.command)) {
    database.run("DELETE FROM " + name);
  }
}