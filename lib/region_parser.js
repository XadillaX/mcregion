/**
 * XadillaX created at 2014-12-23 17:47:26
 *
 * Copyright (c) 2014 XadillaX' Gensokyo, all rights
 * reserved
 */
var fs = require("fs");
var Region = require("./region");

/**
 * parse a *.mca file and get the Region object.
 * @param {String|Buffer} filename filename or binary file buffer
 * @param {Function} callback callback function
 */
var parse = exports.parse = function(filename, callback) {
    /**
     * if it's not a buffer, then call this function
     * rescursively
     */
    if(!(filename instanceof Buffer)) {
        if(typeof filename === "string") {
            return fs.readFile(filename, function(err, data) {
                if(err) return callback(err);
                parse(data, callback);
            });
        } else {
            return callback(new Error("Wrong type of first argument."));
        }
    }

    var buff = filename;
    var region = new Region(buff);
    region.initializeChunks(function(err) {
        return callback(err, region);
    });
};

