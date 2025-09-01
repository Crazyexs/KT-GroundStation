const { dir } = await import('../../dir.js');
const { id } = await import('../../id.js');
const { config } = await import(dir.config);

let data;

export function initializeUplink(){

}

export function uplink(){

}

export function syncData_uplink(dataIn){
    data = dataIn;
}