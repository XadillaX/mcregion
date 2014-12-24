/**
 * XadillaX created at 2014-12-24 11:03:57
 *
 * Copyright (c) 2014 XadillaX' Gensokyo, all rights
 * reserved
 */
var RegionParser = require("../lib/region_parser");

var startTime = new Date();
RegionParser.parse("./r.1.0.mca", function(err, region) {
    if(err) return console.error(err);
    var endTime = new Date();

    for(var i = 0; i < region.chunkCount(); i++) {
        var chunk = region.chunkAt(i);
        if(chunk && !chunk.empty) {
            console.log(chunk.toJSON());
        }
    }

    console.log(((endTime - startTime) / 1000) + "s.");
});

