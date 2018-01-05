'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WMSSerializer = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _imagewms = require('ol/source/imagewms');

var _imagewms2 = _interopRequireDefault(_imagewms);

var _tilewms = require('ol/source/tilewms');

var _tilewms2 = _interopRequireDefault(_tilewms);

var _BaseSerializer2 = require('./BaseSerializer');

var _BaseSerializer3 = _interopRequireDefault(_BaseSerializer2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * The WMSSerializer.
 *
 * @class
 */
var WMSSerializer = exports.WMSSerializer = function (_BaseSerializer) {
  _inherits(WMSSerializer, _BaseSerializer);

  /**
   * The constructor
   */


  /**
   * The WMS layer type identificator.
   *
   * @type {String}
   */
  function WMSSerializer() {
    _classCallCheck(this, WMSSerializer);

    return _possibleConstructorReturn(this, (WMSSerializer.__proto__ || Object.getPrototypeOf(WMSSerializer)).call(this, arguments));
  }

  /**
   * Serializes/Encodes the given layer.
   *
   * @param {ol.layer.Layer} layer The layer to serialize/encode.
   * @return {Object} The serialized/encoded layer.
   */


  /**
   * The ol sources this serializer is capable of serializing.
   *
   * @type {Array}
   */


  _createClass(WMSSerializer, [{
    key: 'serialize',
    value: function serialize(layer) {
      var source = layer.getSource();

      if (!this.validateSource(source)) {
        return;
      }

      var layers = source.getParams().LAYERS;
      var layersArray = layers ? layers.split(',') : [''];
      var styles = source.getParams().STYLES;
      var stylesArray = styles ? styles.split(',') : [''];

      var _source$getParams = source.getParams(),
          LAYERS = _source$getParams.LAYERS,
          STYLES = _source$getParams.STYLES,
          VERSION = _source$getParams.VERSION,
          WIDTH = _source$getParams.WIDTH,
          HEIGHT = _source$getParams.HEIGHT,
          FORMAT = _source$getParams.FORMAT,
          BBOX = _source$getParams.BBOX,
          CRS = _source$getParams.CRS,
          SRS = _source$getParams.SRS,
          customParams = _objectWithoutProperties(_source$getParams, ['LAYERS', 'STYLES', 'VERSION', 'WIDTH', 'HEIGHT', 'FORMAT', 'BBOX', 'CRS', 'SRS']);

      var serialized = _extends({}, _get(WMSSerializer.prototype.__proto__ || Object.getPrototypeOf(WMSSerializer.prototype), 'serialize', this).call(this, layer, source), {
        baseURL: source instanceof _imagewms2.default ? source.getUrl() : source.getUrls()[0],
        customParams: customParams,
        format: source.getParams().FORMAT || 'image/png',
        layers: layersArray,
        opacity: layer.getOpacity(),
        singleTile: source instanceof _imagewms2.default,
        styles: stylesArray,
        type: this.constructor.TYPE_WMS
      });

      return serialized;
    }
  }]);

  return WMSSerializer;
}(_BaseSerializer3.default);

WMSSerializer.TYPE_WMS = 'WMS';
WMSSerializer.sourceCls = [_imagewms2.default, _tilewms2.default];
exports.default = WMSSerializer;