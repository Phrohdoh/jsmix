#!/usr/bin/env node

'use strict';

const proc = require('process');

const jBinary = require('jbinary');
const customErrors = require('node-custom-errors');

const MixNotSupportedException = customErrors.create("MixNotSupportedException");
const InvalidArgumentsException = customErrors.create("InvalidArgumentsException");

let mixs = proc.argv.filter(arg => arg.endsWith(".mix"));
if (mixs.length !== 1) {
    throw new InvalidArgumentsException("Expected a single mix filepath argument");
}

let filePathToLoad = mixs[0];

let Parsers = {
    mix: {
        parse: function(jbin, name) {
            let isEncrypted = false;

            if (!this._isMixCncVersion(jbin))
                isEncrypted = this._isMixEncrypted(jbin);

            if (isEncrypted) {
                throw new MixNotSupportedException("Error: Encrypted mixs are not currently supported!");
            }

            let entries = this._parseHeader(jbin);

            return {
                name,
                isEncrypted,
                entries,
            };
        },
        _isMixCncVersion: function(jbin) {
            let encryptionPair = jbin.read('uint16');
            return encryptionPair !== 0;
        },
        _isMixEncrypted: function(jbin) {
            let next2Bytes = jbin.read('uint16');
            return (next2Bytes & 0x2) !== 0;
        },
        _parseHeader: function(jbin) {
            let numFiles = jbin.read('uint16');
            jbin.read('uint32');

            let items = [...Array(numFiles).keys()];
            for (let i in items) {
                items[i] = Parsers.mixEntry.parse(jbin);
            }

            return items;
        },
    },
    mixEntry: {
        parse: function (jbin) {
            return {
                hash:   jbin.read('uint32'),
                offset: jbin.read('uint32'),
                len:    jbin.read('uint32'),
            };
        },
    },
}

jBinary.load(filePathToLoad).then(bin => {
    let mix = Parsers.mix.parse(bin, filePathToLoad);
    console.info(mix);
}).catch(err => {
    console.info(err.message);
});