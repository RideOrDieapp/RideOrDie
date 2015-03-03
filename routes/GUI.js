module.exports = function (app) {
    app.get('/', function (req, res) {
        res.render('layout');
    });

    app.get('/addAccident', function (req, res) {
        res.render('layout');
    });

    app.get('/data/:fileName', function (req, res) {
        res.sendfile('/data/' + req.params.fileName, {root: './html/src/'});
    });

    app.get('/partials/Index', function (req, res) {
        res.render("Index");
    });

    app.get('/partials/:name', function (req, res) {
        var name = req.params.name;
        console.log(name);
        res.render(name);
    });

    app.get('/api/refreshCrashMapping', function(req, res) {
       var f = require('../lib/associateCrashesToRoads');
       f('https://bikesafety.firebaseio.com', 'html/src/data/durham-bike-lanes.geojson');
       res.send("Processing");
    });
};
