/**
 * XadillaX created at 2014-12-24 11:03:57
 *
 * Copyright (c) 2014 XadillaX' Gensokyo, all rights
 * reserved
 */
var RegionParser = require("../lib/region_parser");

RegionParser.parse("./r.1.0.mca", function(err, region) {
    if(err) return console.error(err);

    for(var i = 0; i < region.chunkCount(); i++) {
        var chunk = region.chunkAt(i);
        if(chunk && !chunk.empty) {
            console.log(i, chunk);
        }
    }
});

