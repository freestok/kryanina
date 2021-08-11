// -----------------------------------
// --------- GLOBAL VARIABLES --------
let year = 2020,
    indicator = 'li';
// -----------------------------------
// -----------------------------------

$(document).ready(() => {
    // set-up map and basemap
    const map = L.map('map').setView([39.47, 0], 2);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        maxZoom: 16
    }).addTo(map);

    // --------------------- add data to the map ---------------
    fetchJSON('./data/vdem_15s.json').then((data) => {
        L.geoJSON(data, {style: style}).addTo(map);
    });
});

async function fetchJSON(url) {
    const response = await fetch(url);
    return await response.json();
}

function style(feature) {
    return {
        fillColor: getColor(feature.properties[`${indicator}${year}`]),
        weight: 2,
        opacity: 1,
        color: 'white',
        fillOpacity: 0.7
    };
}

function getColor(d) {
    return d > .9 ? '#800026' :
           d > .8  ? '#BD0026' :
           d > .7  ? '#E31A1C' :
           d > .6  ? '#FC4E2A' :
           d > .5   ? '#FD8D3C' :
           d > .4   ? '#FEB24C' :
           d > .3   ? '#FED976' :
                      '#FFEDA0';
}