var OCEM = angular.module('RideOrDie', ['ngRoute', 'ui.bootstrap', 'ui.mask','firebase', 'leaflet-directive']);

OCEM.constant('_',window._);

OCEM.controller('indexCtlr', ['$scope','$http','$firebase','$q','leafletData',indexCtrl]);

OCEM.config(['$routeProvider', '$locationProvider',
    function($routeProvider, $locationProvider) {
        $locationProvider.html5Mode(true);
        $routeProvider
        .when('/', {
            templateUrl: '/partials/Index',
            controller: 'indexCtlr'
        })
        .otherwise({
            redirectTo: '/'
        });
  }]);

OCEM.config(['$httpProvider', function ($httpProvider) {
    $httpProvider.interceptors.push(function() {
        return {
            request: function(request) {
                if (request.method === 'GET') {
                    if (request.url.indexOf('.') === -1) {
                        var sep = request.url.indexOf('?') === -1 ? '?' : '&';
                        request.url = request.url + sep + 'cacheBust=' + new Date().getTime();
                    }
                }
                return request;
            }
        };
    });
}]);


function indexCtrl($scope, $http, $firebase, $q, leafletData) {
    $scope.clickedFeature = "";
    $scope.marker = false;
    $scope.url = '/data/durham-bike-lanes.geojson';
    var addedListener = false;
    var count = 0;

    $scope.defaults = {
      scrollWheelZoom: false
    };
    $scope.center = {
      lat: 35.9886,
      lng: -78.9072,
      zoom: 12
    };
    $scope.layers = {
      baselayers: {
        xyz: {
          name: "CartoDB",
          url: "http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
          type: "xyz"
        }
      }
    };

    var legend = $('#legend');
    legend.dialog({
        autoOpen: true,
        dialogClass: "no-close",
        position: { my: "right top", at: "right-14 top+14", of: "#map_canvas" }
    });

    var deferred = $q.defer();
    var ref = new Firebase("https://rideordie.firebaseio.com/");
    ref.once('value', function(snapshot){
        deferred.resolve(snapshot);
    });
    deferred.promise.then(function(result) {
        dataset = result.val();
        return $http.get("/data/durham-bike-lanes.topojson");
    }).then(function(result) {
        roads = topojson.feature(result.data,result.data.objects['durham-bike-lanes']).features;
        return leafletData.getMap('map_canvas');
    }).then(function(map) {
        L.d3SvgOverlay(function(selection, projection) {
            var category10 = d3.scale.category10();
            // Trim the bike_injur field b/c some of the fields have " Injury"
            // and others have "Injury".
            var labels = d3.set(dataset.map(function(d) {
                return $.trim(d.bike_injur);
            })).values();
            var colors = _.map(labels, function(injury) {
              return category10(injury);
            });
            d3.select('#legend')
                .selectAll('div')
                .data(labels)
                .enter().append('div')
                .html(function(d, i) {
                    return '<div class="legend-line"><div class="legend-circle inline" style="background-color:'+ colors[i] +'"></div><div class="legend-label inline">'+ d +'</div></div>';
                });

            // TODO color by...accident type, race, time of day.
            var zoom = map.getZoom();
            // TODO use the following link to autoscale the radius
            var eachCircle = function(d) {
                var p = projection.latLngToLayerPoint(L.latLng(d.latitude, d.longitude));
                var s = d3.select(this);
                s.attr('cx', p.x);
                s.attr('cy', p.y);
                s.attr('fill', function(d) { return category10($.trim(d.bike_injur)); });
                s.attr('r', 2);
            };
            selection.selectAll('.accident')
                .data(dataset, function(d) { return d.objectid; })
                .each(eachCircle)
                .enter().append('svg:circle')
                .each(eachCircle)
                .attr('class','accident');
        }).addTo(map);
    });

    /*
    var routeInfo = $('#route_info');
    routeInfo.dialog({ autoOpen: true, position: { my: "right bottom", at: "right-14 bottom-28", of: "#map_canvas" } }); // Initialize dialog plugin

                $('#modalStatus').text("Loading Bike Routes...");
                $scope.dataSet = [];
                var dataset = null;
                var roads = null;

                $('#modalStatus').text("Retrieving & Processing Crash Data...");
                $http.get('/data/durham.json').then(function(result) {
                    dataset = result.data;
                    return $http.get("/data/durham-bike-lanes.topojson");
                }).then(function(result) {
                    roads = topojson.feature(result.data,result.data.objects['durham-bike-lanes']).features;
                }).then(function() {
                    var path = d3.geo.path();
                    roads.forEach(function(arc) {
                        arc.wrecks = [];
                        arc.severityCount = 0;
                    });
                    $scope.highestWrecks = 0;
                    roads.forEach(function(arc) {
                        var arcFound = false;
                        arc.geometry.coordinates.forEach(function(point) {
                            dataset.forEach(function(accident) {
                                var dist = calcCrow(
                                    +accident.latitude,
                                    +accident.longitude,
                                    point[1],
                                    point[0]);
                                if (dist < 0.04572 && !arcFound) { //150 feet
                                    arcFound = true;
                                    arc.severityCount++;
                                    if (arc.severityCount > $scope.highestWrecks) {
                                        $scope.highestWrecks = arc.severityCount;
                                        $scope.highestWreckLoc = accident;
                                    }
                                    arc.wrecks.push(accident);
                                    $scope.dataSet.push(accident);
                                }
                            });
                        });
                    });
                    map.data.forEach(function(feature) {
                        feature.setProperty("severity", parseFloat((feature.getProperty('severityCount'))/$scope.highestWrecks));
                    });

                    map.data.addListener('click', function(event){
                        $scope.clickedFeature = event.feature;
                        var routeInfo = $('#route_info');
                        $('.ui-dialog-titlebar-close').html("X");
                        $('#wreck_count').text(event.feature.getProperty('severityCount'));
                        routeInfo.dialog( "open" ); // Initialize dialog plugin
                        $scope.$apply();
                        routeInfo.dialog( "option", "position", { my: "right bottom", at: "right-14 bottom-28", of: ".angular-google-map-container" } );
                    });
                }).then(function() {
                    var overlay = new google.maps.OverlayView();
                    overlay.onAdd = function() {
                        var svg = d3.select(this.getPanes().overlayLayer)
                            .append('div')
                                .attr('class','bikeOverlay')
                            .append('svg')
                                .attr('class','bikeSvg');
                        var roadGroup = svg.append('g')
                            .attr('class','roads');
                        var accidentGroup = svg.append('svg')
                            .attr('class','accidents');
                        var accidentKey = svg.append('g')
                            .attr('class','keyPane');

                        overlay.draw = function() {
                            var overlayProjection = this.getProjection();
                            var zoom = this.getMap().getZoom();

                            var d3Projection = function(gmapCoord) {
                                var googleCoordinates = new google.maps.LatLng(gmapCoord[1], gmapCoord[0]);
                                var pixelCoordinates = overlayProjection.fromLatLngToDivPixel(googleCoordinates);
                                return [pixelCoordinates.x + 4000 , pixelCoordinates.y + 4000];
                            };
                            var path = d3.geo.path().projection(d3Projection);

                            var color = d3.scale.linear()
                                .domain([0,1,$scope.highestWrecks])
                                .range(["#637939","#fd8d3c","#d62728"]);
                            var opacity = d3.scale.linear()
                                .domain([0,$scope.highestWrecks])
                                .range([0.5,1]);
                            roadGroup.selectAll('path')
                                .data(roads, function(d) { return d.id; })
                                .attr('d',path)
                                .attr('stroke-width', (zoom-10) +'px')
                                .enter().append('svg:path')
                                .attr('d',path)
                                .attr('opacity', function(d, i) {
                                  return opacity(d.severityCount);
                                })
                                .attr('stroke', function(d, i) {
                                  return color(d.severityCount);
                                })
                                .attr('stroke-width', (zoom-10) +'px')
                                .attr('class','road');

                            // find all the unique values in the array
                            $scope.accidentTypes = d3.set(dataset.map(function(d) {
                              return d.bike_injur;
                            })).values();

                            var injuryColors = d3.scale.category10();
                            var eachCircle = function(d) {
                                var p = d3Projection([d.longitude, d.latitude]);
                                var s = d3.select(this);
                                s.attr('cx', p[0]);
                                s.attr('cy', p[1]);
                                s.attr('fill', injuryColors($scope.accidentTypes.indexOf(d.bike_injur)));
                                s.attr('r', (zoom-10));
                            };
                            accidentGroup.selectAll('circle')
                                .data(dataset, function(d) { return d.objectid; })
                                .each(eachCircle)
                                .enter().append('svg:circle')
                                .each(eachCircle)
                                .attr('class','accident');

                            accidentKey
                                .attr('top', $(map.getDiv()).width() - 150 +'px')
                                .attr('left', $(map.getDiv()).height() - 150 +'px')
                                .attr('width',100)
                                .attr('height',100);
                            accidentKey.selectAll('.accidentKey')
                                .data($scope.accidentTypes)
                                .enter().append('g')
                                .attr('class','accidentKey')
                                .each(function(d) {
                                    var g = d3.select(this);
                                    g.append('text');
                                });
                        };
                    };
                    overlay.setMap(map);
                }).then(function() {
                    // TODO update the legend
                    wasLoaded = true;
                    $('#pleaseWaitDialog').modal('hide');
                }).catch(function(err) {
                    console.error(err);
                });

    $('#pleaseWaitDialog').modal('show');
    $scope.$apply(function () {
        $scope.mapInstance = map;
        if (!addedListener) {
            map.data.addListener('addfeature', function (event) {
                event.feature.setProperty("severity", "0");
                event.feature.setProperty("severityCount", "0");
                event.feature.wrecks = [];
                count++;
            });
        }
        if (!wasLoaded) {
            $('#modalStatus').text("Loading Bike Routes...");
            map.data.loadGeoJson($scope.url);

            $scope.dataSet = [];
            $('#modalStatus').text("Retrieving & Processing Crash Data...");
            var ref = new Firebase("https://rideordie.firebaseio.com/");
            ref.once('value', function(snapshot){
                var dataarray = snapshot.val();
                $scope.highestWrecks = 0;
                dataarray.forEach(function(item){
                    if(item.city.toString() == 'Durham') {
                        map.data.forEach(function(feature) {

                            var featureFound = false;
                            feature.getGeometry().getArray().forEach(function(coord) {
                                var dist = calcCrow(coord.lat(), coord.lng(), item.location.latitude, item.location.longitude);
                                if (dist < 0.04572 && !featureFound) { //150 feet
                                    featureFound = true;
                                    //console.log("Coord: " + coord.lat() + ", " + coord.lng() + "Coord2: " + item.location.latitude + ", " + item.location.longitude +" - Distance: " + dist);
                                    feature.setProperty("severityCount", parseFloat(feature.getProperty('severityCount'))+1);
                                    if (parseFloat(feature.getProperty('severityCount')) > $scope.highestWrecks) {
                                        $scope.highestWrecks = parseFloat(feature.getProperty('severityCount'));
                                        $scope.highestWreckLoc = item;
                                    }
                                    feature.wrecks.push(item);
                                    $scope.dataSet.push(item);
                                }
                            });


                        });
                    }
                });
                map.data.forEach(function(feature) {
                    feature.setProperty("severity", parseFloat((feature.getProperty('severityCount'))/$scope.highestWrecks));
                });

                map.data.addListener('click', function(event){
                    $scope.clickedFeature = event.feature;
                    var routeInfo = $('#route_info');
                    $('.ui-dialog-titlebar-close').html("X");
                    $('#wreck_count').text(event.feature.getProperty('severityCount'));
                    routeInfo.dialog( "open" ); // Initialize dialog plugin
                    console.log(event.feature);
                    console.log($scope.clickedFeature);
                    $scope.$apply();
                    routeInfo.dialog( "option", "position", { my: "right bottom", at: "right-14 bottom-28", of: ".angular-google-map-container" } );
                });
                $scope.$apply();
                console.log($scope.highestWrecks);
                console.log($scope.highestWreckLoc);
                console.log($scope.dataSet);
                $('#pleaseWaitDialog').modal('hide');
            });


            wasLoaded = true;
        }
        setInterval(updateMap($scope.mapInstance), 5000);
    });
    */
    $('#modalStatus').text("Loading Google Maps...");
}

function updateMap(mapInstance) {
    mapInstance.data.setStyle(function(feature) {
        if (feature.getProperty('severityCount') && parseFloat(feature.getProperty('severityCount')) == 0) {
            color = "green";
        } else if (feature.getProperty('severityCount')) {
            color = getColor(parseFloat(feature.getProperty('severity')));
        }
        return /** @type {google.maps.Data.StyleOptions} */({
            fillColor: color,
            strokeColor: color,
            strokeWeight: 3
        });
    });

    mapInstance.set('styles', [
        {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [
                { color: '#CCCCCC' },
                { weight: .2 }
            ]
        }
    ]);
}

function getColor(value){
    //value from 0 to 1
    var hue=(((1-value)*120));
    if (hue < 0)
        hue = 0;
    return ["hsl(",hue,",100%,50%)"].join("");
}

function getSeverity(dataItem, highestWrecks) {
    if (dataItem)
    return 0;
}

//This function takes in latitude and longitude of two location and returns the distance between them as the crow flies (in km)
function calcCrow(lat1, lon1, lat2, lon2)
{
    var R = 6371; // km
    var dLat = toRad(lat2-lat1);
    var dLon = toRad(lon2-lon1);
    var lat1 = toRad(lat1);
    var lat2 = toRad(lat2);

    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;
    return d;
}

// Converts numeric degrees to radians
function toRad(Value)
{
    return Value * Math.PI / 180;
}

