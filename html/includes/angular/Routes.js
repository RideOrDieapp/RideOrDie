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
    $scope.wrecks = [];
    $scope.accident = null;
    $scope.url = '/data/durham-bike-lanes.geojson';
    var addedListener = false;
    var count = 0;

    $scope.defaults = {
      scrollWheelZoom: false,
      maxZoom: 17,
      minZoom: 12
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

    $('#pleaseWaitDialog').modal('show');

    var dataset, roads;
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
                    }
                });
            });
        });
        return map;
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
            d3.select('#legend .accidentLegend .rows')
                .selectAll('div')
                .data(labels)
                .enter().append('div')
                .html(function(d, i) {
                    return '<div class="legend-line"><div class="legend-circle inline" style="background-color:'+ colors[i] +'"></div><div class="legend-label inline">'+ d +'</div></div>';
                });

            var path = d3.geo.path().projection(function(coord) {
                var latLng = new L.latLng(coord[1], coord[0]);
                var p = projection.latLngToLayerPoint(latLng);
                return [p.x,p.y];
            });
            var zoom = map.getZoom();
            var widthScale = d3.scale.linear()
                .domain([$scope.defaults.minZoom,$scope.defaults.maxZoom])
                .range([3,0.5]);
            var colorScale = d3.scale.linear()
                .domain([0,1,$scope.highestWrecks])
                .range(["#637939","#fd8d3c","#d62728"]);
            selection.selectAll('.bikepath')
                .data(roads, function(d) { return d.id; })
                .attr('d',path)
                .attr('stroke-width', widthScale(zoom) +'px')
                .enter().append('svg:path')
                .attr('d',path)
                .attr('opacity', 0.6)
                .attr('stroke', function(d, i) {
                    return colorScale(d.severityCount);
                })
                .attr('stroke-width', widthScale(zoom) +'px')
                .on('mouseover', function(d) {
                  $scope.wrecks = d.wrecks;
                })
                .on('mouseout', function(d) {
                  $scope.wrecks = [];
                })
                .attr('class','bikepath');

            // TODO color by...accident type, race, time of day.
            var eachCircle = function(d) {
                var p = projection.latLngToLayerPoint(L.latLng(d.latitude, d.longitude));
                var s = d3.select(this);
                s.attr('cx', p.x);
                s.attr('cy', p.y);
                s.attr('fill', function(d) { return category10($.trim(d.bike_injur)); });
                s.attr('r', widthScale(zoom));
            };
            selection.selectAll('.accident')
                .data(dataset, function(d) { return d.objectid; })
                .each(eachCircle)
                .enter().append('svg:circle')
                .each(eachCircle)
                .on('mouseover', function(d) {
                  $scope.accident = d;
                })
                .on('mouseout', function(d) {
                  $scope.accident = null;
                })
                .attr('class','accident');
        }).addTo(map);
    }).then(function() {
        $('#pleaseWaitDialog').modal('hide');
    }).catch(function(err) {
        console.error(err);
    });

    $('#modalStatus').text("Loading data...");
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
