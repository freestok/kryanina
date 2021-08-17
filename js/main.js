// -----------------------------------
// --------- GLOBAL VARIABLES --------
let year = '2020',
    indicator,
    checked = '',
    mapData,
    colorScales = {
        reds: chroma.scale('reds').colors(8),
        oranges: chroma.scale('oranges').colors(8),
        blues: chroma.scale('blues').colors(8),
        greens: chroma.scale('greens').colors(8),
        purples: chroma.scale('purples').colors(8),
        diverging: chroma.scale('RdBu').domain([-1, 1])
    };
// -----------------------------------
// -----------------------------------

$(document).ready(() => {
    indicator = $('input[name=flexRadioDefault]:checked')[0].id.replace('Radio','');
    initListeners();
    initMap();
    resizeLayout();
    $(".tray-close").on("click", () => closeTray())

});

function initListeners() {
    // listener on radio buttons
    $("input:radio[name=flexRadioDefault]").on("change", (e) => {
        indicator = e.target.id.replace('Radio','');
        mapData.eachLayer(layer => layer.setStyle(style(layer.feature)));
    });

    $('#timeSlider').on('input', (e) => {
        year =  $(e.target).val();
        $('#timeLabel').text(String(year));
        mapData.eachLayer(layer => layer.setStyle(style(layer.feature)));
    });

    $('#tenYrToggle').on('change', e => {
        let timeSlider = $('#timeSlider');
        let val = Number(timeSlider.val());

        console.log('timeslider', timeSlider);
        console.log(timeSlider.val());
        // change checked value and update slider rules
        if (e.target.checked) {
            checked = 'c';
            if (val < 2010) {
                year = '2010'
                timeSlider.val(year);
                $('#timeLabel').text(String(year));
            }
            document.getElementById('timeSlider').min = '2010';
        } else {
            checked = '';
            document.getElementById('timeSlider').min = '2000';
        }

        // update symbology
        mapData.eachLayer(layer => layer.setStyle(style(layer.feature)));
    });
};

function expandTray() {
    $(".tray").addClass("expanded box");

    if(($(window).width() >= 544)) {
        $(".wrapper").css("grid-template-rows", "auto minmax(200px, 33%)");
    } else {
        $(".wrapper").css("grid-template-rows", "25% auto 25%");
    }
}
function closeTray() {
    console.log("close tray!")
    $(".tray").removeClass("expanded box");

    if(($(window).width() >= 544)) {
        $(".wrapper").css("grid-template-rows", "auto 0px");
    } else {
        $(".wrapper").css("grid-template-rows", "25% auto 0px");
    }
}

function resizeLayout() {
    $(window).resize(() => {
        if (($(".tray").hasClass("expanded"))) {
            if(($(window).width() >= 544)) {
                $(".wrapper").css("grid-template-rows", "auto minmax(200px, 33%)")
            } else {
                $(".wrapper").css("grid-template-rows", "25% auto 25%")
            }
        } else {
            if(($(window).width() >= 544)) {
                $(".wrapper").css("grid-template-rows", "auto 0px")
            } else {
                $(".wrapper").css("grid-template-rows", "25% auto 0px")
            }
        }
    })
}

function initMap() {
    // set-up map and basemap
    const map = L.map('map').setView([39.47, 0], 2);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        maxZoom: 16
    }).addTo(map);

    // --------------------- add data to the map ---------------
    fetchJSON('./data/vdem.min.json').then((data) => {
        mapData = L.geoJSON(data, {
            style: style,
            onEachFeature: onEachFeature
        }).addTo(map);;
        console.log('mapData added to map');
    });
}


async function fetchJSON(url) {
    const response = await fetch(url);
    return await response.json();
}

function style(feature) {
    let color;
    if (checked === 'c') { // if checked (i.e. show 10 year change)
        color = colorScales.diverging(feature.properties[`${indicator}${year}${checked}`])
    } else {
        color = getColor(feature.properties[`${indicator}${year}${checked}`], colorScales.purples);
    }
    return {
        fillColor: color,
        weight: .75,
        opacity: 1,
        color: '#191919',
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

function createCountryReport() {
    console.log("country clicked")
    expandTray();
}

function onEachFeature(feature, layer) {
    layer.on({
        click: createCountryReport
    })
}