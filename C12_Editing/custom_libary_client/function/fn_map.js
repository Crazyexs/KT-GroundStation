const { dir } = await import('../../dir_client.js');
const { id } = await import('../../id.js');
const { config } = await import(dir.config);

let data;
let map,rocketMarker;
export function initializeMap(){
    map = L.map(id.map).setView([13.7563, 100.5018], data.setting.key[data.boardNow].map.zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(id.map);
    rocketMarker = L.marker([13.7563, 100.5018]).addTo(id.map).bindPopup('Rocket Location');
}

export function updateMap(){
    if (Number.isFinite(parseFloat(data.map.lat)) && Number.isFinite(parseFloat(data.map.lon)))  rocketMarker.setLatLng([data.map.lat, data.map.lon]);
}

export function syncData_map(dataIn){
    data = dataIn;
}