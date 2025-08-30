const { callbackify } = require('node:util');
const { connect } = require('node:http2');

module.exports = { callbackify, connect };
