Run
===

To run:

    npm install
    npm start

TopoJSON
========

To convert a geojson file to topojson, do:

    ./node_modules/.bin/topojson -p BIKE_FACIL --id-property OBJECTID_12 html/src/data/durham-bike-lanes.geojson > html/src/data/durham-bike-lanes.topojson

