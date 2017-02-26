'use strict';

const jBinary = require('jbinary');
const customErrors = require('node-custom-errors');

const MixNotSupportedException = customErrors.create("MixNotSupportedException");

const Parsers = {
    mix: {
        parse: function(jbin, name) {
            let isEncrypted = false;

            if (!this._isMixCncVersion(jbin))
                isEncrypted = this._isMixEncrypted(jbin);

            if (isEncrypted) {
                throw new MixNotSupportedException("Error: Encrypted mixs are not currently supported!");
            }

            const entries = this._parseHeader(jbin);

            return {
                name,
                isEncrypted,
                entries,
            };
        },
        _isMixCncVersion: function(jbin) {
            const encryptionPair = jbin.read('uint16');
            return encryptionPair !== 0;
        },
        _isMixEncrypted: function(jbin) {
            const next2Bytes = jbin.read('uint16');
            return (next2Bytes & 0x2) !== 0;
        },
        _parseHeader: function(jbin) {
            const numFiles = jbin.read('uint16');
            jbin.read('uint32');

            const items = [...Array(numFiles).keys()];
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

const loadMixAsync = async function(filePathToMix) {
    const jbin = await jBinary.load(filePathToMix);
    return Parsers.mix.parse(jbin, filePathToMix);
}

module.exports = {
    loadMixAsync,
}