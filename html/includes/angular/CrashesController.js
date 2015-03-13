OCEM.controller('crashesController', ['$scope','leafletData',
function ($scope, leafletData) {
    $('#color_combo').change(function(el) {
      $scope.colorAccidentsBy = $('#color_combo option:selected').val();
      updateMapFn($scope.d3selection, $scope.d3projection);
    });

    var updateMapFn = function(selection,projection) {
        var categoryColors = d3.scale.category10();
        // Trim the bike_injur field b/c some of the fields have " Injury"
        // and others have "Injury".
        var accidentLabel = d3.set($scope.dataset.map(function(d) {
            return $.trim(d[$scope.colorAccidentsBy]);
        })).values();
        var accidentColor = _.map(accidentLabel, function(type) {
          return categoryColors(type);
        });

        var zoom = $scope.map.getZoom();

        d3.select('#legend .accidentLegend .rows')
            .selectAll('div')
            .data(accidentLabel)
            .enter().append('div')
            .html(function(d, i) {
                return '<div class="legend-line"><div class="legend-circle inline" style="background-color:'+ accidentColor[i] +'"></div><div class="legend-label inline">'+ d +'</div></div>';
            });

        var eachCircle = function(d) {
            var p = projection.latLngToLayerPoint(L.latLng(d.latitude, d.longitude));
            var s = d3.select(this);
            s.attr('cx', p.x);
            s.attr('cy', p.y);
            s.attr('fill', function(d) { return categoryColors($.trim(d[$scope.colorAccidentsBy])); });
            s.attr('r', $scope.widthScale(zoom));
        };
        // TODO fade in with a transition() when the data is added
        selection.selectAll('.accident')
            .data($scope.dataset, function(d) { return d.objectid; })
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
    };

    $scope.change = function() {
        d3.select('#legend .accidentLegend .rows')
            .selectAll('div')
            .remove();
        if (!$scope.showCrashes) {
            $scope.d3selection.selectAll('.accident').remove();
            return;
        }
        updateMapFn($scope.d3selection, $scope.d3projection);
    };
    $scope.showCrashes = true;
    $scope.$watch('leafletLoaded', function(newValue, oldValue) {
        if (!newValue) {
            return;
        }
        $scope.change();
    });
}]);
