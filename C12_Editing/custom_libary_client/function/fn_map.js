const { dir } = await import('../../dir_client.js');
const { id } = await import('../../id.js');

let data;

let map;
let rocketMarker;
let ourPosition;
let Location;
let LocationState = {};

let stateNow = "";

function getGoogleMapsPinLink(lat, lng) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function initializeMap(){
    map = L.map(id.map).setView([15.036422727194878, 100.9128553472129], data.setting.key[data.boardNow].map.zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map);
    rocketMarker = L.marker([14.8566086, 100.6362539,12]).addTo(map).bindPopup('Rocket Location');
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            Location = L.marker([lat, lng]).addTo(map).bindPopup("Location From Map")

            // Optionally move map view to this location
            map.setView([lat, lng], 13);
        });
        } else {
        alert("Geolocation is not supported by this browser.");
    }
    ourPosition = L.marker([15.036422727194878, 100.9128553472129]).addTo(map).bindPopup('Ground Station');
    
}

export function updateMap(){
    const dataIn = data[data.boardNow].sensor.dataIn;
    
    const nameLat = data.setting.key[data.boardNow].map.lat
    const nameLon = data.setting.key[data.boardNow].map.lon
    const dataLat = dataIn[nameLat][dataIn[nameLat].length - 1]
    const dataLon = dataIn[nameLon][dataIn[nameLon].length - 1]
    const state = dataIn[data.setting.key[data.boardNow].state][dataIn[data.setting.key[data.boardNow].state].length - 1]
    if(stateNow != state){
        let tableHtml = '<table style="border-collapse: collapse; width: 100%;">';

        // header row (optional)
        tableHtml += `
        <tr>
            <th style="border: 1px solid black; padding: 2px;">Parameter</th>
            <th style="border: 1px solid black; padding: 2px;">Value</th>
        </tr>
        `;

        Object.entries(data[data.boardNow].data_format).forEach(([name, value]) => {
        tableHtml += `
            <tr>
            <th style="border: 1px solid black; padding: 2px;">${name}</th>
            <td style="border: 1px solid black; padding: 2px;">${dataIn[name][dataIn[name].length-1]}</td>
            </tr>
        `;
        });

        tableHtml += '</table>';
        stateNow = state;
        console.log("Change state");
        LocationState[stateNow] = L.marker([dataLat, dataLon,12]).addTo(map).bindPopup(tableHtml).openPopup(); ;
    }
    
    if (Number.isFinite(parseFloat(dataLat)) && Number.isFinite(parseFloat(dataLon))){
        console.log("update map")
        rocketMarker.setLatLng([dataLat, dataLon]);
        
        id.linkMap.textContent = getGoogleMapsPinLink(dataLat,dataLon);
    }else{
        console.log(`lat: ${dataLat} type: ${Number.isFinite(parseFloat(dataLat))}, lon: ${dataLon} type: ${Number.isFinite(parseFloat(dataLon))}`)
    }
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            Location.setLatLng([lat, lng])
        });
        } else {
        alert("Geolocation is not supported by this browser.");
    }
}

export function syncData_map(dataIn){
    data = dataIn;
}