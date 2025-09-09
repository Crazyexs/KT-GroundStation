const { dir } = await import('../../dir_client.js');
const { id } = await import('../../id.js');

let data;
let rocketMarker;
let ourPosition;
let Location;

export function initializeMap(){
    const map = L.map(id.map).setView([15.036422727194878, 100.9128553472129], data.setting.key[data.boardNow].map.zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map);
    rocketMarker = L.marker([14.8566086, 100.6362539,12]).addTo(map).bindPopup('Rocket Location');
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            Location = L.marker([lat, lng])
            .addTo(map)
            .bindPopup("Location From Map")
            .openPopup();

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
    if (Number.isFinite(parseFloat(dataLat)) && Number.isFinite(parseFloat(dataLon))){
        console.log("update map")
        rocketMarker.setLatLng([dataLat, dataLon]);
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