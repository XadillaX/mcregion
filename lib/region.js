/**
 * XadillaX created at 2014-12-23 17:46:27
 *
 * Copyright (c) 2014 XadillaX' Gensokyo, all rights
 * reserved
 */
var SECTOR_SIZE           = 4096;
var TIMESTAMP_BASE_OFFSET = 4096;

/**
 * Region File Object
 * @constructor
 * @refer http://minecraft.gamepedia.com/Region_file_format
 */
var Region = function(buffer) {
    this.buffer = buffer;
    this.chunkInformation = [];

    // initialize
    this._init();
};

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
        var sectorOffset = (this.buffer.readUInt8(i) << 16) + (this.buffer.readUInt8(i + 1) << 8) + this.buffer.readUInt8(i + 2);
        var sectorCount = this.buffer.readUInt8(i + 3);

        this.chunkInformation.push({ sectorOffset: sectorOffset, sectorCount: sectorCount });
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
        var timestamp = this.buffer.readUInt32BE(i);
        this.chunkInformation[(i - TIMESTAMP_BASE_OFFSET) / 4].timestamp = timestamp;
    }

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
    //
    // | byte        | 0    | 2    | 3   | 4                | 5                                  |
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
    for(var i = 0; i < this.chunkInformation.length; i++) {
        var sectorOffset                      = this.chunkInformation[i].sectorOffset;
        var sectorCount                       = this.chunkInformation[i].sectorCount;
        var start                             = sectorOffset * SECTOR_SIZE;
        var end                               = (sectorOffset + sectorCount) * SECTOR_SIZE;
        this.chunkInformation[i].originalData = this.buffer.slice(start, end);
    }
};

module.exports = Region;

