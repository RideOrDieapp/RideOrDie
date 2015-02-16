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
    $scope.keyToHumanReadables = {
      bike_injur: { description: "Bicyclist Injury" },
      bike_sex: { description: "Bicyclist Gender" },
      ambulancer: { description: "Ambulance Called" },
      bike_alc_d: { description: "Bicyclist Drunk" },
      bike_pos: { description: "Bicyclist Location" },
      bike_race: { description: "Bicyclist Race" },
      drvr_alc_d: { description: "Driver Drunk" },
      drvr_estsp: { description: "Driver Speed" },
      drvr_injur: { description: "Driver Injury" },
      drvr_race: { description: "Driver Race" },
      drvr_sex: { description: "Driver Gender" },
      weather: { description: "Weather" }
    };
    $scope.colorAccidentsBy = "bike_injur";

    $scope.wrecks = [];
    $scope.accident = null;

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

    var dataset, roads, map, d3projection, d3selection;
    var updateMapFn = function(selection,projection) {
        var categoryColors = d3.scale.category10();
        // Trim the bike_injur field b/c some of the fields have " Injury"
        // and others have "Injury".
        var accidentLabel = d3.set(dataset.map(function(d) {
            return $.trim(d[$scope.colorAccidentsBy]);
        })).values();
        var accidentColor = _.map(accidentLabel, function(type) {
          return categoryColors(type);
        });

        var zoom = map.getZoom();
        var widthScale = d3.scale.linear()
            .domain([$scope.defaults.minZoom,$scope.defaults.maxZoom])
            .range([3,0.5]);

        var roadOpacity = d3.scale.linear()
            .domain([0,$scope.highestWrecks])
            .range([0.3,1]);
        var roadColor = d3.scale.linear()
            .domain([0,1,$scope.highestWrecks])
            .range(["#637939","#fd8d3c","#d62728"]);

        d3.select('#legend .accidentLegend .rows')
            .selectAll('div')
            .remove();
        d3.select('#legend .accidentLegend .rows')
            .selectAll('div')
            .data(accidentLabel)
            .enter().append('div')
            .html(function(d, i) {
                return '<div class="legend-line"><div class="legend-circle inline" style="background-color:'+ accidentColor[i] +'"></div><div class="legend-label inline">'+ d +'</div></div>';
            });

        d3.select('#legend .roadLegend .rows')
            .selectAll('div')
            .remove();
        d3.select('#legend .roadLegend .rows')
            .selectAll('div')
            .data(d3.range($scope.highestWrecks+1))
            .enter().append('div')
            .html(function(d, i) {
                return '<div class="legend-line"><div class="legend-circle inline" style="background-color:'+ roadColor(i) +';opacity:'+ roadOpacity(i) +'"></div><div class="legend-label inline">'+ i +'</div></div>';
            });

        var path = d3.geo.path().projection(function(coord) {
            var latLng = new L.latLng(coord[1], coord[0]);
            var p = projection.latLngToLayerPoint(latLng);
            return [p.x,p.y];
        });

        var eachCircle = function(d) {
            var p = projection.latLngToLayerPoint(L.latLng(d.latitude, d.longitude));
            var s = d3.select(this);
            s.attr('cx', p.x);
            s.attr('cy', p.y);
            s.attr('fill', function(d) { return categoryColors($.trim(d[$scope.colorAccidentsBy])); });
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
            .attr('opacity', 0.6)
            .attr('class','accident');

        selection.selectAll('.bikepath')
            .data(roads, function(d) { return d.id; })
            .attr('d',path)
            .attr('stroke-width', widthScale(zoom) +'px')
            .enter().append('svg:path')
            .attr('d',path)
            .attr('opacity', function(d, i) {
                return roadOpacity(d.severityCount);
            })
            .attr('stroke', function(d, i) {
                return roadColor(d.severityCount);
            })
            .attr('stroke-width', widthScale(zoom) +'px')
            .on('mouseover', function(d) {
              $scope.wrecks = d.wrecks;
            })
            .on('mouseout', function(d) {
              $scope.wrecks = [];
            })
            .attr('class','bikepath');
    };

    $('#color_combo').change(function(el) {
      $scope.colorAccidentsBy = $('#color_combo option:selected').val();
      updateMapFn(d3selection, d3projection);
    });

    var deferred = $q.defer();
    var ref = new Firebase("https://bikesafety.firebaseio.com/Crashes");
    ref.once('value', function(snapshot){
        deferred.resolve(snapshot);
    });
    deferred.promise.then(function(result) {
        dataset = result.val();
        return $http.get("/data/durham-bike-lanes.topojson");
    }).then(function(result) {
        roads = topojson.feature(result.data,result.data.objects['durham-bike-lanes']).features;
        return leafletData.getMap('map_canvas');
    }).then(function(leafletMap) {
        map = leafletMap;
        roads.forEach(function(arc) {
            arc.wrecks = [];
            arc.severityCount = 0;
        });
        $scope.highestWrecks = 0;
        dataset.forEach(function (accident) {
            if (accident.city.toString() == 'Durham' && accident.rd_ids) {
                accident.rd_ids.forEach(function (road_id) {
                    var currFeature = _.find(roads, function(r) { return r.id == road_id; });
                    currFeature.severityCount++;
                    currFeature.wrecks.push(accident);
                    if (currFeature.severityCount > $scope.highestWrecks) {
                        $scope.highestWrecks = currFeature.severityCount;
                        $scope.highestWreckLoc = accident;
                    }
                });

            }
        });
    }).then(function() {
        L.d3SvgOverlay(function(selection, projection) {
          d3selection = selection;
          d3projection = projection;
          updateMapFn(d3selection, d3projection);
        }).addTo(map);
    })
    .then(function() {
        $('#pleaseWaitDialog').modal('hide');
    }).catch(function(err) {
        console.error(err);
    });

    $('#modalStatus').text("Loading data...");
}
