$(document).ready(() => {
    // set-up map and basemap
    const map = L.map('map').setView([39.47, -97.02], 4);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        maxZoom: 16
    }).addTo(map);


    // --------------------- add data to the map ---------------
    // fetchJSON(`${assets}/urban_boundaries.json`).then((data) => {
    //     L.geoJSON(data, {
    //         style: polyStyle,
    //         interactive: false
    //     }).addTo(map);
    // });
});

async function fetchJSON(url) {
    const response = await fetch(url);
    return await response.json();
}