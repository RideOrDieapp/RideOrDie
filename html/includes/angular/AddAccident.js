OCEM.controller('addAccidentController', ['$scope','$firebase','datasetSettings',
function ($scope, $firebase, datasetSettings) {
  $scope.questions = datasetSettings;
}]);
