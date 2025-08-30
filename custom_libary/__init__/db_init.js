const { Parser } = require('json2csv');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
let db = {};

export function initializeDatabase(data_settings) {
    for (const [boardNumber, data_setting] of Object.entries(data_settings.data_format)) {
        db[boardNumber] = {sensor: {}, command: {}, nameSensorDB:sensor_database_name, nameCommandDB:command_database_name};

        const sensor_database_name = data_setting.database.sensor_database_name;
        const command_database_name = data_setting.database.command_database_name;

        db[boardNumber].sensor = new sqlite3.Database(`${sensor_database_name}.db`);
        db[boardNumber].command = new sqlite3.Database(`${command_database_name}.db`);
        for(const [key, value] of Object.entries(data_setting.data_format)) {
            db[boardNumber].sensor.run(`DROP TABLE IF EXISTS ${sensor_database_name}`);
            db[boardNumber].command.run(`DROP TABLE IF EXISTS ${command_database_name}`);

            const columns_sensor = Object.entries(data_setting.data_format)
                .map(([key, type]) => `${key} ${type}`)
                .join(", ");
            const columns_command = "command TEXT";
            db[boardNumber].sensor.run(`CREATE TABLE IF NOT EXISTS ${sensor_database_name} (${columns_sensor})`);
            db[boardNumber].command.run(`CREATE TABLE IF NOT EXISTS ${command_database_name} (${columns_command})`);
        }
    }
}


module.exports = { Parser, fs, sqlite3, db };