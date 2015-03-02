function submitCrash(crashDB, data) {
    var Firebase = require('firebase');
    var bikeSafetyDB = new Firebase(crashDB);
    var crashDB = bikeSafetyDB.child('CrashesUserSubmitted');
    var crash = crashDB.push();

    var crashTemplate = {
        ambulancer: '',
        bike_age: '',
        bike_alc_d: '',
        bike_dir: '',
        bike_injur: '',
        bike_pos: '',
        bike_race: '',
        bike_sex: '',
        city: '',
        county: '',
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

    for (p in data) {
        crashTemplate[p] = data[p];
    }

    crash.set(crashTemplate);
}

module.exports = submitCrash;

submitCrash('https://bikesafety.firebaseio.com', {
    bike_age: 11,
    city: 'Durham'
});
