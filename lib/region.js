/**
 * XadillaX created at 2014-12-23 17:46:27
 *
 * Copyright (c) 2014 XadillaX' Gensokyo, all rights
 * reserved
 */
var Scarlet = require("scarlet-task");
var Chunk = require("./chunk");

var SECTOR_SIZE           = 4096;
var TIMESTAMP_BASE_OFFSET = 4096;

/**
 * Region File Class
 * @param {Buffer} buffer the original MCA buffer data
 * @constructor
 * @refer http://minecraft.gamepedia.com/Region_file_format
 */
var Region = function(buffer) {
    this._buffer = buffer;
    this._chunkInformation = [];

    // initialize
    this._init();
};

/**
 * get the chunk count
 * @return {Number}
 */
Region.prototype.chunkCount = function() {
    return this._chunkInformation.length;
};

/**
 * get an ith chunk
 * @param {Number} idx get the ith chunk
 * @return {Chunk} the chunk object
 */
Region.prototype.chunkAt = function(idx) {
    if(idx < 0 || idx >= this._chunkInformation.length) {
        return undefined;
    }

    var chunk = this._chunkInformation[idx].chunk;
    if(!chunk || (chunk instanceof Error)) {
        return null;
    }

    return chunk;
};

/**
 * parse a chunk (private)
 * @param {TaskObject} TO the task object in scarlet task
 */
Region.prototype._parseChunk = function(TO) {
    var info    = TO.task.info;
    var chunk   = info.chunk;
    var scarlet = TO.task.scarlet;

    chunk.parse(function(err) {
        if(err) {
            info.chunk = err;
        }

        scarlet.taskDone(TO);
    });
};

/**
 * initialize chunks
 * @param {Function} callback the callback function
 */
Region.prototype.initializeChunks = function(callback) {
    var scarlet = new Scarlet(1);

    // ## Chunk Data
    //
    // from 8192 ~ ...
    //
    // Chunk data begins with a (big-endian) four-byte length field which indicates the
    // exact length of the remaining chunk data in bytes. The following byte indicates 
    // the compression scheme used for chunk data, and the remaining (length-1) bytes 
    // are the compressed chunk data.
    //
    // Minecraft always pads the last chunk's data to be a multiple-of-4096B in length (
    // so that the entire file has a size that is a multiple of 4KiB). Minecraft will not 
    // accept files in which the last chunk is not padded. Note that this padding is not 
    // included in the length field.
    for(var i = 0; i < this._chunkInformation.length; i++) {
        var sectorOffset                       = this._chunkInformation[i].sectorOffset;
        var sectorCount                        = this._chunkInformation[i].sectorCount;
        var start                              = sectorOffset * SECTOR_SIZE;
        var end                                = (sectorOffset + sectorCount) * SECTOR_SIZE;
        this._chunkInformation[i].originalData = this._buffer.slice(start, end);
        this._chunkInformation[i].chunk        = new Chunk(this._chunkInformation[i].originalData);

        scarlet.push({ scarlet: scarlet, info: this._chunkInformation[i] }, this._parseChunk.bind(this));
    }

    var self = this;
    scarlet.afterFinish(this._chunkInformation.length, function() {
        for(var i = 0; i < self._chunkInformation.length; i++) {
            if(!(self._chunkInformation[i].chunk instanceof Chunk)) {
                return callback(new Error("Broken chunk at " + i + ": " + self._chunkInformation[i].chunk.message + "."));
            }
        }

        callback();
    });
};

/**
 * initialize base information (private)
 */
Region.prototype._init = function() {
    // ## Chunk Location
    //
    // from 0 ~ 4095
    //
    // Location information for a chunk consists of four bytes split into two fields:
    // the first three bytes are a (big-endian) offset in 4KiB sectors from the start 
    // of the file, and a remaining byte which gives the length of the chunk (also in
    // 4KiB sectors, rounded up). Chunks will always be less than 1MiB in size. If a
    // chunk isn't present in the region file (e.g. because it hasn't been generated 
    // or migrated yet), both fields will be zero.
    //
    // | byte        | 0 | 1 | 2 | 3            |
    // |-------------|-----------|--------------|
    // | description | offset    | sector count |
    //
    // A chunk with an offset of 2 will begin right after the timestamps table.
    for(var i = 0; i < 4096; i += 4) {
        var sectorOffset = (this._buffer.readUInt8(i) << 16) + (this._buffer.readUInt8(i + 1) << 8) + this._buffer.readUInt8(i + 2);
        var sectorCount  = this._buffer.readUInt8(i + 3);

        this._chunkInformation.push({ sectorOffset: sectorOffset, sectorCount: sectorCount });
    }

    // ## Chunk Timestamps
    //
    // from 4096 ~ 8191
    //
    // The entries in the timestamp table are individual four-byte big-endian integers,
    // representing the last modification time of a chunk.
    //
    // | byte        | 0 | 1 | 2 | 3 |
    // |-------------|---------------|
    // | description | timestamp     |
    for(var i = 4096; i < 8192; i += 4) {
        var timestamp = this._buffer.readUInt32BE(i);
        this._chunkInformation[(i - TIMESTAMP_BASE_OFFSET) / 4].timestamp = timestamp;
    }
};

module.exports = Region;

