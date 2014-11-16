var OCEM = angular.module('RideOrDie', ['ngRoute', 'ui.bootstrap', 'ui.mask','firebase', 'google-maps'.ns()]);

OCEM.controller('indexCtlr', ['$scope','$http','$firebase', indexCtrl]);


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
}])


function indexCtrl($scope, $http, $firebase) {
    $scope.dataSet = [];
    var ref = new Firebase("https://rideordie.firebaseio.com/");
    ref.once('value', function(snapshot){
        var dataarray = snapshot.val();
        dataarray.forEach(function(item){
            if(item.city.toString() == 'Durham'){
                $scope.dataSet.push(item);
            }
        });
        console.log($scope.dataSet);
    });

    $scope.url = '/data/durham-bike-lanes.geojson';
    var addedListener = false;
    var wasLoaded = false;
    var count = 0;

    $scope.map = {
        center: {latitude: 35.9886, longitude: -78.9072},
        zoom: 12,
        events: {
            tilesloaded: function (map) {
                $scope.$apply(function () {
                    $scope.mapInstance = map;
                    if (!addedListener) {
                        map.data.addListener('addfeature', function (event) {
                            if (count % 5 == 0) {
                                event.feature.setProperty("color", "red");
                            } else {
                                event.feature.setProperty("color", "green");
                            }
                            count++;
                        });
                    }
                    if (!wasLoaded) {
                        map.data.loadGeoJson($scope.url);
                        wasLoaded = true;
                    }
                    setInterval(updateMap($scope.mapInstance), 5000);
                });
            }
        }
    }
}

function updateMap(mapInstance) {
    mapInstance.data.setStyle(function(feature) {
        var color = 'gray';
        if (feature.getProperty('color')) {
            color = feature.getProperty('color');
        }
        return /** @type {google.maps.Data.StyleOptions} */({
            fillColor: color,
            strokeColor: color,
            strokeWeight: 2
        });
    });
}

