/// <reference path='../../typings/index.d.ts' />

/*
 * config.js: Default settings for all levels that winston knows about
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

var colors = require('colors/safe');

// Fix colors not appearing in non-tty environments
colors.enabled = true;

var config = exports,
    allColors = exports.allColors = {};

config.addColors = function (colors) {
  mixin(allColors, [colors]);
};

config.colorize = function (level, message) {
  if (typeof message === 'undefined') message = level;

  var colorized = message;
  if (allColors[level] instanceof Array) {
    for (var i = 0, l = allColors[level].length; i < l; ++i) {
      colorized = colors[allColors[level][i]](colorized);
    }
  }
  else if (allColors[level].match(/\s/)) {
    var colorArr = allColors[level].split(/\s+/);
    for (var i = 0; i < colorArr.length; ++i) {
      colorized = colors[colorArr[i]](colorized);
    }
    allColors[level] = colorArr;
  }
  else {
    colorized = colors[allColors[level]](colorized);
  }

  return colorized;
};

//
// Export config sets
//
config.cli    = require('./colors/cli-config');
config.npm    = require('./colors/npm-config');
config.syslog = require('./colors/syslog-config');

//
// Add colors for pre-defined config sets
//
config.addColors(config.cli.colors);
config.addColors(config.npm.colors);
config.addColors(config.syslog.colors);

function mixin (target, addition) {
  addition.forEach(function (a) {
    var keys = Object.keys(a);
    for (var i = 0; i < keys.length; i++) {
      target[keys[i]] = a[keys[i]];
    }
  });
  return target;
};