const { dir } = await import('../../dir_client.js');
const { id } = await import('../../id.js');

let data;
let rocketMarker;

export function initializeMap(){
    const map = L.map(id.map).setView([13.7563, 100.5018], data.setting.key[data.boardNow].map.zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map);
    rocketMarker = L.marker([13.7563, 100.5018]).addTo(map).bindPopup('Rocket Location');
}

export function updateMap(){
    const dataIn = data[data.boardNow].sensor.dataIn;
    const nameLat = data.setting.key[data.boardNow].map.lat
    const nameLon = data.setting.key[data.boardNow].map.lon
    const dataLat = dataIn[nameLat][dataIn[nameLat].length - 1]
    const dataLon = dataIn[nameLon][dataIn[nameLon].length - 1]
    if (Number.isFinite(parseFloat(dataLat)) && Number.isFinite(dataLon))  rocketMarker.setLatLng([dataLat, dataLat]);
}

export function syncData_map(dataIn){
    data = dataIn;
}