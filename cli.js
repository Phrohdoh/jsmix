#!/usr/bin/env node

'use strict';

const proc = require('process');

const customErrors = require('node-custom-errors');
const InvalidArgumentsException = customErrors.create("InvalidArgumentsException");

async function main(filePathToLoad) {
    const jsmix = require('./lib/jsmix.js');
    const mix = await jsmix.loadMixAsync(filePathToLoad);
    console.info(mix);
}

const mixs = proc.argv.filter(arg => arg.endsWith(".mix"));
if (mixs.length !== 1) {
    throw new InvalidArgumentsException("Expected a single mix filepath argument");
}

const filePathToLoad = mixs[0];

main(filePathToLoad);