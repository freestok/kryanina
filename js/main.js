// -----------------------------------
// --------- GLOBAL VARIABLES --------
let year = '2020',
    selectedCountry = null,
    indicator,
    checked = '',
    map,
    mapJSON,
    mapData,
    selectedFeature,
    colorScales = {
        reds: chroma.scale('reds').colors(8),
        oranges: chroma.scale('oranges').colors(8),
        blues: chroma.scale('blues').colors(8),
        greens: chroma.scale('greens').colors(8),
        purples: chroma.scale('purples').colors(5),
        diverging: chroma.scale('RdBu').domain([-1, 1]),
        ordinal: chroma.scale('RdBu').domain([0, 1, 2, 3]),
        qualitative: ['#0072B2', '#009E73', '#D55E00', '#56B4E9', '#CC79A7']
    },
    barChart,
    timeSeriesChart,
    currentExtent,
    previousD3Select,
    exclude = ['Greenland', 'W. Sahara', 'Belize'];
// -----------------------------------
// -----------------------------------

$(document).ready(() => {
    $('#metadata-modal').modal('show');
    indicator = $('input[name=flexRadioDefault]:checked')[0].id.replace('Radio','');
    initListeners();
    initMap();
    initd3Map();
    resizeLayout();
    $(".tray-close").on("click", () => {
        closeTray()
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
        resetD3Selection(true);
        resetMapHighlight();
    });
});


function initListeners() {
    // listener on radio buttons
    $("input:radio[name=flexRadioDefault]").on("change", (e) => {
        indicator = e.target.id.replace('Radio','');
        
        if (indicator === 'rg') {
            $('#tenYrToggle').prop('disabled', true);
            $('#tenYrToggle').prop('checked', false);
            checked = '';
        } else {
            $('#tenYrToggle').prop('disabled', false);
        }

        mapData.eachLayer(setLeafletStyle);
        updateD3Symbology();
        createCountryReport(selectedCountry, parseInt(year));
    });

    $('#timeSlider').on('input', (e) => {
        year =  $(e.target).val();
        $('#timeLabel').text(String(year));
        mapData.eachLayer(setLeafletStyle);
        updateD3Symbology();
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
        mapData.eachLayer(setLeafletStyle);
        createCountryReport(selectedCountry, parseInt(year));
        updateD3Symbology();
    });

    $('#asCartogram').on('change', e => {
        currentExtent = map.getBounds();
        if (e.target.checked) {
            resetMapHighlight();
            closeTray();
            // Hide the Leaflet map and swap .map class with D3 map
            $('#map').hide();
            $("#mapContainer")
                .hide()
                .removeClass("map")
            $('#d3Map').show();
            $('#d3MapContainer')
                .show()
                .addClass("map")
        } else {
            closeTray();
            // Hide the D3 map and swap .map class with Leaflet map
            $('#d3Map').hide();
            resetD3Selection(true);
            $("#d3MapContainer")
                .hide()
                .removeClass("map");
            $('#map').show();
            $("#mapContainer")
                .show()
                .addClass("map");
 
            setTimeout(() => {
                map.invalidateSize();
            }, 100);
            map.fitBounds(currentExtent);

        }
    });
};

function expandTray() {
    $(".tray").addClass("expanded box");

    if(($(window).width() >= 544)) {
        $(".wrapper").css("grid-template-rows", "auto minmax(200px, 50%)");
    } else {
        $(".wrapper").css("grid-template-rows", "25% auto 40%");
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
                $(".wrapper").css("grid-template-rows", "25% auto 40%")
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
    const property = feature.properties[`${indicator}${year}${checked}`]
    let color;
    if (checked === 'c') { // if checked (i.e. show 10 year change)
        color = colorScales.diverging(property)
    } else if (indicator.includes('rg')) {
        color = colorScales.ordinal(property)
    } else {
        color = getColor(property, colorScales.purples);
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
    return d > .8 ? colorScale[4] :
           d > .6 ? colorScale[3] :
           d > .4 ? colorScale[2] :
           d > .2 ? colorScale[1] :
           d > 0  ? colorScale[0] :
           'grey';
}


function createCountryReport(country, year) {
    // Retrieve attribute data for selected country
    let selectedCountryAttributes = mapJSON.features
        .filter(feature => feature.properties.country_name == country)[0];

    if (selectedCountryAttributes) {
        selectedCountryAttributes = selectedCountryAttributes.properties;
    } else {
        return
    }
    
    //############//
    // PROCESSING //
    //############//

    // A helper object for translating the selected indicator value into the actual indicator term it represents
    let indicatorTranslationObject = {
        el: "Electoral",
        li: "Liberal",
        pa: "Participatory",
        de: "Deliberative",
        eg: "Egalitarian",
        rg: "Regime Type"
    }

    // BAR CHART
    // Generate array of fields for the selected year
    let attributeYearKeys = ["el", "li", "pa", "de", "eg", "rg"].map(attr => `${attr}${year}`)

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

    // determine regime type labeling
    const rgVal = attributeYearData[`rg${year}`];
    let regimeLabel = rgVal === 3 ? 'Liberal Democracy' :
                      rgVal === 2 ? 'Electoral Democracy' :
                      rgVal === 1 ? 'Electoral Autocracy' :
                                    'Closed Autocracy'    

    //#################//
    // GENERATE REPORT //
    //#################//
    // Selected country title
    $(".report-country-name").text(`${selectedCountry}`);
    $('#regimeLabel')
        .text(`${regimeLabel}`)
        .css('background-color', colorScales.ordinal(rgVal));

    // Selected year indicators scores list 
    $("#report-attributes-list").empty();

    // Selected indicator time series chart
    $("#time-series-title-indicator").text(`${indicatorTranslationObject[indicator]} Score`)
    $.each(attributeYearData, (key, value) => {
        if (!key.includes('rg')) { // skip regime type
            $("#report-attributes-list").append(`<li><b>${indicatorTranslationObject[key.substring(0,2)]}: </b>${value}</li>`)
        } 
    });

    createTimeSeriesChart(indicatorTimeSeriesColumns);

    // Selected year indicators bar chart
    $("#bar-chart-title-year").text(year)
    createBarChart(attributeYearData);
}

function createBarChart(data) {
    barChart = c3.generate({
        bindto: "#report-indicator-bar-chart",
        size: {
            height: $("#report-indicator-bar-chart").height(),
            width: $("#report-indicator-bar-chart").width()
        },
        oninit: () => {
            setTimeout(() => {
                resizeChart(barChart, ".report-indicator-bar", ".report-indicator-bar h2")
            }, 1)
        },
        onresized: () => {
            resizeChart(barChart, ".report-indicator-bar", ".report-indicator-bar h2")
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
                Electoral: colorScales.qualitative[0],
                Liberal: colorScales.qualitative[2],
                Participatory: colorScales.qualitative[1],
                Deliberative: colorScales.qualitative[3],
                Egalitarian: colorScales.qualitative[4],
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
                    top: 5,
                    bottom: 0
                },
                label: {
                    text: "Score",
                    position: "outer-top"
                }
            },
        },
        tooltip: {
            format: {
                title: () => ''
            }
        },
        legend: {
            item: {
                onclick: () => undefined,
                onmouseover: () => undefined
            }
        }
    });
}
function resizeChart(chart, el, titleEl) {
    chart.resize({
        height: $(el).height() - $(titleEl).height(),
        width: $(el).width()
    })
}

function createTimeSeriesChart(data) {
    let ymin, ymax, ytick;
    if (indicator.includes('rg')) {
        ymin = 0;
        ymax = 3;
        ytick = {
            values: [0, 1, 2, 3],
            count: 4
        }
    } else {
        ymin = 0;
        ymax = 1;
        ytick = {}
    }
    timeSeriesChart = c3.generate({
        bindto: "#report-indicator-time-series-chart",
        size: {
            height: $(".report-indicator-time-series").height(),
            width: $(".report-indicator-time-series").width()
        },
        oninit: () => {
            setTimeout(() => {
                resizeChart(timeSeriesChart, ".report-indicator-time-series", ".report-indicator-time-series h2")
            }, 1)
        },
        onresized: () => {
            resizeChart(timeSeriesChart, ".report-indicator-time-series", ".report-indicator-time-series h2")
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
            x: {
                padding: {
                    right: 1
                }
            },
            y: {
                min: ymin,
                max: ymax,
                padding: {
                    top: 1,
                    bottom: 1
                },
                label: {
                    text: "Score",
                    position: "outer-top"
                },
                tick: ytick
            }
        },
        legend: {
            item: {
                onclick: () => undefined
            }
        }
    })
}

function highlightFeature(e) {
    resetMapHighlight();
    selectedFeature = e.target;
    selectedFeature.setStyle({
        weight: 2,
        color: "#00FFFF"
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        selectedFeature.bringToFront();
    }
}

function resetMapHighlight() {
    if (selectedFeature) {
        mapData.resetStyle(selectedFeature);
        selectedFeature = null;
        selectedCountry = null;
    }
}

function onEachFeature(feature, layer) {
    if (!exclude.includes(feature.properties.country_name)) {
        layer.on({
            click: (e) => {
                // if it's a double-click, deselect
                console.log('selectedCountry', selectedCountry);
                if (selectedCountry === feature.properties.country_name) {
                    resetMapHighlight();
                    closeTray();
                    setTimeout(() => {
                        map.invalidateSize();
                    }, 100);
                    console.log('bye bye');
                    return;
                }

                highlightFeature(e);
                selectedCountry = feature.properties.country_name;
                createCountryReport(selectedCountry, year)
                expandTray();
                map.invalidateSize();
                map.fitBounds(e.target.getBounds())
            }
        })
    }
}

function setLeafletStyle(layer) {
    layer.setStyle(style(layer.feature));

    if (selectedFeature) {
        selectedFeature.setStyle({
            weight: 2,
            color: "#00FFFF"
        });

        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            selectedFeature.bringToFront();
        }
    };
}

// -----------------------------------------------------------------------------
// ------------------------------- d3 stuff ------------------------------------
// -----------------------------------------------------------------------------
async function initd3Map() {
    // https://observablehq.com/@harrystevens/dorling-cartogram

    const width = 960;
    const height = width * .49;

    // Find the centroid of the largest polygon
    const centroid = (feature) => {
        const geometry = feature.geometry;
        if (geometry.type === "Polygon") {
            return d3.geoCentroid(feature);
        }
        else {
            let largestPolygon = {}, largestArea = 0;
            geometry.coordinates.forEach(coordinates => {
                const polygon = { type: "Polygon", coordinates },
                    area = d3.geoArea(polygon);
                if (area > largestArea) {
                    largestPolygon = polygon;
                    largestArea = area;
                }
            });
            return d3.geoCentroid(largestPolygon);
        }
    }

    // // set legend
    // const legend = legendCircle()
    //     .tickValues([50e6, 200e6, 500e6, 1000e6])
    //     .tickFormat((d, i, e) => {
    //         const val = d >= 1e9 ? `${d / 1e9}B` : `${d / 1e6}M`;
    //         const unit = i === e.length - 1 ? " people" : "";
    //         return `${val}${unit}`;
    //     })
    //     .scale(r);

    // get geometry data and calculate centroid
    const topo = await d3.json('./data/vdem.topo.json');
    const geo = topojson.feature(topo, topo.objects.countries_pop);
    geo.features.forEach(feature => {
        feature.centroid = centroid(feature);
        return feature;
    });

    // scale
    const r = d3.scaleSqrt()
        .domain([0, d3.max(geo.features, d => d.properties.population)])
        .range([0, Math.sqrt(width * height) / 10])

    // set projection and path
    const projection = d3.geoEqualEarth()
        .rotate([-10, 0, 0])
        .fitSize([width, height], { type: "Sphere" });

    const path = d3.geoPath(projection);


    // stop collisions
    const simulation = d3.forceSimulation(geo.features)
        .force("x", d3.forceX(d => projection(d.centroid)[0]))
        .force("y", d3.forceY(d => projection(d.centroid)[1]))
        .force("collide", d3.forceCollide(d => 1 + r(d.properties.population)))
        .stop();

    for (let i = 0; i < 200; i++) {
        simulation.tick();
    }

    // --------------- now create the SVG ---------------
    const svg = d3.select('div#d3Map')
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("overflow", "visible")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", `0 0 ${width} ${height}`);

    const g = svg.append('g');
    const world = g.append('g')
        .selectAll('.country')
            .data(geo.features)
            .enter().append("path")
            .attr("class", "country")
            .attr("d", path)
            .attr("fill", "#f6f5f6")
            .attr("stroke", "#f6f5f6")
            .style("display", 'block');


    const g2 = svg.append('g');
    // don't show western sahara, belize,  or greenland population, no dem data for them
    geo.features = geo.features.filter(e => !exclude.includes(e.properties.country_name))

    g2.append('g')
        .selectAll("circle")
            .data(geo.features)
            .enter().append("circle")
            .classed('dorlingCircle', true)
            .attr("r", d => r(d.properties.population))
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("fill", d => getColor(d.properties[`${indicator}${year}${checked}`], colorScales.purples))
            .attr("fill-opacity", 0.85)
            // .attr("stroke", "steelblue")
            .attr('stroke', 'grey')
            .attr('stroke-width', 1)
            .attr('cursor', 'pointer')
            .on('click', clicked);


    // zoom function
    const zoom = d3.zoom()
        // .scaleExtent([1, 8])
        .on("zoom", () => {
            const transform = d3.event.transform;
            g.attr("transform", transform);
            g.attr("stroke-width", 1 / transform.k);
            g2.attr("transform", transform);
            g2.attr("stroke-width", 1 / transform.k);  
        });

    function clicked(event) {
        resetD3Selection();
        if (previousD3Select === this) {
            console.log('close tray');
            closeTray();
            previousD3Select = null;
            return;
        } else {
            selectedCountry = event.properties.country_name;            
            createCountryReport(selectedCountry, year)
            expandTray();
            
            // map.invalidateSize();
            // map.fitBounds(e.target.getBounds())
            // const [[x0, y0], [x1, y1]] = path.bounds(d);
            d3.event.stopPropagation();
            d3.select(this)
                .transition()
                .style("stroke", "#00FFFF")
                .attr("stroke-width", 2);
            previousD3Select = this;
        }
    }
    svg.call(zoom);
}

function updateD3Symbology() {
    let color;
    d3.selectAll("circle")
        .attr("fill", d => {
            if (d.properties) {
                const property = d.properties[`${indicator}${year}${checked}`]
                if (checked === 'c') { // if checked (i.e. show 10 year change)
                    color = colorScales.diverging(property)
                }  else if (indicator.includes('rg')) {
                    color = colorScales.ordinal(property)
                } else {
                    color = getColor(property, colorScales.purples);
                }
            }
            return color
        });
}

function resetD3Selection(clear=false) {
    d3.select(previousD3Select)
        .style('stroke','grey')
        .attr('stroke-width', 1);
    if (clear) previousD3Select = null;
}