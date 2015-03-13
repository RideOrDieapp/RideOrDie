var crashTemplate = {
    ambulancer: '',
    bike_age: '',
    bike_alc_d: '',
    bike_dir: '',
    bike_injur: '',
    bike_pos: '',
    bike_race: '',
    bike_sex: '',
    city: 'Durham',
    county: 'Durham',
    crash_date: '',
    crash_grp: '',
    crash_hour: '',
    crash_loc: '',
    crash_mont: '',
    crash_time: '',
    crash_ty_1: '',
    crash_type: '',
    crash_year: '',
    crashalcoh: '',
    crashday: '',
    crsh_sevri: '',
    developmen: '',
    drvr_age: '',
    drvr_alc_d: '',
    drvr_estsp: '',
    drvr_injur: '',
    drvr_race: '',
    drvr_sex: '',
    drvr_vehty: '',
    drvrage_gr: '',
    excsspdind: '',
    fid: '',
    hit_run: '',
    latitude: '',
    light_cond: '',
    locality: '',
    location: '',
    longitude: '',
    num_lanes: '',
    num_units: '',
    objectid: '',
    rd_charact: '',
    rd_class: '',
    rd_conditi: '',
    rd_config: '',
    rd_defects: '',
    rd_feature: '',
    rd_surface: '',
    region: '',
    rural_urba: '',
    speed_limi: '',
    traff_cntr: '',
    weather: '',
    workzone_i: ''
};

// TODO add deafult 'unknown' value to all the comboboxes.

OCEM.controller('addAccidentController', ['$scope','getCrashesUserSubmitted','datasetSettings',
function ($scope, getCrashesUserSubmitted, datasetSettings) {
  $scope.questions = datasetSettings;

  $scope.ambulancer = false;
  $scope.weather = "Unknown";
  $scope.bike_injur = "Unknown";
  $scope.bike_sex = "Unknown";
  $scope.bike_race = "Unknown";
  $scope.bike_alc_d = false;
  $scope.drvr_injur = "Unknown";
  $scope.drvr_sex = "Unknown";
  $scope.drvr_race = "Unknown";
  $scope.drvr_estsp = "Unknown";
  $scope.drvr_alc_d = false;
  $scope.center = {
    lat: 35.9886,
    lng: -78.9072,
    zoom: 15
  };
  $scope.markers = {
    Location: {
      lat: 35.9886,
      lng: -78.9072,
      message: "Crash location",
      focus: true,
      draggable: true
    }
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

  $scope.updatePosition = function(position) {
    $scope.center.lat = position.coords.latitude;
    $scope.center.lng = position.coords.longitude;
    $scope.markers.Location.lat = position.coords.latitude;
    $scope.markers.Location.lng = position.coords.longitude;
    $scope.$apply();
  };
  $scope.showPositionError = function(err) {
    console.log("TODO show this in the UI");
  };
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition($scope.updatePosition,$scope.showPositionError);
  }

  $scope.addAccident = function() {
    var dataset;
    getCrashesUserSubmitted.then(function(result) {
        var accident = _.clone(crashTemplate);
        accident.ambulancer = $scope.ambulancer ? "Yes":"No";
        accident.weather = $scope.weather;
        accident.bike_injur = $scope.bike_injur;
        accident.bike_sex = $scope.bike_sex;
        accident.bike_race = $scope.bike_race;
        accident.bike_alc_d = $scope.bike_alc_d ? "Yes":"No";
        accident.drvr_injur = $scope.drvr_injur;
        accident.drvr_sex = $scope.drvr_sex;
        accident.drvr_race = $scope.drvr_race;
        accident.drvr_estsp = $scope.drvr_estsp;
        accident.drvr_alc_d = $scope.drvr_alc_d ? "Yes":"No";
        accident.latitude = $scope.markers.Location.lat;
        accident.longitude = $scope.markers.Location.lng;

        var crash = result.db.push();
        crash.set(accident);
    });
  };
}]);
