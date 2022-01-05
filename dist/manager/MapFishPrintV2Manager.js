'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MapFishPrintV2Manager = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _extent = require('ol/extent');

var _TileWMS = require('ol/source/TileWMS');

var _TileWMS2 = _interopRequireDefault(_TileWMS);

var _ImageWMS = require('ol/source/ImageWMS');

var _ImageWMS2 = _interopRequireDefault(_ImageWMS);

var _BaseMapFishPrintManager = require('./BaseMapFishPrintManager');

var _BaseMapFishPrintManager2 = _interopRequireDefault(_BaseMapFishPrintManager);

var _WMSSerializer = require('../serializer/WMSSerializer');

var _WMSSerializer2 = _interopRequireDefault(_WMSSerializer);

var _VectorSerializer = require('../serializer/VectorSerializer');

var _VectorSerializer2 = _interopRequireDefault(_VectorSerializer);

var _Shared = require('../util/Shared');

var _Shared2 = _interopRequireDefault(_Shared);

var _Logger = require('../util/Logger');

var _Logger2 = _interopRequireDefault(_Logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * The MapFishPrintV2Manager.
 *
 * @class
 */
var MapFishPrintV2Manager = exports.MapFishPrintV2Manager = function (_BaseMapFishPrintMana) {
  _inherits(MapFishPrintV2Manager, _BaseMapFishPrintMana);

  /**
   * The constructor
   */


  /**
   * The capabilities endpoint of the print service.
   *
   * @type {String}
   */
  function MapFishPrintV2Manager() {
    _classCallCheck(this, MapFishPrintV2Manager);

    var _this = _possibleConstructorReturn(this, (MapFishPrintV2Manager.__proto__ || Object.getPrototypeOf(MapFishPrintV2Manager)).call(this, arguments));

    _this.serializers = [_WMSSerializer2.default, _VectorSerializer2.default];

    _this.init = function () {
      if (!_this.url && _this.capabilities) {
        return _this.initManager(_this.capabilities);
      } else if (_this.url && !_this.capabilities) {
        return _this.loadCapabilities().then(function (json) {
          return Promise.resolve(_this.initManager(json));
        }).catch(function (error) {
          return Promise.reject(new Error('Could not initialize ' + ('the manager: ' + error.message)));
        });
      }
    };

    _this.loadCapabilities = function () {
      return fetch(_this.url + _this.constructor.INFO_JSON_ENDPOINT, {
        method: 'GET',
        headers: _extends({
          'Content-Type': 'application/json'
        }, _this.headers),
        credentials: _this.credentialsMode
      }).then(function (response) {
        return _this.validateResponse(response);
      }).then(function (response) {
        return response.json();
      }).then(function (json) {
        return Promise.resolve(json);
      }).catch(function (error) {
        return Promise.reject(new Error('Error while fetching the ' + ('print capabilities: ' + error.message)));
      });
    };

    _this.print = function (forceDownload) {
      if (!_this.isInitiated()) {
        _Logger2.default.warn('The manager hasn\'t been initiated yet. Please call init() first.');
        return;
      }

      var payload = _this.getPrintPayload();

      if (_this.method === 'GET') {
        var url = _this.capabilities.printURL + '?spec=' + encodeURIComponent(JSON.stringify(payload));
        if (forceDownload) {
          _this.download(url);
        } else {
          return url;
        }
      } else {
        return fetch(_this.capabilities.createURL, {
          method: _this.method,
          headers: _extends({
            'Content-Type': 'application/json'
          }, _this.headers),
          credentials: _this.credentialsMode,
          body: JSON.stringify(payload)
        }).then(function (response) {
          return _this.validateResponse(response);
        }).then(function (response) {
          return response.json();
        }).then(function (json) {
          var url = json.getURL;
          if (forceDownload) {
            _this.download(url);
          } else {
            return Promise.resolve(url);
          }
        }).catch(function (error) {
          return Promise.reject('Error while creating the print document: ' + error.message);
        });
      }
    };

    _this.getPrintPayload = function () {
      var mapView = _this.map.getView();
      var mapProjection = mapView.getProjection();
      var mapLayers = _Shared2.default.getMapLayers(_this.map);
      var extentFeatureGeometry = _this._extentFeature.getGeometry();

      var serializedLayers = mapLayers.filter(_this.filterPrintableLayer).reduce(function (acc, layer) {
        var serializedLayer = _this.serializeLayer(layer);
        if (serializedLayer) {
          acc.push(serializedLayer);
        }
        return acc;
      }, []);

      var serializedLegends = mapLayers.filter(_this.filterPrintableLegend).reduce(function (acc, layer) {
        var serializedLegend = _this.serializeLegend(layer);
        if (serializedLegend) {
          acc.push(serializedLegend);
        }
        return acc;
      }, []);

      var payload = _extends({
        units: mapProjection.getUnits(),
        srs: mapProjection.getCode(),
        layout: _this.getLayout().name,
        outputFormat: _this.getOutputFormat().name,
        dpi: _this.getDpi().value,
        layers: serializedLayers,
        pages: [{
          center: (0, _extent.getCenter)(extentFeatureGeometry.getExtent()),
          scale: _this.getScale().value,
          rotation: _this.calculateRotation() || 0
        }],
        legends: serializedLegends
      }, _this.customParams);

      return payload;
    };

    _this.filterPrintableLayer = function (layer) {
      return layer !== _this.extentLayer && layer.getVisible() && _this.layerFilter(layer);
    };

    _this.filterPrintableLegend = function (layer) {
      return layer !== _this.extentLayer && layer.getVisible() && _this.legendFilter(layer);
    };

    _this.serializeLayer = function (layer) {
      var layerSource = layer.getSource();
      var viewResolution = _this.map.getView().getResolution();

      var serializerCand = _this.serializers.find(function (serializer) {
        return serializer.sourceCls.some(function (cls) {
          return layerSource instanceof cls;
        });
      });

      if (serializerCand) {
        var serializer = new serializerCand();
        return serializer.serialize(layer, viewResolution);
      } else {
        _Logger2.default.info('No suitable serializer for this layer/source found. ' + 'Please check the input layer or provide an own serializer capabale ' + 'of serializing the given layer/source to the manager.');
      }
    };

    _this.serializeLegend = function (layer) {
      if (layer.getSource() instanceof _TileWMS2.default || layer.getSource() instanceof _ImageWMS2.default) {
        return {
          name: layer.get('name') || '',
          classes: [{
            name: '',
            icons: [_Shared2.default.getLegendGraphicUrl(layer)]
          }]
        };
      }
    };

    return _this;
  }

  /**
   * Initializes the manager.
   *
   * @return {Promise}
   */


  /**
   * The layer serializers to use. May be overridden or extented to obtain
   * custom functionality.
   *
   * @type {Array}
   */


  /**
   * Loads the print capabilities from the provided remote source.
   *
   * @return {Promise}
   */


  /**
   * Calls the print servlet to create a output file in the requested format
   * and forces a download of the created output.
   *
   * Note: The manager has to been initialized prior this method's usage.
   *
   * @param {Boolean} forceDownload Whether to force a direct download of the
   *                                print result or to return the download url.
   * @return {Promise|undefined} If forceDownload is set to false, the download
   *                             url of the print result will be returned in a
   *                             Promise.
   */


  /**
   * Collects the payload that is required for the print call to the print
   * servlet.
   *
   * @return {Object} The print payload.
   */


  /**
   * Checks if a given layer should be printed.
   *
   * @param {ol.layer.Layer} layer The layer to check.
   * @return {Boolean} Whether the layer should be printed or not.
   */


  /**
   * Checks if the legend of a given legend should be printed.
   *
   * @param {ol.layer.Layer} layer The layer to check.
   * @return {Boolean} Whether the legend of the layer should be printed or not.
   */


  /**
   * Serializes/encodes the given layer.
   *
   * @param {ol.layer.Layer} layer The layer to serialize/encode.
   * @return {Object} The serialized/encoded layer.
   */


  /**
   * Serializes/encodes the legend payload for the given layer.
   *
   * @param {ol.layer.Layer} layer The layer to serialize/encode the legend for.
   * @return {Object} The serialized/encoded legend.
   */


  return MapFishPrintV2Manager;
}(_BaseMapFishPrintManager2.default);

MapFishPrintV2Manager.INFO_JSON_ENDPOINT = 'info.json';
exports.default = MapFishPrintV2Manager;