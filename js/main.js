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
    // initMap();
    initd3Map();
    resizeLayout();
    $(".tray-close").on("click", () => closeTray())
});

async function initd3Map() {
    // https://observablehq.com/@harrystevens/dorling-cartogram

    $('#map').hide();
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
    const topo = await d3.json('./data/ne_110m_admin_0_countries_lakes.json');
    console.log('topo', topo);
    const geo = topojson.feature(topo, topo.objects.ne_110m_admin_0_countries_lakes);
    geo.features.forEach(feature => {
        feature.centroid = centroid(feature);
        return feature;
    });

    // scale
    const r = d3.scaleSqrt()
        .domain([0, d3.max(geo.features, d => d.properties.POP_EST)])
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
        .force("collide", d3.forceCollide(d => 1 + r(d.properties.POP_EST)))
        .stop();

    // now create the SVG
    for (let i = 0; i < 200; i++) {
        simulation.tick();
    }

    const svg = d3.select('div#d3Map')
        .append("svg")
        // .attr("width", width)
        // .attr("height", height)
        // .attr("overflow", "visible");
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", `0 0 ${width} ${height}`);

    svg.selectAll(".country")
        .data(geo.features)
        .enter().append("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("fill", "#f5f5f5")
        .attr("stroke", "#e0e0e0")
        .style("display", 'block');
        // .style("display", show === "show" ? "block" : "none");

    svg.selectAll("circle")
        .data(geo.features)
        .enter().append("circle")
        .attr("r", d => r(d.properties.POP_EST))
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("fill", "steelblue")
        .attr("fill-opacity", 0.3)
        .attr("stroke", "steelblue");

    // svg.append("g")
    //     .attr("transform", `translate(0, ${height - 150})`)
    //     .call(legend);

}
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