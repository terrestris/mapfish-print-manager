'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Shared = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _group = require('ol/layer/group');

var _group2 = _interopRequireDefault(_group);

var _tilewms = require('ol/source/tilewms');

var _tilewms2 = _interopRequireDefault(_tilewms);

var _imagewms = require('ol/source/imagewms');

var _imagewms2 = _interopRequireDefault(_imagewms);

var _proj = require('ol/proj');

var _proj2 = _interopRequireDefault(_proj);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Some shared static utility methods.
 *
 * @class
 */
var Shared = exports.Shared = function Shared() {
  _classCallCheck(this, Shared);
};

Shared.getInteractionsByName = function (map, name) {
  var interactions = map.getInteractions().getArray();
  return interactions.filter(function (interaction) {
    return interaction.get('name') === name;
  });
};

Shared.getLayersByName = function (map, name) {
  var layers = Shared.getMapLayers(map);
  return layers.filter(function (layer) {
    return layer.get('name') === name;
  });
};

Shared.getMapLayers = function (collection) {
  var layers = collection.getLayers().getArray();
  var mapLayers = [];

  layers.forEach(function (layer) {
    if (layer instanceof _group2.default) {
      Shared.getMapLayers(layer).forEach(function (l) {
        mapLayers.push(l);
      });
    }
    mapLayers.push(layer);
  });

  return mapLayers;
};

Shared.getLegendGraphicUrl = function (layer) {
  if (layer.getSource() instanceof _tilewms2.default || layer.getSource() instanceof _imagewms2.default) {
    var customParams = layer.get('customPrintLegendParams');
    var source = layer.getSource();

    var _source$getParams = source.getParams(),
        LAYERS = _source$getParams.LAYERS,
        VERSION = _source$getParams.VERSION,
        FORMAT = _source$getParams.FORMAT,
        passThroughParams = _objectWithoutProperties(_source$getParams, ['LAYERS', 'VERSION', 'FORMAT']);

    var url = source instanceof _imagewms2.default ? source.getUrl() : source.getUrls()[0];
    var params = _extends({
      LAYER: LAYERS.split(',')[0],
      VERSION: VERSION || '1.3.0',
      SERVICE: 'WMS',
      REQUEST: 'GetLegendGraphic',
      FORMAT: FORMAT || 'image/png'
    }, customParams, passThroughParams);
    var queryParams = Object.keys(params).map(function (key) {
      return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
    }).join('&');

    return url + '?' + queryParams;
  }
};

Shared.getScaleForResolution = function (resolution, units) {
  var dpi = 25.4 / 0.28;
  var mpu = _proj2.default.METERS_PER_UNIT[units];
  var inchesPerMeter = 39.37;

  return parseFloat(resolution) * mpu * inchesPerMeter * dpi;
};

exports.default = Shared;