import { Parser } from 'json2csv';
import fs from 'fs';
import sqlite3Pkg from 'sqlite3';
const sqlite3 = sqlite3Pkg.verbose();
let db = {};

export function initializeDatabase(data_settings) {
    for (const [boardNumber, data_setting] of Object.entries(data_settings)) {
        const sensor_database_name = data_setting.database.sensor_database_name;
        const command_database_name = data_setting.database.command_database_name;

        db[boardNumber] = {sensor: {}, command: {}, nameSensorDB: sensor_database_name, nameCommandDB: command_database_name};

        db[boardNumber].sensor = new sqlite3.Database(`./database/${sensor_database_name}.db`);
        db[boardNumber].command = new sqlite3.Database(`./database/${command_database_name}.db`);
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

export { Parser, fs, sqlite3, db };
