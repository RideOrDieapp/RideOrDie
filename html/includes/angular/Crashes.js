OCEM.controller('crashesController', ['$scope','leafletData',
function ($scope, leafletData) {
    var updateMapFn = function(selection,projection) {
        var zoom = $scope.map.getZoom();
        var eachCircle = function(d) {
            var p = projection.latLngToLayerPoint(L.latLng(d.latitude, d.longitude));
            var s = d3.select(this);
            s.attr('cx', p.x);
            s.attr('cy', p.y);
            s.attr('fill', function(d) { return $scope.categoryColors($.trim(d[$scope.colorAccidentsBy])); });
            s.attr('r', $scope.widthScale(zoom));
        };
        // TODO fade in with a transition() when the data is added
        selection.selectAll('.crash')
            .data($scope.crashes, function(d) { return d.objectid; })
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
            .attr('class','crash');
    };

    $scope.change = function() {
        if (!$scope.showCrashes) {
            $scope.d3selection.selectAll('.crash').remove();
            return;
        }
        updateMapFn($scope.d3selection, $scope.d3projection);
    };
    $scope.showCrashes = true;
    $scope.$watch('accidentColor', function(newValue, oldValue) {
        if (!newValue) { return; }
        $scope.change();
    });
}]);
