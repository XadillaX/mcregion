/**
 * XadillaX created at 2014-12-24 12:45:19
 *
 * Copyright (c) 2014 XadillaX' Gensokyo, all rights
 * reserved
 */
var zlib = require("zlib");
var NBT = require("mcnbt");

/**
 * Chunk Class
 * @param {Buffer} buffer the original chunk buffer data
 * @constructor
 * @refer http://minecraft.gamepedia.com/Chunk_format
 */
var Chunk = function(buffer) {
    this._orig = { buffer: buffer };

    // ## Original Buffer Structure
    //
    // | byte        | 0  | 1  | 2  | 3  | 4                | 5                                  |
    // |-------------|-------------------|------------------|------------------------------------|
    // | description | length (in bytes) | compression type | compressed data (length - 1 bytes) |
    //
    // There are currently two defined compression schemes:
    //
    // | value | method                               |
    // |-------|--------------------------------------|
    // | 1     | GZip (RFC1952) (unused in practice ) |
    // | 2     | Zlib (RFC1950)                       |
    //
    // The uncompressed data is in NBT format and follows the information detailed on the
    // Chunk format article; if compressed with compression scheme 1, the compressed data
    // would be the same as the on-disk content of an Alpha chunk file. Note that chunks 
    // will always be saved using compression scheme 2 by the official client.
    this._orig.dataLength      = buffer.length ? buffer.readUInt32BE(0) : 0;
    this._orig.compressionType = buffer.length ? buffer.readUInt8(4) : 0;

    this.empty  = !buffer.length;
    this._buffer = undefined;
    this._chunkTags = null;
};

/**
 * toJSON
 * @return {Object} chunk json in NBT
 */
Chunk.prototype.toJSON = function() {
    if(this._chunkTags === null) return null;
    return this._chunkTags.toJSON();
};

/**
 * get NBT
 * @return {NBT} nbt object
 */
Chunk.prototype.getNBT = function() {
    return this._chunkTags;
};

/**
 * parse chunk body (private)
 * @param {Function} callback the callback function
 */
Chunk.prototype._parseBody = function(callback) {
    var self = this;
    var nbt = new NBT();
    nbt.loadFromBuffer(this._buffer, function(err) {
        if(err) return callback(err);
        self._chunkTags = nbt;

        callback();
    });
};

/**
 * parse this chunk
 * @param {Function} callback the callback function
 */
Chunk.prototype.parse = function(callback) {
    if(this.empty) return callback();
    if(this._orig.compressionType !== 2) {
        return callback(new Error("This compression type is unused in practice yet."));
    }

    // unzip first...
    var self = this;
    var body = this._orig.buffer.slice(5);
    zlib.unzip(body, function(err, buffer) {
        if(err) return callback(err);
        self._buffer = buffer;
        self._parseBody(callback);
    });
};

module.exports = Chunk;

