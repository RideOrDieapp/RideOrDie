OCEM.controller('mapController', ['$scope','leafletData','getCrashes', 'datasetSettings',
function ($scope, leafletData, getCrashes, datasetSettings) {
    // Provide a key that will let sub-controllers know when the map is ready to
    // draw on (data is loaded and leaflet is setup):
    $scope.leafletLoaded = false;

    $scope.keyToHumanReadables = datasetSettings;
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

    $scope.widthScale = d3.scale.linear()
        .domain([$scope.defaults.minZoom,$scope.defaults.maxZoom])
        .range([3,0.5]);

    getCrashes.then(function(result) {
        $scope.dataset = result.val();
        return leafletData.getMap('map_canvas');
    }).then(function(leafletMap) {
        $scope.map = leafletMap;
    }).then(function() {
        L.d3SvgOverlay(function(selection, projection) {
            $scope.d3selection = selection;
            $scope.d3projection = projection;
            $scope.leafletLoaded = true;
        }).addTo($scope.map);
    }).catch(function(err) {
        console.error(err);
    });
}]);
