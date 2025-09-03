import { id } from "./id";
const { uplink } = await import(`${dir.config}uplink.json`);
const { data_setting } = await import(`${dir.config}data_setting.json`);
const { setting } = await import(`${dir.config}setting.json`);

let data = {};

export function initSyncData(data_setting){
    data.data_setting = data_setting;
    data.setting = setting;
    data.portAvailable = null;
    data.boardNow = null;
    for (let name of Object.keys(data_setting)) {
        data[name] = {
            data_format: data_setting[data.boardNow]_format,
            sensor: {
                dataIn: {},
                dataType: {}
            },
            command: {
                counter: null,
                command: null
            },
            map: {
                lat: null,
                lon: null,
                alt: null
            },
            updataDataOrNot: {
                sensor: false,
                command: false
            },
            n_chart: 0,
            charts: [],
            shiftValue: setting[data.boardNow].shiftValue
        };
        for(let [dataName,dataType] of Object.entries(data_setting.data_format)){
            data[name].sensor.dataIn[dataName] = null;
            data[name].sensor.dataType[dataName] = dataType;
        }
    }
    data.uplink = uplink;
    return data;
}