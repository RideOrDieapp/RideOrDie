module.exports = function (app) {


    app.get('/', function (req, res) {
        res.render('layout');
    });

    app.get('/Applications/:appName', function (req, res) {
        res.render('layout');
    });

    app.get('/partials/:name', function (req, res) {
        var name = req.params.name;
        console.log(name);
        res.render(name);
    });
};