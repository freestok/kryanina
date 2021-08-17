// -----------------------------------
// --------- GLOBAL VARIABLES --------
let year = 2020,
    selectedCountry = null,
    indicator,
    map,
    mapJSON,
    mapData,
    colorScales = {
        reds: chroma.scale('reds').colors(8),
        oranges: chroma.scale('oranges').colors(8),
        blues: chroma.scale('blues').colors(8),
        greens: chroma.scale('greens').colors(8),
        purples: chroma.scale('purples').colors(8)
    },
    barChart;
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
        let yearVal = $(e.target).val();
        year = yearVal;
        $('#timeLabel').text(String(yearVal));
        mapData.eachLayer(layer => layer.setStyle(style(layer.feature)));
    });
};

function expandTray() {
    $(".tray").addClass("expanded box");

    if(($(window).width() >= 544)) {
        $(".wrapper").css("grid-template-rows", "auto minmax(200px, 50%)");
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
                $(".wrapper").css("grid-template-rows", "auto minmax(200px, 50%)")
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
    map = L.map('map').setView([39.47, 0], 2);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        maxZoom: 16
    }).addTo(map);

    // --------------------- add data to the map ---------------
    fetchJSON('./data/vdem_15s.json').then((data) => {
        mapJSON = data;
        mapData = L.geoJSON(mapJSON, {
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
    return {
        fillColor: getColor(feature.properties[`${indicator}${year}`], colorScales.purples),
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
    map.fitBounds(this.getBounds())
    // Get selected country
    selectedCountry = this.feature.properties.country_name;

    // Retrieve attribute data for selected country
    let selectedCountryAttributes = mapJSON.features
    .filter(feature => feature.properties.country_name == selectedCountry)[0].properties
    
    // Generate array of fields for the selected year
    let attributeYearKeys = ["el", "li", "pa", "de", "eg"].map(attr => `${attr}${year}`)

    // Filter the attribute data to only the fields for the selected year
    let attributeYearData = Object.keys(selectedCountryAttributes)
        .filter(key => attributeYearKeys.includes(key))
        .reduce((obj, key) => {
            obj[key] = selectedCountryAttributes[key];
            return obj;
        }, {})
    // Generate report
    $(".report-country-name").text(selectedCountry);

    // Bar Graph
    createBarChart(attributeYearData)
    
    // Expand tray
    expandTray();

    // Zoom to selected country
    map.fitBounds(this.getBounds())
}

function createBarChart(data) {
    barChart = c3.generate({
        bindto: "#report-indicator-bar-chart",
        size: {
            height: $(".report-indicator-bar").height(),
            width: $(".report-indicator-bar").width()
        },
        oninit: () => {
            setTimeout(() => {
                resizeBarChart()
            }, 1)
        },
        onresized: () => {
            resizeBarChart()
        },
        data: {
            columns: [
                ["Electoral", data[`el${year}`]],
                ["Liberal", data[`li${year}`]],
                ["Participatory", data[`pa${year}`]],
                ["Deliberative", data[`de${year}`]],
                ["Egalitarian", data[`eg${year}`]]
            ],
            type: "bar",
            colors: {
                Electoral: colorScales.reds[5],
                Liberal: colorScales.oranges[5],
                Participatory: colorScales.blues[5],
                Deliberative: colorScales.greens[5],
                Egalitarian: colorScales.purples[5],
            }
        },
        bar: {
            width: {
                ratio: 0.95
            }
        },
        axis: {
            x: {
                padding: {
                    left: 0,
                    right: 0,
                }
            },
            x: {
                show: false
            },
            y: {
                min: 0,
                max: 1,
                padding: {
                    top: 0,
                    bottom: 0
                }
            },
        }
    });
}
function resizeBarChart() {
    barChart.resize({
        height: $(".report-indicator-bar").height(),
        width: $(".report-indicator-bar").width()
    })
}

function onEachFeature(feature, layer) {
    layer.on({
        click: createCountryReport
    })
}