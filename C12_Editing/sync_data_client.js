const { dir } = await import('./dir_client.js');
console.log("dir success");

const uplink = await fetch(`${dir.config_sync_data}uplink.json`).then(res => res.json());
console.log("uplink.json loaded", uplink);

const data_setting = await fetch(`${dir.config_sync_data}data_setting.json`).then(res => res.json());
console.log("data_setting.json loaded", data_setting);

const setting = await fetch(`${dir.config_sync_data}setting.json`).then(res => res.json());
console.log("setting.json loaded", setting);

let data = {};

export function initSyncData(){
    data.data_setting = data_setting;
    data.setting = setting;
    data.uplink = uplink;

    data.connectOrNot = false;
    data.setting = setting;
    data.portAvailable = null;
    data.boardNow = null;
    for (let name of Object.keys(data_setting)) {
        data[name] = {
            data_format: data_setting[name].data_format,
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
            updateDataOrNot: {
                sensor: false,
                command: false
            },
            n_chart: 0,
            charts: [],
            chartOptions: [],
            chartOptions3D: [],
            storageChart: [],
            shiftValue: setting.key[name].shiftValue,
            showValue: setting.key[name].showValue,
            lastUplink: [],
            workingPage: {
                n_chart: 0,
                charts: [],
                chartOptions: [],
            }
        };
        data[name].sensor.priority = {};
        data[name].groundAltitude = 1000;
        for(let [dataName,dataType] of Object.entries(data_setting[name].data_format)){
            data[name].sensor.dataIn[dataName] = [];
            data[name].sensor.dataType[dataName] = dataType;
            data[name].sensor.priority[dataName] = [];
        }
    }
    return data;
}