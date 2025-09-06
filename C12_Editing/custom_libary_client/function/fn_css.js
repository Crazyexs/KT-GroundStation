const { id } = await import('../../id.js');

let data;

export function updateAltitude(){
    let nameAlitude = data.setting.key[data.boardNow].altitude;
    let dataAltiude = data[data.boardNow].sensor.dataIn[nameAlitude]
    id.altitude.valueAlt.textContent = dataAltiude[dataAltiude.length - 1];
}

export function updateStage(){
    let nameState = data.setting.key[data.boardNow].state;
    let dataStage = data[data.boardNow].sensor.dataIn[nameState]
    id.stageValue.textContent = "";
    id.stageValue.textContent = dataStage[dataStage.length - 1];
}


export function syncData_css(dataIn){
    data = dataIn
}