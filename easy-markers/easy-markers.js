// so I don't have to use jQuery
function my$(el) {
    return document.getElementById(el);
}


function makeEM(params) {

    var em = {};

    if (!params) {
        console.error("EasyMarker: No params passed into constructor!");
        return null;
    }

    if (!params.hasOwnProperty("mapId")) {
        console.error("EasyMarker: No mapId passed into constructor! That's pretty important!");
        return null;
    }

    var defaultIcon = '//openlayers.org/en/v3.8.2/examples/data/icon.png';
    var popupVisible = false;

    var features = []; // list of markers
    var mapDiv = my$(params.mapId);

    // make popup div
    var popup = document.createElement("div");
    popup.id = "EMpopup";
    document.body.appendChild(popup);

    // init map and layers
    var vectorSource = new ol.source.Vector();
    var vectorLayer = new ol.layer.Vector({
        source: vectorSource
    });
    var olview = new ol.View({
        center: [0, 0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 20
    });
    var overlay = new ol.Overlay({
        element: popup,
        autoPan: true,
        autoPanAnimation: {
            duration: 250
        }
    });
    var map = new ol.Map({
        target: mapDiv,
        view: olview,
        layers: [
            new ol.layer.Tile({
                style: 'Aerial',
                source: new ol.source.OSM()
            }),
            vectorLayer
        ],
        overlays: [overlay]
    });


    // set the framework to editor mode; this is for the editor page, or if
    // someone wants to write their own editor 8)
    function setEditorMode() {
        var currentFeature = null;
        var markers = [];

        // EDITOR map onclick function
        map.on('singleclick', function (e) {
            console.log(e.coordinate);

            if (currentFeature !== null) {
                vectorSource.removeFeature(currentFeature);
            }

            var feature = drawMarker({
                coord: e.coordinate,
                title: "New Marker " + (features.length + 1)
            });

            currentFeature = feature;
            console.log(features);

            // another function called on map click (optional)
            if (params.mapClickFn)
                params.mapClickFn(e);
        });

        // EDITOR redraw pin
        em.updateCurrentMarker = function (params) {
            if (params.title !== null)
                console.log("updating pin title to " + params.title);

            currentFeature.setStyle(makeStyle(params));
        };

        // EDITOR add marker
        em.confirmCurrentMarker = function (params) {
            if (currentFeature !== null) {
                vectorSource.removeFeature(currentFeature);
            }
            em.addMarker(params);
            markers.push(params);
            currentFeature = null;
        };

        em.removeMarker = function (num) {
            console.log("removing feature " + num);
            var feature = features[num - 1];
            console.log(feature);
//            vectorSource.removeFeature(feature);
            vectorLayer.getSource().removeFeature(feature);
            features[num - 1] = null;
            markers[num - 1] = null;
        };

        em.preview = function (sampleHTML, popup, imgSrc, image) {
            sampleHTML = sampleHTML.replace(/&lt;/g, '<');
            sampleHTML = sampleHTML.replace(/&gt;/g, '>');

            var samplePopup = makePopup({popupHTML: sampleHTML});

            // clear preview
            while (popup.firstChild)
                popup.removeChild(popup.firstChild);

            popup.appendChild(samplePopup);

            image.src = imgSrc || defaultIcon;
        };

        em.generateJSON = function () {
            var validMarkers = [];
            var marker;
            for (var i = 0; i < markers.length; i++) {
                marker = markers[i];
                if (marker)
                    validMarkers.push(marker);
            }
            console.log(validMarkers);

            var data = JSON.stringify(validMarkers);
            myWindow = window.open("data:application/json," + encodeURIComponent(data));
            myWindow.focus();
        };
    }
    ;

    // how the marker looks - important parts are icon (image) and title (text)
    function makeStyle(params) {
        var image = defaultIcon;
        var title = "";
        if (params !== null) {
            console.log("makeStyle image:" + params.image);
            image = params.image || image;
            title = params.title || title;
        }
        console.log("makeStyle image:" + image);

        return new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [0.5, 46],
                anchorXUnits: 'fraction',
                anchorYUnits: 'pixels',
                opacity: 0.75,
                src: image
            }),
            text: new ol.style.Text({
                font: '12px Calibri,sans-serif',
                fill: new ol.style.Fill({color: '#000'}),
                stroke: new ol.style.Stroke({
                    color: '#fff', width: 2
                }),
                text: title
            })
        });
    }

    em.addMarker = function (params) {
        var feature = drawMarker(params);
        features.push(feature);
        return feature;
    };

    function drawMarker(params) {
        console.log("drawing marker:");
        console.log(params);

        var feature = new ol.Feature(
                new ol.geom.Point(params.coord)
                );
        feature.setStyle(makeStyle(params));
        feature.setId("mar" + (features.length + 1)); // will be used for the click event to get markers
        feature.setProperties({marker: params}); // the params obj will be passed into the onclick fn

        console.log("Done adding marker with Id=" + feature.getId());
        vectorSource.addFeature(feature);
        return feature;
    }

    em.loadMarkers = function (markers) {
        markers = eval(markers);
        for (var i = 0; i < markers.length; i++) {
            em.addMarker(markers[i]);
        }
    };

    function makePopup(marker) {
        console.log("making popup for marker:");
        console.log(marker);
        var content = document.createElement("div");
        content.id = "popupContent";

        console.log("from " + marker.popupHTML);
        content.innerHTML = marker.popupHTML;

        return content;
    }

    em.showPopup = function (marker) {
        // TODO needed anymore?
        while (popup.firstChild) {
            popup.removeChild(popup.firstChild);
        }

        console.log("showing popup for " + marker.title);
        var content = makePopup(marker);
        popup.appendChild(content);
        popupVisible = true;
    };

    em.hidePopup = function () {
        if (popupVisible) {
            overlay.setPosition(undefined);
            popupVisible = false;
        }
    };

    // setting map click function/editor mode 
    if (!params.markerClickFn)
        console.log("no click function specified! Going with the popup by default.");
    var featureOnClickFn = params.markerClickFn || em.showPopup;

    var editorMode = params.editorMode || false;
    if (editorMode) {
        setEditorMode();
    } else {
        // general onclick function; if no other function is defined, the framework
        // will just show the popout for the marker.
        map.on('singleclick', function (e) {
            var foundMarker = false;
            map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
                if (feature.getId().slice(0, 3) === "mar") {
                    console.log("clicked " + feature.getId());
                    featureOnClickFn(feature.getProperties().marker);
                    overlay.setPosition(e.coordinate);
                    foundMarker = true;
                }
            });
            if (!foundMarker) {
                em.hidePopup();
            }
        });
    }


    return em;
}