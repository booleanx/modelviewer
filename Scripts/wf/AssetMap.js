var AssetMap = {};
var DragApp = {};

//goog.require('ol.Feature');
//goog.require('ol.Map');
//goog.require('ol.View');
////goog.require('ol.geom.LineString');
//goog.require('ol.geom.Point');
////goog.require('ol.geom.Polygon');
//goog.require('ol.interaction');
//goog.require('ol.interaction.Pointer');
//goog.require('ol.layer.Tile');
//goog.require('ol.layer.Vector');
//goog.require('ol.source.TileJSON');
//goog.require('ol.source.Vector');
//goog.require('ol.style.Fill');
//goog.require('ol.style.Icon');
//goog.require('ol.style.Stroke');
//goog.require('ol.style.Style');


(function () {
    var containerId;
    function createControlButton(options) {

        var clickHandler = options.clickHandler || function () { };
        var buttonElement = document.createElement('button');
        buttonElement.className = 'ol-has-tooltip ' + options.className;

        var iconElement = document.createElement('i');
        iconElement.className = 'fa ' + options.iconClassName;
        buttonElement.appendChild(iconElement);

        if (options.tooltip != undefined) {
            tooltipElement = document.createElement('span');
            tooltipElement.setAttribute("role", "tooltip");
            tooltipElement.innerHTML = options.tooltip;
            buttonElement.appendChild(tooltipElement);
        }

        var handleClick = function (e) {
            clickHandler(e);
        };

        buttonElement.addEventListener('click', handleClick, false);
        buttonElement.addEventListener('touchstart', handleClick, false);

        return buttonElement;
    }

    var PolygonSelectionControl = function (opt_options) {

        var options = opt_options || {};

        var toggleSelectionButton = createControlButton({
            clickHandler: options.toggleSelectionClickHandler,
            className: 'ol-group-first-button',
            iconClassName: 'fa-map-marker',
            tooltip: 'Toggle Polygon Selection',
        });

        var sendPolygonsButton = createControlButton({
            clickHandler: options.sendPolygonsClickHandler,
            className: 'ol-group-last-button',
            iconClassName: 'fa-paper-plane',
            tooltip: 'Send Selection',
        });

        var element = document.createElement('div');
        element.className = 'ol-polygon-selection ol-unselectable ol-control';
        element.appendChild(toggleSelectionButton);
        element.appendChild(sendPolygonsButton);

        ol.control.Control.call(this, {
            element: element,
            target: options.target
        });

    };

    var panControl = function (options) {
        var panNorthButton = createControlButton({
            clickHandler: options.panNorth,
            className: 'btn btn-success northButton',
            iconClassName: 'fa-arrow-up',
            //tooltip: 'Pan North'
        });

        var panSouthButton = createControlButton({
            clickHandler: options.panSouth,
            className: 'btn btn-success southButton',
            iconClassName: 'fa-arrow-down',
            //tooltip: 'Pan South',
        });


        var panEastButton = createControlButton({
            clickHandler: options.panEast,
            className: 'btn btn-success eastButton',
            iconClassName: 'fa-arrow-left',
            //tooltip: 'Pan East',
        });


        var panWestButton = createControlButton({
            clickHandler: options.panWest,
            className: 'btn btn-success westButton',
            iconClassName: 'fa-arrow-right',
            //tooltip: 'Pan West',
        });

        var element = document.createElement('div');
        //element.className = 'panButtonPanel ol-control ol-unselectable';
        element.className = 'panButtonPanel ol-control ol-unselectable';
        element.appendChild(panNorthButton);
        element.appendChild(panSouthButton);
        element.appendChild(panEastButton);
        element.appendChild(panWestButton);

        ol.control.Control.call(this, {
            element: element,
            target: options.target
        });
    };

    var drag = function () {
        ol.interaction.Pointer.call(this, {
            handleDownEvent: drag.prototype.handleDownEvent,
            handleDragEvent: drag.prototype.handleDragEvent,
            handleMoveEvent: drag.prototype.handleMoveEvent,
            handleUpEvent: drag.prototype.handleUpEvent
        });

        this.coordinate_ = null;

        this.cursor_ = 'pointer';

        this.feature_ = null;

        this.previousCursor_ = undefined;

    };

    ol.inherits(PolygonSelectionControl, ol.control.Control);
    ol.inherits(panControl, ol.control.Control);
    ol.inherits(drag, ol.interaction.Pointer);
    //ol.inherits(DragApp.drag, ol.interaction.Pointer);



    drag.prototype.handleDownEvent = function (evt) {
        var map = evt.map;

        var feature = map.forEachFeatureAtPixel(evt.pixel,
            function (feature, layer) {
                if (map.getLayers().getArray()[3] == layer) {
                    return feature;
                } else {
                    return null;
                }
            });

        if (feature) {
            this.coordinate_ = evt.coordinate;
            this.feature_ = feature;
        }

        return !!feature;
    };

    drag.prototype.handleDragEvent = function (evt) {
        var map = evt.map;

        var feature = map.forEachFeatureAtPixel(evt.pixel,
            function (feature, layer) {
                if (map.getLayers().getArray()[3] == layer) {
                    return feature;
                } else {
                    return null;
                }
            });

        var deltaX = evt.coordinate[0] - this.coordinate_[0];
        var deltaY = evt.coordinate[1] - this.coordinate_[1];

        var geometry = /** @type {ol.geom.SimpleGeometry} */
            (this.feature_.getGeometry());
        geometry.translate(deltaX, deltaY);

        this.coordinate_[0] = evt.coordinate[0];
        this.coordinate_[1] = evt.coordinate[1];
    };

    drag.prototype.handleMoveEvent = function (evt) {
        if (this.cursor_) {
            var map = evt.map;
            var feature = map.forEachFeatureAtPixel(evt.pixel,
                function (feature, layer) {
                    if (map.getLayers().getArray()[3] == layer) {
                        return feature;
                    } else {
                        return null;
                    }
                });
            var element = evt.map.getTargetElement();
            if (feature) {
                if (element.style.cursor != this.cursor_) {
                    this.previousCursor_ = element.style.cursor;
                    element.style.cursor = this.cursor_;
                }
            } else if (this.previousCursor_ !== undefined) {
                element.style.cursor = this.previousCursor_;
                this.previousCursor_ = undefined;
            }
        }
    };

    drag.prototype.handleUpEvent = function (evt) {

        this.coordinate_ = null;
        this.feature_ = null;
        return false;
    };


    AssetMap.create = function (config) {
        var that = this;

        that.containerId = config.containerId;
        containerId = that.containerId;

        that.mapOptions = config.options;
        that.mapOptions.maxZoom = that.mapOptions.maxZoom || 18;
        that.mapOptions.allowPolygonSelection = !!that.mapOptions.allowPolygonSelection;
        that.mapOptions.showDragMarker = that.mapOptions.showDragMarker || false;

        that.mapObjects = config.objects;
        that.mapObjects.assets = config.objects.assets || [];
        that.mapObjects.polygons = config.objects.polygons || [];

        // private
        that.selectFeature = null;
        that.drawInteraction = null;
        that.isActivePolygonInteraction = false;
        that.map = null;
        that.mapLayer = null;
        that.itemsLayer = null;
        that.interactionLayer = null;
        that.dragLayer = null;

        /************************************************GEOLOCATION********************************************************/

        that.geolocationData = that.geolocationData || {};
        that.geolocationData.markerElement = that.mapOptions.markerElement;
        that.geolocationData.deltaMean = 500; // the geolocation sampling period mean in ms
        that.geolocationData.marker = null;
        that.geolocationData.geolocation = null;
        that.geolocationData.positions = new ol.geom.LineString([], /** @type {ol.geom.GeometryLayout} */ ('XYZM'));
        /************************************************GEOLOCATION********************************************************/

        return {
            draw: drawMap,
            undoLastPoint: undoLastPoint,
            removeAllPolygons: removeAllPolygons,
            sendPolygonCoordinates: sendPolygonCoordinates,
            setMapSource: setMapSource,
            setPositionData: setPositionData,
            togglePolygonSelection: togglePolygonSelection,
            updateMapStateParams: updateMapStateParams,
            zoomToFit: zoomToFit,
            updateSize: updateSize,
            goToCurrentPosition: goToCurrentPosition,
            setPositionTracking: setPositionTracking,
            cleanUpHandlers: cleanUpHandlers,
            setMapCenter: setMapCenter,
            centerDragMarker: updateDragMakerLocation
            //addDragMarker: addDragMarker
        };

        function drawMap() {

            that.mapLayer = createMapLayer();
            that.itemsLayer = createItemsLayer();
            that.interactionLayer = createInteractionLayer();
            that.dragLayer = createInteractionLayer();

            that.map = createMap();
            setPositionData();

            addFeaturePopup();
            addFeatureClick();

            drawPolygons();
            restorePolygonSelectionMode();
            attachMapEventsHandlers();

            addGeolocationLayer();

            if (that.mapOptions.showDragMarker) {
                addDragMarker();
            }
        }

        function drawPolygons() {

            var polygonFeatures = [];
            for (var i = 0; i < that.mapObjects.polygons.length; i++) {
                createPolygonShape(polygonFeatures, that.mapObjects.polygons[i].points);
            }

            that.interactionLayer.getSource().addFeatures(polygonFeatures);
        }

        function setPositionData() {
            if (typeof that.mapOptions.positionData !== 'undefined' && that.mapOptions.positionData !== null) {
                restorePosition();
            } else {
                zoomToFit();
            }

            if (that.mapOptions.showDragMarker) {
                updateDragMakerLocation();
            }
        }

        function setMapCenter(sourceCoordinates) {
            that.mapOptions.positionData.center = sourceCoordinates;
            setPositionData();

            if (that.mapOptions.showDragMarker) {
                updateDragMakerLocation();
            }
        }

        function panMap(direction) {

            var basePanDistance;
            var view = that.map.getView();
            if (view.getZoom() != undefined) {
                basePanDistance = (view.getResolution() * view.getZoom() * 15);
            } else {
                basePanDistance = 500;
            }

            var pan = ol.animation.pan({
                duration: 500,
                //easing: elastic,
                source: (view.getCenter())
            });
            that.map.beforeRender(pan);

            var newCenter = view.getCenter();
            switch (direction) {
                case 'north':
                    ol.coordinate.add(newCenter, [0, basePanDistance]);
                    break;
                case 'south':
                    ol.coordinate.add(newCenter, [0, -basePanDistance]);
                    break;
                case 'west':
                    ol.coordinate.add(newCenter, [basePanDistance, 0]);
                    break;
                case 'east':
                    ol.coordinate.add(newCenter, [-basePanDistance, 0]);
                    break;
            }

            view.setCenter(newCenter);
        }

        function addDragMarker() {
            var view = that.map.getView();
            var dragObject = new ol.Feature({
                geometry: new ol.geom.Point(view.getCenter()),
                name: "Position"
            });

            var iconStyle = new ol.style.Style({
                image: new ol.style.Icon(/** @type {olx.style.IconOptions} */({
                    anchor: [0.5, 1],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'fraction',
                    opacity: 0.75,
                    src: window.appLocalHost + 'content/images/gpsmapiconssmall.png'
                }))
            });


            dragObject.setStyle(iconStyle);
            dragObject.on('change', function () {
                var coordinates = transformToLongLat(dragObject.getGeometry().getCoordinates());
                var coordinate = {
                    long: coordinates[0],
                    lat: coordinates[1]
                };

                $('#' + containerId).trigger('dragLocationChanged', coordinate);
            });

            dragObject.setId('MapDragObject');

            var interactionLayer = that.map.getLayers().getArray()[3];
            //var interactionLayer = that.map.getLayers().getArray()[1];
            interactionLayer.getSource().addFeature(dragObject);

            //var center = new ol.Feature({
            //    geometry: new ol.geom.Circle(view.getCenter(), 5),
            //    name: "Stuff"
            //});

            //var circleStyle = new ol.style.Fill([255, 0, 0, 0]);

            //center.setStyle(circleStyle);
            //center.setId('MapCenterMarker');

            //that.map.getLayers().getArray()[2].getSource().addFeature(center);

            //addCenter();
            that.map.render();
        }

        //function addCenter() {


        //    var view = that.map.getView();
        //    var center = new ol.Feature(new ol.geom.Circle(view.getCenter(), 0.01));



        //    that.map.getLayers().getArray()[3].getSource().addFeature(center);


        //    that.map.render();
        //}

        function updateDragMakerLocation() {
            var feature = that.map.getLayers().getArray()[3].getSource().getFeatureById('MapDragObject');
            if (feature) {
                var view = that.map.getView();
                var dragFeatureGeometry = feature.getGeometry();

                dragFeatureGeometry.setCoordinates(view.getCenter());
            }
        }

        function zoomToFit() {
            setTimeout(function() {
                var extent = that.itemsLayer.getSource().getExtent();

                var view = that.map.getView();
                view.fitExtent(extent, that.map.getSize());
                var zoom = view.getZoom();
                zoom = zoom >= that.mapOptions.maxZoom ? that.mapOptions.maxZoom : zoom - 1;
                view.setZoom(zoom);
                that.map.render();
            }, 500);
        }

        function restorePosition() {
            var view = that.map.getView();
            view.setZoom(that.mapOptions.positionData.zoomLevel);
            view.setCenter(transformFromLongLat(that.mapOptions.positionData.center));
        }

        function attachMapEventsHandlers() {
            that.map.on('moveend', mapMoveEnd);
            //var view = that.map.getView();
            //view.on('change:center', trySaveMapStateParams);
        }

        function createMap() {
            return new ol.Map({
                interactions: ol.interaction.defaults().extend([new drag()]),
                controls: createControls(),
                layers: [that.mapLayer, that.interactionLayer, that.itemsLayer, that.dragLayer],
                //layers: [that.mapLayer, that.dragLayer],
                target: document.getElementById(that.containerId),
                view: new ol.View()
            });
        }

        function createInteractionLayer() {
            var source = new ol.source.Vector();
            var features = [];

            return new ol.layer.Vector({
                source: source,
                style: new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#ffcc33',
                        width: 2
                    }),
                    image: new ol.style.Circle({
                        radius: 7,
                        fill: new ol.style.Fill({
                            color: '#ffcc33'
                        })
                    }),
                    feature: features
                })
            });
        }

        function createMapLayer() {
            return new ol.layer.Tile({ source: eval(that.mapOptions.mapSource) });
        }

        function addFeaturePopup() {
            var element = document.createElement("div");
            element.setAttribute('id', 'mapPopoverDiv');
            element.style.width = "200px";

            var popup = new ol.Overlay({
                element: element,
                positioning: 'bottom-center',
                stopEvent: false
            });

            that.map.addOverlay(popup);
            that.map.on('pointermove', function (evt) {
                var feature = that.map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) { return feature; });
                if (that.selectFeature !== feature) {
                    if (feature) {
                        showPopup(feature, popup, element);
                        that.selectFeature = feature;
                    } else {
                        $(element).popover('destroy');
                    }
                    that.selectFeature = feature;
                }
            });
        }

        function addFeatureClick() {
            that.map.on('click', function (evt) {
                var feature = that.map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) { return feature; });
                if (feature) {
                    featureClicked(feature.get('attributes'));
                }
            });
        }

        function featureClicked(attributes) {
            if (typeof attributes === 'undefined' || typeof attributes.itemId === 'undefined') {
                return;
            }

            var itemId = attributes.itemId;
            that.mapOptions.itemClickedHandler(itemId);
        }

        function showPopup(feature, popup, element) {
            var attributes = feature.get('attributes');
            if (typeof attributes === 'undefined') return;

            var geometry = feature.getGeometry();
            var coord = geometry.getCoordinates();
            popup.setPosition(coord);
            $(element).popover({
                'placement': 'top',
                'html': true,
                'content': getFeaturePopoverContent(feature)
            });
            $(element).popover('show');
        }

        function getFeaturePopoverContent(feature) {
            var attributes = feature.get('attributes');
            var content = ('<strong>Name: </strong>' + attributes.name || '');

            return content;
        }

        function createItemsLayer() {

            var features = [];
            that.mapObjects.assets.forEach(function (asset) {
                var assetFeatures = createAssetFeatures(asset);
                assetFeatures.forEach(function (assetFeature) { features.push(assetFeature); });
            });

            var vectorSource = new ol.source.Vector({ features: features });
            return new ol.layer.Vector({ source: vectorSource });
        }

        function transformFromLongLat(coords) {
            return ol.proj.transform(coords, 'EPSG:4326', 'EPSG:3857');
        }

        function transformToLongLat(coords) {
            return ol.proj.transform(coords, 'EPSG:3857', 'EPSG:4326');
        }

        function createAssetFeatures(item) {
            var assetFeatures = [];
            createAssetIcon(assetFeatures, item);
            createAssetShapes(assetFeatures, item.shapes);

            return assetFeatures;
        }

        function createAssetIcon(assetFeatures, item) {
            var geometry = new ol.geom.Point(transformFromLongLat([item.long, item.lat]));
            var iconFeature = new ol.Feature({
                geometry: geometry,
                name: item.name,
                attributes: {
                    itemId: item.assetId,
                    name: item.name,
                }
            });

            var iconStyle = new ol.style.Style({
                image: new ol.style.Icon(({
                    anchor: [0.5, 0.75],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'fraction',
                    opacity: 0.75,
                    src: item.icon
                }))
            });

            iconFeature.setStyle(iconStyle);

            assetFeatures.push(iconFeature);
        }

        function createAssetShapes(assetFeatures, shapes) {
            if (!$.isArray(shapes)) {
                return;
            }

            for (var i = 0; i < shapes.length; i++) {
                createShape(assetFeatures, shapes[i]);
            }
        }

        function createShape(assetFeatures, shape) {
            switch (shape.type.name) {
                case 'points':
                    createPointsShape(assetFeatures, shape.points);
                    break;
                case 'lines':
                    createLinesShape(assetFeatures, shape.points);
                    break;
            }
        }

        function createPointsShape(assetFeatures, points) {
            if (!$.isArray(points)) {
                return;
            }

            for (var i = 0; i < points.length; i++) {
                var point = points[i];
                var center = transformFromLongLat([point.long, point.lat]);


                var geometry = new ol.geom.Circle(center, 5, 'XY');

                var pointFeature = new ol.Feature({
                    geometry: geometry,
                });

                var pointStyle = new ol.style.Style({
                    anchor: [0.75, 0.75],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'fraction',
                    fill: new ol.style.Fill(({
                        color: [255, 0, 0, 1],
                    }))
                });

                pointFeature.setStyle(pointStyle);

                assetFeatures.push(pointFeature);
            }
        }

        function createLinesShape(assetFeatures, points) {
            if (!$.isArray(points)) {
                return;
            }

            var transformedPoints = [];
            for (var i = 0; i < points.length; i++) {
                var point = points[i];
                transformedPoints.push(transformFromLongLat([point.long, point.lat]));
            }

            var geometry = new ol.geom.LineString(transformedPoints);

            var strokeFeature = new ol.Feature({
                geometry: geometry,
            });

            var strokeStyle = new ol.style.Style({
                stroke: new ol.style.Stroke(({
                    anchor: [0.75, 0.75],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'fraction',
                    width: 1,
                    color: [255, 0, 0, 1],
                }))
            });

            strokeFeature.setStyle(strokeStyle);

            assetFeatures.push(strokeFeature);
        }

        function createPolygonShape(assetFeatures, points) {
            if (!$.isArray(points)) {
                return;
            }

            var transformedPoints = [];
            for (var i = 0; i < points.length; i++) {
                var point = points[i];
                transformedPoints.push(transformFromLongLat([point.long, point.lat]));
            }

            var polygon = new ol.geom.Polygon([transformedPoints]);

            var polygonFeature = new ol.Feature({
                geometry: polygon,
            });

            assetFeatures.push(polygonFeature);
        }

        function addInteraction(interactionType) {
            that.drawInteraction = new ol.interaction.Draw({
                //features: that.interactionLayer.getSource().getFeatures(),
                source: that.interactionLayer.getSource(),
                /** @type {ol.geom.GeometryType} */
                type: interactionType,
            });
            that.drawInteraction.on('drawend', interactionDrawEnded);
            that.map.addInteraction(that.drawInteraction);
        }

        function interactionDrawEnded(drawEvent) {
            var polygonCoordinates = getFeatureCoordinates(drawEvent.feature);
            that.mapObjects.polygons.push(polygonCoordinates);
        }

        function removeInteraction() {
            that.drawInteraction.un('drawend', interactionDrawEnded);
            that.map.removeInteraction(that.drawInteraction);
            that.drawInteraction = null;
        }

        function createControls() {
            var controls = [
                new ol.control.Zoom
            ];

            if (that.mapOptions.allowPolygonSelection) {
                controls.push(new PolygonSelectionControl({
                    toggleSelectionClickHandler: togglePolygonSelection,
                    sendPolygonsClickHandler: sendPolygonCoordinates
                }));
            }

            controls.push(new panControl({
                panNorth: function (e) {
                    e.preventDefault();
                    panMap('north');
                },
                panSouth: function (e) {
                    e.preventDefault();
                    panMap('south');
                },
                panEast: function (e) {
                    e.preventDefault();
                    panMap('east');
                },
                panWest: function (e) {
                    e.preventDefault();
                    panMap('west');
                }
            }));

            return ol.control.defaults({ attribution: true, zoom: true, rotate: false }).extend(controls);
        }

        function restorePolygonSelectionMode() {
            togglePolygonSelection(!!that.mapOptions.polygonSelectionEnabled);
        }

        function togglePolygonSelection(isActive) {
            //createInteractionLayer();

            isActive = typeof isActive === 'undefined' ? !that.isActivePolygonInteraction : isActive;
            if (isActive === that.isActivePolygonInteraction) return;

            if (that.isActivePolygonInteraction) {
                removeInteraction();
            } else {
                addInteraction("Polygon");
            }

            that.isActivePolygonInteraction = !that.isActivePolygonInteraction;
        }

        function getPolygonCoordinates() {
            var result = [];
            var features = that.interactionLayer.getSource().getFeatures();
            features.forEach(function (feature) {
                var featureCoordinates = getFeatureCoordinates(feature);
                result.push(featureCoordinates);
            });

            return result;
        }

        function getPositionData() {
            var view = that.map.getView();

            return {
                center: transformToLongLat(view.getCenter()),
                zoomLevel: view.getZoom(),
            };
        }

        function getFeatureCoordinates(feature) {
            var coordinates = feature.getGeometry().getCoordinates()[0];

            var featurePoints = [];
            coordinates.forEach(function (point) {
                var longLat = transformToLongLat(point);
                featurePoints.push({ long: longLat[0], lat: longLat[1] });
            });

            return { points: featurePoints };
        }

        function sendPolygonCoordinates() {
            var polygons = getPolygonCoordinates();
            var mapStateParams = getMapStateParams();
            that.mapOptions.sendPolygonsHandler({ polygons: polygons, mapStateParams: mapStateParams, });
        }

        function mapMoveEnd() {
            trySaveMapStateParams();
            updateMapPositionData();
        }

        function trySaveMapStateParams() {
            if (that.mapOptions.isMapPinned) {
                updateMapStateParams();
            }
        }

        function updateMapPositionData() {
            that.mapOptions.positionData = getPositionData();
        }

        function undoLastPoint() {
            if (that.drawInteraction === null) {
                return;
            }

            var interaction = that.drawInteraction;
            var polygons = interaction.d;
            if (polygons != null && polygons.length > 0) {
                var lastPolygon = polygons[polygons.length - 1];
                if (lastPolygon.length > 1) {
                    lastPolygon.splice(lastPolygon.length - 1, 1);
                }
            }

            that.map.render();
        }

        function removeAllPolygons() {
            that.interactionLayer.getSource().clear();
            that.mapObjects.polygons = [];
        }

        function setMapSource(sourceString) {
            that.mapSource = sourceString;
            var sourceLayer = createMapLayer();

            var allLayers = that.map.getLayers().getArray();

            allLayers.splice(0, 1, sourceLayer);

            that.map.render();

            trySaveMapStateParams();
        }

        function getMapStateParams() {
            return { positionData: getPositionData(), mapSource: that.mapOptions.mapSource, };
        }

        function updateMapStateParams() {
            var mapStateParams = null;
            if (that.mapOptions.isMapPinned) {
                mapStateParams = getMapStateParams();
            }

            that.mapOptions.saveMapStateParamsHandler(mapStateParams);
        }

        function updateSize() {
            that.map.updateSize();
        }

        /************************************************GEOLOCATION********************************************************/

        function goToCurrentPosition() {
            if (!!that.mapOptions.polygonSelectionEnabled) return;

            initGeolocationObject();

        }

        function setPositionTracking(enableTracking) {
            if (!!that.mapOptions.polygonSelectionEnabled) return;

            if (!!enableTracking) {
                initGeolocationObject();
                //simulate();
            } else {
                unregisterGeolocationEvents();
            }
        }

        function addGeolocationLayer() {
            if (!!that.mapOptions.polygonSelectionEnabled) return;

            that.geolocationData.marker = new ol.Overlay({
                positioning: 'center-center',
                element: that.geolocationData.markerElement,
                stopEvent: false
            });

            that.map.addOverlay(that.geolocationData.marker);
        }

        function initGeolocationObject() {
            if (typeof AssetMap.geolocation === "undefined") {
                AssetMap.geolocation = createGeolocationObject();
            }
            ;

            registerGeolocationChangeEvent();
            //addCenter();
            AssetMap.geolocation.setTracking(false);
            AssetMap.geolocation.setTracking(true);
        }

        function createGeolocationObject() {
            return new ol.Geolocation({
                projection: that.map.getView().getProjection(),
                trackingOptions: {
                    maximumAge: 10000,
                    enableHighAccuracy: true,
                    timeout: 600000,
                }
            });
        }

        function updateInfo(data) {
            var html = [
                'Position: ' + data.position[0].toFixed(2) + ', ' + data.position[1].toFixed(2),
                'Accuracy: ' + data.accuracy,
                'Speed: ' + (data.speed * 3.6).toFixed(1) + ' km/h',
            ].join('<br />');

            that.mapOptions.infoElement.innerHTML = html;
        }

        // modulo for negative values

        function mod(n) {
            return ((n % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
        }

        function addPosition(position, heading, m, speed) {
            var x = position[0];
            var y = position[1];
            var positions = that.geolocationData.positions;
            var fCoords = positions.getCoordinates();
            var previous = fCoords[fCoords.length - 1];
            var prevHeading = previous && previous[2];
            if (prevHeading) {
                var headingDiff = heading - mod(prevHeading);

                // force the rotation change to be less than 180°
                if (Math.abs(headingDiff) > Math.PI) {
                    var sign = (headingDiff >= 0) ? 1 : -1;
                    headingDiff = -sign * (2 * Math.PI - Math.abs(headingDiff));
                }
                heading = prevHeading + headingDiff;
            }
            positions.appendCoordinate([x, y, heading, m]);

            // only keep the 20 last coordinates
            positions.setCoordinates(positions.getCoordinates().slice(-20));
        }

        function centerViewOnMarker(position) {
            var view = that.map.getView();

            view.setCenter(position);
            that.geolocationData.marker.setPosition(position);
            view.setZoom(that.mapOptions.maxZoom);
        }

        // change callback

        function registerGeolocationChangeEvent() {
            var geolocation = AssetMap.geolocation;

            unregisterGeolocationEvents();

            if (!!that.mapOptions.trackPosition) {
                geolocation.on('change:position', onChange);
            } else {
                geolocation.once('change:position', onChange);
            }
        }

        function onChange(evt) {
            console.log('onChange');

            var geolocation = AssetMap.geolocation;
            var position = geolocation.getPosition();
            var accuracy = geolocation.getAccuracy();
            var heading = geolocation.getHeading() || 0;
            var speed = geolocation.getSpeed() || 0;
            var m = Date.now();

            addPosition(position, heading, m, speed);

            var coords = that.geolocationData.positions.getCoordinates();
            var len = coords.length;
            if (len >= 2) {
                that.geolocationData.deltaMean = (coords[len - 1][3] - coords[0][3]) / (len - 1);
            }

            updateInfo({ position: position, accuracy: accuracy, heading: heading, speed: speed, deltaMean: that.geolocationData.deltaMean });

            var view = that.map.getView();
            centerViewOnMarker(position, view.getRotation(), view.getResolution());

            //Update Drag Location
            if (that.mapOptions.showDragMarker) {
                updateDragMakerLocation();
            }
        }

        function unregisterGeolocationEvents() {
            if (typeof AssetMap.geolocation !== "undefined") {
                AssetMap.geolocation.un('change:position', onChange);
            }
        }


        /************************************************GEOLOCATION********************************************************/
        /********************************************GEOLOCATION SIMULATION*************************************************/
        /*
        
        
                function simulate() {
                    var coordinates = {
                        "data":
                        [
                            {
                                "coords": {
                                    "speed": 1.7330950498580933,
                                    "accuracy": 5,
                                    "altitudeAccuracy": 8,
                                    "altitude": 238,
                                    "longitude": 5.868668798362713,
                                    "heading": 67.5,
                                    "latitude": 45.64444874417562
                                },
                                "timestamp": 1394788264972
                            }, {
                                "coords": {
                                    "speed": 1.9535436630249023,
                                    "accuracy": 5,
                                    "altitudeAccuracy": 8,
                                    "altitude": 238,
                                    "longitude": 5.868715401744348,
                                    "heading": 69.609375,
                                    "latitude": 45.64446391542036
                                },
                                "timestamp": 1394788266115
                            }, {
                                "coords": {
                                    "speed": 2.1882569789886475,
                                    "accuracy": 10,
                                    "altitudeAccuracy": 8,
                                    "altitude": 238,
                                    "longitude": 5.868768962105614,
                                    "heading": 67.5,
                                    "latitude": 45.644484995906836
                                },
                                "timestamp": 1394788267107
                            }, {
                                "coords": {
                                    "speed": 2.4942498207092285,
                                    "accuracy": 5,
                                    "altitudeAccuracy": 6,
                                    "altitude": 237,
                                    "longitude": 5.868825791409117,
                                    "heading": 68.5546875,
                                    "latitude": 45.64450435810316
                                },
                                "timestamp": 1394788267959
                            }, {
                                "coords": {
                                    "speed": 2.7581217288970947,
                                    "accuracy": 5,
                                    "altitudeAccuracy": 6,
                                    "altitude": 237,
                                    "longitude": 5.868881698703271,
                                    "heading": 69.609375,
                                    "latitude": 45.64452149909515
                                },
                                "timestamp": 1394788268964
                            }, {
                                "coords": {
                                    "speed": 3.3746347427368164,
                                    "accuracy": 5,
                                    "altitudeAccuracy": 6,
                                    "altitude": 236,
                                    "longitude": 5.868938528006774,
                                    "heading": 70.3125,
                                    "latitude": 45.644536712249405
                                },
                                "timestamp": 1394788270116
                            }, {
                                "coords": {
                                    "speed": 3.597411870956421,
                                    "accuracy": 5,
                                    "altitudeAccuracy": 6,
                                    "altitude": 236,
                                    "longitude": 5.868992004549009,
                                    "heading": 74.8828125,
                                    "latitude": 45.644547943999655
                                },
                                "timestamp": 1394788271158
                            }, {
                                "coords": {
                                    "speed": 3.6382505893707275,
                                    "accuracy": 5,
                                    "altitudeAccuracy": 6,
                                    "altitude": 236,
                                    "longitude": 5.869038775568706,
                                    "heading": 73.828125,
                                    "latitude": 45.64456005584974
                                },
                                "timestamp": 1394788271893
                            }, {
                                "coords": {
                                    "speed": 3.65671443939209,
                                    "accuracy": 5,
                                    "altitudeAccuracy": 6,
                                    "altitude": 236,
                                    "longitude": 5.869091162463528,
                                    "heading": 73.4765625,
                                    "latitude": 45.644572335337884
                                },
                                "timestamp": 1394788272903
                            }, {
                                "coords": {
                                    "speed": 3.7153592109680176,
                                    "accuracy": 5,
                                    "altitudeAccuracy": 6,
                                    "altitude": 236,
                                    "longitude": 5.869144219910604,
                                    "heading": 73.125,
                                    "latitude": 45.64458671030182
                                },
                                "timestamp": 1394788273914
                            }, {
                                "coords": {
                                    "speed": 3.8041043281555176,
                                    "accuracy": 5,
                                    "altitudeAccuracy": 4,
                                    "altitude": 236,
                                    "longitude": 5.869205072527629,
                                    "heading": 72.421875,
                                    "latitude": 45.64460313883204
                                },
                                "timestamp": 1394788274901
                            }, {
                                "coords": {
                                    "speed": 3.9588162899017334,
                                    "accuracy": 5,
                                    "altitudeAccuracy": 4,
                                    "altitude": 236,
                                    "longitude": 5.869268858810765,
                                    "heading": 72.421875,
                                    "latitude": 45.64461990263838
                                },
                                "timestamp": 1394788276140
                            }, {
                                "coords": {
                                    "speed": 4.152309417724609,
                                    "accuracy": 5,
                                    "altitudeAccuracy": 4,
                                    "altitude": 235,
                                    "longitude": 5.869351252918941,
                                    "heading": 78.046875,
                                    "latitude": 45.64466122542102
                                },
                                "timestamp": 1394788276948
                            }, {
                                "coords": {
                                    "speed": 4.49971866607666,
                                    "accuracy": 5,
                                    "altitudeAccuracy": 6,
                                    "altitude": 236,
                                    "longitude": 5.869433479389054,
                                    "heading": 79.8046875,
                                    "latitude": 45.64467040360499
                                },
                                "timestamp": 1394788277892
                            }, {
                                "coords": {
                                    "speed": 4.824056148529053,
                                    "accuracy": 5,
                                    "altitudeAccuracy": 6,
                                    "altitude": 235,
                                    "longitude": 5.869504055013758,
                                    "heading": 91.40625,
                                    "latitude": 45.64466089014489
                                },
                                "timestamp": 1394788279211
                            }, {
                                "coords": {
                                    "speed": 5.269814491271973,
                                    "accuracy": 10,
                                    "altitudeAccuracy": 6,
                                    "altitude": 235,
                                    "longitude": 5.869575049733621,
                                    "heading": 91.40625,
                                    "latitude": 45.64465967476893
                                },
                                "timestamp": 1394788279898
                            }
                        ]
                    }.data;
        
                    var first = coordinates.shift();
                    simulatePositionChange(first);
        
                    var prevDate = first.timestamp;
                    function geolocate() {
                        var position = coordinates.shift();
                        if (!position) {
                            return;
                        }
                        var newDate = position.timestamp;
                        simulatePositionChange(position);
                        window.setTimeout(function() {
                            prevDate = newDate;
                            geolocate();
                        }, (newDate - prevDate) / 0.5);
                    }
                    geolocate();
                };
        
                function simulatePositionChange(position) {
                    var coords = position.coords;
                    AssetMap.geolocation.set('accuracy', coords.accuracy);
                    AssetMap.geolocation.set('heading', degToRad(coords.heading));
                    var position_ = [coords.longitude, coords.latitude];
                    var projectedPosition = ol.proj.transform(position_, 'EPSG:4326', 'EPSG:3857');
                    AssetMap.geolocation.set('position', projectedPosition);
                    AssetMap.geolocation.set('speed', coords.speed);
                    AssetMap.geolocation.dispatchChangeEvent();
                }
        
                // convert degrees to radians
                function degToRad(deg) {
                    return deg * Math.PI * 2 / 360;
                }
                */
        /********************************************GEOLOCATION SIMULATION*************************************************/

        function cleanUpHandlers() {
            unregisterGeolocationEvents();
        }
    };
})()