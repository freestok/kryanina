// -----------------------------------
// --------- GLOBAL VARIABLES --------
let year = 2020,
    indicator = 'li',
    colorScales = {
        reds: chroma.scale('reds').colors(8),
        oranges: chroma.scale('oranges').colors(8),
        blues: chroma.scale('blues').colors(8),
        greens: chroma.scale('greens').colors(8),
        purples: chroma.scale('purples').colors(8)
    };
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
        fillColor: getColor(feature.properties[`${indicator}${year}`], colorScales.purples),
        weight: 2,
        opacity: 1,
        color: 'white',
        fillOpacity: 0.7
    };
}

function getColor(d, colorScale) {
    return d > .9 ? colorScale[7] :
           d > .8 ? colorScale[6] :
           d > .7 ? colorScale[5] :
           d > .6 ? colorScale[4] :
           d > .5 ? colorScale[3] :
           d > .4 ? colorScale[2] :
           d > .3 ? colorScale[1] :
                    colorScale[0];
}