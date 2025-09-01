const { dir } = await import('../../dir.js');
const { id } = await import('../../id.js');
const { config } = await import(dir.config);

let data;

export function syncData_map(dataIn){
    data = dataIn;
}