// -----------------------------------
// --------- GLOBAL VARIABLES --------
let year = '2020',
    selectedCountry = null,
    indicator,
    checked = '',
    map,
    mapJSON,
    mapData,
    colorScales = {
        reds: chroma.scale('reds').colors(8),
        oranges: chroma.scale('oranges').colors(8),
        blues: chroma.scale('blues').colors(8),
        greens: chroma.scale('greens').colors(8),
        purples: chroma.scale('purples').colors(8),
        diverging: chroma.scale('RdBu').domain([-1, 1])
    },
    barChart,
    timeSeriesChart;
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
        createCountryReport(selectedCountry, parseInt(year));
    });

    $('#timeSlider').on('input', (e) => {
        year =  $(e.target).val();
        $('#timeLabel').text(String(year));
        mapData.eachLayer(layer => layer.setStyle(style(layer.feature)));
        createCountryReport(selectedCountry, parseInt(year));
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
        $(".wrapper").css("grid-template-rows", "auto minmax(200px, 50%)");
    } else {
        $(".wrapper").css("grid-template-rows", "25% auto 25%");
    }
}
function closeTray() {
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
    fetchJSON('./data/vdem.min.json').then((data) => {
        mapJSON = data;
        mapData = L.geoJSON(mapJSON, {
            style: style,
            onEachFeature: onEachFeature
        }).addTo(map);
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


function createCountryReport(country, year) {
    // Retrieve attribute data for selected country
    let selectedCountryAttributes = mapJSON.features
        .filter(feature => feature.properties.country_name == country)[0].properties
    
    //############//
    // PROCESSING //
    //############//

    // A helper object for translating the selected indicator value into the actual indicator term it represents
    let indicatorTranslationObject = {
        el: "Electoral",
        li: "Liberal",
        pa: "Participatory",
        de: "Deliberative",
        eg: "Egalitarian"
    }

    // BAR CHART
    // Generate array of fields for the selected year
    let attributeYearKeys = ["el", "li", "pa", "de", "eg"].map(attr => `${attr}${year}`)

    // Filter the attribute data to only the fields for the selected year
    let attributeYearData = Object.keys(selectedCountryAttributes)
        .filter(key => attributeYearKeys.includes(key))
        .reduce((obj, key) => {
            obj[key] = selectedCountryAttributes[key];
            return obj;
        }, {})

    // TIMESERIES CHART
    // Reduce the selected country's data down to just the annual columns for the selected indicator
    let indicatorYearObject = Object.keys(selectedCountryAttributes)
        .filter(key => key.substring(0, 2)  == indicator & key.substring(key.length - 1) != "c")
        .reduce((obj, key) => {
            obj[key] = selectedCountryAttributes[key];
            return obj;
        }, {})

    // Convert the keys to an array of years 
    let timeSeriesYears = Object.keys(indicatorYearObject)
        .map(key => key.substring(2,))
    
    // Convert the indicator year object into an array of the values
    let timeSeriesValues = Object.keys(indicatorYearObject)
        .map(key => indicatorYearObject[key])
    
    
    // Format result for use in C3.js
    let indicatorTimeSeriesColumns = [
        ["x", ...timeSeriesYears],
        [indicatorTranslationObject[indicator], ...timeSeriesValues]
    ]    

    //#################//
    // GENERATE REPORT //
    //#################//
    $(".report-country-name").text(selectedCountry);
    $("#report-attributes-list").empty();
    $.each(attributeYearData, (key, value) => {
        $("#report-attributes-list").append(`<li><b>${indicatorTranslationObject[key.substring(0,2)]}: </b>${value}</li>`)
    });
    createTimeSeriesChart(indicatorTimeSeriesColumns);
    createBarChart(attributeYearData);
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
                resizeChart(barChart, ".report-indicator-bar")
            }, 1)
        },
        onresized: () => {
            resizeChart(barChart, ".report-indicator-bar")
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
                },
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
        },
        legend: {
            item: {
                onclick: () => undefined,
                onmouseover: () => undefined
            }
        }
    });
}
function resizeChart(chart, el) {
    chart.resize({
        height: $(el).height(),
        width: $(el).width()
    })
}

function createTimeSeriesChart(data) {
    timeSeriesChart = c3.generate({
        bindto: "#report-indicator-time-series-chart",
        size: {
            height: $(".report-indicator-time-series").height(),
            width: $(".report-indicator-time-series").width()
        },
        oninit: () => {
            setTimeout(() => {
                resizeChart(timeSeriesChart, ".report-indicator-time-series")
            }, 1)
        },
        onresized: () => {
            resizeChart(timeSeriesChart, ".report-indicator-time-series")
        },
        transition: {
            duration: 0
        },
        data: {
            x: "x",
            columns: data,
            color: (color, d) => "#4E342E",
        },
        axis: {
            type: "timeseries",
            tick: {
                format: "%Y"
            },
            y: {
                min: 0,
                max: 1,
                padding: {
                    top: 0,
                    bottom: 0
                }
            }
        },
        legend: {
            item: {
                onclick: () => undefined
            }
        }
    })
}

function onEachFeature(feature, layer) {
    layer.on({
        click: (e) => {
            selectedCountry = feature.properties.country_name;            
            createCountryReport(selectedCountry, year)
            expandTray();
            map.invalidateSize();
            map.fitBounds(e.target.getBounds())
        }
    })
}