OCEM.controller('mapController', ['$scope','leafletData','getCrashes', 'getCrashesUserSubmitted', 'datasetSettings',
function ($scope, leafletData, getCrashes, getCrashesUserSubmitted, datasetSettings) {
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

    $scope.setupAccidentColors = function() {
        $scope.colorAccidentsBy = $('#color_combo option:selected').val();
        $scope.categoryColors = d3.scale.category10();
        // Trim the bike_injur field b/c some of the fields have " Injury"
        // and others have "Injury".
        $scope.accidentLabel = d3.set($scope.crashes.concat($scope.userCrashes).map(function(d) {
            return $.trim(d[$scope.colorAccidentsBy]);
        })).values();
        $scope.accidentColor = _.map($scope.accidentLabel, function(type) {
          return $scope.categoryColors(type);
        });
        d3.select('.accidentLegend .rows')
            .selectAll('div')
            .remove();
        d3.select('.accidentLegend .rows')
            .selectAll('div')
            .data($scope.accidentLabel)
            .enter().append('div')
            .html(function(d, i) {
                return '<div class="legend-line"><div class="legend-circle inline" style="background-color:'+ $scope.accidentColor[i] +'"></div><div class="legend-label inline">'+ d +'</div></div>';
            });
    };
    $('#color_combo').change(function() {
        $scope.setupAccidentColors();
        $scope.$apply();
    });

    $scope.widthScale = d3.scale.linear()
        .domain([$scope.defaults.minZoom,$scope.defaults.maxZoom])
        .range([3,0.5]);

    getCrashes.then(function(result) {
        $scope.crashes = result;
        return leafletData.getMap('map_canvas');
    }).then(function(leafletMap) {
        $scope.map = leafletMap;
        return getCrashesUserSubmitted;
    }).then(function(result) {
        // Remove any accidents that don't have lat/lng:
        $scope.userCrashes = _.filter(result.data, function(v) {
            return v.latitude && v.longitude;
        });
    }).then(function() {
        L.d3SvgOverlay(function(selection, projection) {
            $scope.d3selection = selection;
            $scope.d3projection = projection;
            $scope.setupAccidentColors();
            $scope.leafletLoaded = true;
        }).addTo($scope.map);
    }).catch(function(err) {
        console.error(err);
    });
}]);
