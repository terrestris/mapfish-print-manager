'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BaseMapFishPrintManager = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _map = require('ol/map');

var _map2 = _interopRequireDefault(_map);

var _vector = require('ol/layer/vector');

var _vector2 = _interopRequireDefault(_vector);

var _vector3 = require('ol/source/vector');

var _vector4 = _interopRequireDefault(_vector3);

var _feature = require('ol/feature');

var _feature2 = _interopRequireDefault(_feature);

var _polygon = require('ol/geom/polygon');

var _polygon2 = _interopRequireDefault(_polygon);

var _extent = require('ol/extent');

var _extent2 = _interopRequireDefault(_extent);

var _style = require('ol/style/style');

var _style2 = _interopRequireDefault(_style);

var _fill = require('ol/style/fill');

var _fill2 = _interopRequireDefault(_fill);

var _InteractionTransform = require('../interaction/InteractionTransform');

var _InteractionTransform2 = _interopRequireDefault(_InteractionTransform);

var _Shared = require('../util/Shared');

var _Shared2 = _interopRequireDefault(_Shared);

var _Logger = require('../util/Logger');

var _Logger2 = _interopRequireDefault(_Logger);

var _Observable2 = require('../observable/Observable');

var _Observable3 = _interopRequireDefault(_Observable2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * The BaseMapFishPrintManager.
 *
 * @fires {change:layout | change:outputformat | change:dpi | change:scale}
 * @class
 */
var BaseMapFishPrintManager = exports.BaseMapFishPrintManager = function (_Observable) {
  _inherits(BaseMapFishPrintManager, _Observable);

  /**
   * The constructor
   */


  /**
   * Whether this manger has been initiated or not.
   *
   * @type {Boolean}
   * @private
   */


  /**
   * The currently selected dpi.
   *
   * @type {Object}
   * @private
   */


  /**
   * The currently selected layout.
   *
   * @type {Object}
   * @private
   */


  /**
   * The supported DPIs by the print service.
   *
   * @type {Array}
   * @private
   */


  /**
   * The supported layouts by the print service.
   *
   * @type {Array}
   * @private
   */


  /**
   * A filter function that will be called before the print call. Should
   * return a Boolean whether to serialize a layer for print or not.
   *
   * @type {Function}
   */


  /**
   * The color to apply to the mask around the extent feature. Will be applied
   * to the default extentLayer only. If you don't want the mask to be shown on
   * the map, provide a custom extentLayer.
   *
   * @type {String}
   */


  /**
   * Key-value pairs of custom data to be sent to the print service. This is
   * e.g. useful for complex layout definitions on the server side that
   * require additional parameters. Optional.
   *
   * @type {Object}
   */


  /**
   * Additional headers to be send to the print servlet.
   *
   * @type {Object}
   */


  /**
   * The capabilities of the print service. Either filled automatically out of
   * the the given print service or given manually.
   *
   * @type {Object}
   */


  /**
   * The map this PrintManager is bound to. Required.
   *
   * @type {ol.Map}
   */


  /**
   * The name of the vector layer configured and created by the print manager.
   *
   * @type {String}
   */
  function BaseMapFishPrintManager(opts) {
    _classCallCheck(this, BaseMapFishPrintManager);

    var _this = _possibleConstructorReturn(this, (BaseMapFishPrintManager.__proto__ || Object.getPrototypeOf(BaseMapFishPrintManager)).call(this, opts));

    _this.map = null;
    _this.url = null;
    _this.capabilities = null;
    _this.method = 'POST';
    _this.headers = {};
    _this.credentialsMode = 'same-origin';
    _this.customParams = {};
    _this.extentLayer = null;
    _this.maskColor = 'rgba(130, 130, 130, 0.5)';
    _this.transformOpts = {};

    _this.layerFilter = function () {
      return true;
    };

    _this.legendFilter = function () {
      return true;
    };

    _this._layouts = [];
    _this._outputFormats = [];
    _this._dpis = [];
    _this._scales = [];
    _this._layout = {};
    _this._outputFormat = {};
    _this._dpi = {};
    _this._scale = {};
    _this._initiated = false;
    _this._extentFeature = null;

    _this.initManager = function (capabilities) {
      _this.capabilities = capabilities;

      _this._layouts = _this.capabilities.layouts;
      _this._outputFormats = _this.capabilities.outputFormats;
      _this._dpis = _this.capabilities.dpis;
      _this._scales = _this.capabilities.scales;

      _this.setLayout(_this.getLayouts()[0].name);
      _this.setOutputFormat(_this.getOutputFormats()[0].name);
      _this.setDpi(_this.getDpis()[0].name);
      _this.setScale(_this.getClosestScaleToFitMap().name);

      _this.initPrintExtentLayer();
      _this.initPrintExtentFeature();
      _this.initTransformInteraction();

      _this._initiated = true;

      return _this.isInitiated();
    };

    _this.shutdownManager = function () {
      // Remove print layer from map. But only if not given by user.
      var layerCandidates = _Shared2.default.getLayersByName(_this.map, _this.constructor.EXTENT_LAYER_NAME);

      layerCandidates.forEach(function (layer) {
        return _this.map.removeLayer(layer);
      });

      // Remove transform interaction from map.
      var interactionCandidates = _Shared2.default.getInteractionsByName(_this.map, _this.constructor.TRANSFORM_INTERACTION_NAME);

      interactionCandidates.forEach(function (interaction) {
        return _this.map.removeInteraction(interaction);
      });
    };

    _this.validateResponse = function (response) {
      if (response.status >= 200 && response.status < 300) {
        return Promise.resolve(response);
      } else {
        return Promise.reject(new Error('Error while trying to request ' + (response.url + ' (' + response.status + ': ' + response.statusText + ')')));
      }
    };

    _this.initPrintExtentLayer = function () {
      if (!(_this.extentLayer instanceof _vector2.default)) {
        var extentLayer = new _vector2.default({
          name: _this.constructor.EXTENT_LAYER_NAME,
          source: new _vector4.default(),
          style: new _style2.default({
            fill: new _fill2.default({
              color: 'rgba(255, 255, 130, 0)'
            })
          })
        });

        extentLayer.on('precompose', _this.onExtentLayerPreCompose);
        extentLayer.on('postcompose', _this.onExtentLayerPostCompose);

        _this.extentLayer = extentLayer;

        if (_Shared2.default.getLayersByName(_this.map, _this.constructor.EXTENT_LAYER_NAME).length === 0) {
          _this.map.addLayer(_this.extentLayer);
        }
      }
    };

    _this.onExtentLayerPreCompose = function (olEvt) {
      var ctx = olEvt.context;
      ctx.save();
    };

    _this.onExtentLayerPostCompose = function (olEvt) {
      var ctx = olEvt.context;
      var canvas = ctx.canvas;
      var width = canvas.width;
      var height = canvas.height;
      var coords = olEvt.target.getSource().getFeatures()[0].getGeometry().getCoordinates()[0];
      var A = _this.map.getPixelFromCoordinate(coords[1]);
      var B = _this.map.getPixelFromCoordinate(coords[4]);
      var C = _this.map.getPixelFromCoordinate(coords[3]);
      var D = _this.map.getPixelFromCoordinate(coords[2]);

      ctx.fillStyle = _this.maskColor;

      ctx.beginPath();

      ctx.moveTo(0, 0);
      ctx.lineTo(width, 0);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.lineTo(0, 0);
      ctx.closePath();

      ctx.moveTo(A[0], A[1]);
      ctx.lineTo(B[0], B[1]);
      ctx.lineTo(C[0], C[1]);
      ctx.lineTo(D[0], D[1]);
      ctx.lineTo(A[0], A[1]);
      ctx.closePath();

      ctx.fill();

      ctx.restore();
    };

    _this.initPrintExtentFeature = function () {
      var printExtent = _this.calculatePrintExtent();
      var extentFeature = new _feature2.default(_polygon2.default.fromExtent(printExtent));
      var extentLayerSource = _this.extentLayer.getSource();

      _this._extentFeature = extentFeature;

      extentLayerSource.clear();
      extentLayerSource.addFeature(_this._extentFeature);

      return _this._extentFeature;
    };

    _this.initTransformInteraction = function () {
      if (_Shared2.default.getInteractionsByName(_this.map, _this.constructor.TRANSFORM_INTERACTION_NAME).length === 0) {
        var transform = new _InteractionTransform2.default(_extends({
          features: [_this._extentFeature],
          translateFeature: true,
          translate: true,
          stretch: false,
          scale: true,
          rotate: true,
          keepAspectRatio: true
        }, _this.transformOpts));

        transform.set('name', _this.constructor.TRANSFORM_INTERACTION_NAME);

        transform.on('scaling', _this.onTransformScaling);

        _this.map.addInteraction(transform);
      }
    };

    _this.onTransformScaling = function () {
      var scale = _this.getClosestScaleToFitExtentFeature();
      _this.setScale(scale.name);
    };

    _this.getClosestScaleToFitExtentFeature = function () {
      var scales = _this.getScales();
      var printFeatureExtent = _this._extentFeature.getGeometry().getExtent();
      var printFeatureSize = _extent2.default.getSize(printFeatureExtent);
      var closest = Number.POSITIVE_INFINITY;
      var fitScale = scales[0];

      scales.forEach(function (scale) {
        var printScaleExtent = _this.calculatePrintExtent(scale.value);
        var printScaleSize = _extent2.default.getSize(printScaleExtent);
        var diff = Math.abs(printScaleSize[0] - printFeatureSize[0]) + Math.abs(printScaleSize[1] - printFeatureSize[1]);

        if (diff < closest) {
          closest = diff;
          fitScale = scale;
        }
      });

      return fitScale;
    };

    _this.getClosestScaleToFitMap = function () {
      var mapView = _this.map.getView();
      var mapExtent = mapView.calculateExtent();
      var scales = _this.getScales();
      var fitScale = scales[0];

      scales.forEach(function (scale) {
        var printExtent = _this.calculatePrintExtent(scale.value);
        var contains = _extent2.default.containsExtent(mapExtent, printExtent);

        if (contains) {
          fitScale = scale;
        }
      });

      return fitScale;
    };

    _this.calculateRotation = function () {
      var extentFeature = _this._extentFeature;
      var coords = extentFeature.getGeometry().getCoordinates()[0];
      var p1 = coords[0];
      var p2 = coords[3];
      var rotation = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * 180 / Math.PI;

      return rotation;
    };

    _this.resetRotation = function () {
      _this.setRotation(_this.calculateRotation() * -1);
    };

    _this.setRotation = function (rotation) {
      var center = _extent2.default.getCenter(_this._extentFeature.getGeometry().getExtent());
      _this._extentFeature.getGeometry().rotate(rotation, center);
    };

    _this.updatePrintExtent = function () {
      if (_this.isInitiated()) {
        var printExtent = _this.calculatePrintExtent();
        if (_this._extentFeature) {
          _this._extentFeature.setGeometry(_polygon2.default.fromExtent(printExtent));
        }
      }
    };

    _this.calculatePrintExtent = function (scale) {
      var printMapSize = _this.getLayout().map;
      var printScale = scale || _this.getScale().value;
      var mapUnits = _this.map.getView().getProjection().getUnits();
      var inchesPerUnit = {
        'degrees': 4374754,
        'ft': 12,
        'm': 39.37
      };
      var width = printMapSize.width / 72 / inchesPerUnit[mapUnits] * printScale;
      var height = printMapSize.height / 72 / inchesPerUnit[mapUnits] * printScale;

      var center = void 0;
      if (_this._extentFeature) {
        center = _extent2.default.getCenter(_this._extentFeature.getGeometry().getExtent());
      } else {
        center = _this.map.getView().getCenter();
      }

      var printExtent = [center[0] - width / 2, center[1] - height / 2, center[0] + width / 2, center[1] + height / 2];

      return printExtent;
    };

    _this.download = function (url) {
      if (/Opera|OPR\//.test(navigator.userAgent)) {
        window.open(url);
      } else {
        window.location.href = url;
      }
    };

    _this.getLayout = function () {
      return _this._layout;
    };

    _this.setLayout = function (name) {
      var layout = _this.getLayouts().find(function (layout) {
        return layout.name === name;
      });

      if (!layout) {
        _Logger2.default.warn('No layout named \'' + name + '\' found.');
        return;
      }

      _this._layout = layout;

      _this.updatePrintExtent();

      _this.dispatch('change:layout', layout);
    };

    _this.getOutputFormat = function () {
      return _this._outputFormat;
    };

    _this.setOutputFormat = function (name) {
      var format = _this.getOutputFormats().find(function (format) {
        return format.name === name;
      });

      if (!format) {
        _Logger2.default.warn('No output format named \'' + name + '\' found.');
        return;
      }

      _this._outputFormat = format;

      _this.dispatch('change:outputformat', format);
    };

    _this.getDpi = function () {
      return _this._dpi;
    };

    _this.setDpi = function (name) {
      var dpi = _this.getDpis().find(function (dpi) {
        return dpi.name === name;
      });

      if (!dpi) {
        _Logger2.default.warn('No dpi named \'' + name + '\' found.');
        return;
      }

      _this._dpi = dpi;

      _this.dispatch('change:dpi', dpi);
    };

    _this.getScale = function () {
      return _this._scale;
    };

    _this.setScale = function (name) {
      var scale = _this.getScales().find(function (scale) {
        return scale.name === name;
      });

      if (!scale) {
        _Logger2.default.warn('No scale named \'' + name + '\' found.');
        return;
      }

      _this._scale = scale;

      _this.updatePrintExtent();

      _this.dispatch('change:scale', scale);
    };

    _this.getLayouts = function () {
      return _this._layouts;
    };

    _this.getOutputFormats = function () {
      return _this._outputFormats;
    };

    _this.getDpis = function () {
      return _this._dpis;
    };

    _this.getScales = function () {
      return _this._scales;
    };

    _this.isInitiated = function () {
      return _this._initiated;
    };

    Object.assign.apply(Object, [_this].concat(_toConsumableArray(opts)));

    if (!(_this.map instanceof _map2.default)) {
      _Logger2.default.warn('Invalid value given to config option `map`. You need to ' + 'provide an ol.Map to use the PrintManager.');
    }

    if (!_this.url && !_this.capabilities) {
      _Logger2.default.warn('Invalid init options given. Please provide either an `url` ' + 'or `capabilities`.');
    }

    if (_this.url && _this.url.split('/').pop()) {
      _this.url += '/';
    }
    return _this;
  }

  /**
   * Initializes the manager instance. Typically called by subclasses via init().
   *
   * TODO Check return type Boolean?
   *
   * @param {Object} capabilities The capabilities to set.
   * @return {Boolean}
   */


  /**
   * Feature representing the page extent.
   *
   * @type {ol.Feature}
   * @private
   */


  /**
   * The currently selected scale.
   *
   * @type {Object}
   * @private
   */


  /**
   * The currently selected output format.
   *
   * @type {Object}
   * @private
   */


  /**
   * The supported scales by the print service.
   *
   * @type {Array}
   * @private
   */


  /**
   * The supported output formats by the print service.
   *
   * @type {Array}
   * @private
   */


  /**
   * A filter function that will be called before the print call. Should
   * return a Boolean whether to serialize a legend of a layer for print or not.
   *
   * @type {Function}
   */


  /**
   * Custom options to apply to the transform interaction. See
   * http://viglino.github.io/ol-ext/doc/doc-pages/ol.interaction.Transform.html
   * for valid options.
   *
   * @type {Object}
   */


  /**
   * The layer to show the actual print extent on. If not provided, a default
   * one will be created.
   *
   * @type {ol.Layer.Vector}
   */


  /**
   * The authentication credentials mode. Default is to 'same-origin'.
   *
   * @type {String}
   */


  /**
   * Method to use when sending print requests to the servlet. Either `POST` or
   * `GET` (case-sensitive). Default is to `POST`.
   *
   * @type {String}
   */


  /**
   * Base url of the print service.
   *
   * @type {String}
   */


  /**
   * The name of the transform interaction configured and created by the
   * print manager.
   *
   * @type {String}
   */


  /**
   * Shuts down the manager.
   */


  /**
   * Validates the given HTTP fetch response.
   *
   * @param {Response} response The response to validate.
   * @return {Promise} The resolved or rejected promise.
   */


  /**
   * Initializes the print extent layer.
   */


  /**
   * Called on the extentLayer's `precompose` event.
   *
   * @param {ol.render.Event} olEvt The ol render event.
   */


  /**
   * Called on the extentLayer's `postcompose` event.
   *
   * @param {ol.render.Event} olEvt The ol render event.
   */


  /**
   * Initializes the print extent feature.
   *
   * @return {ol.Feature} The extent feature.
   */


  /**
   * Initializes the transform interaction.
   */


  /**
   * Called on translate interaction's `scaling` event.
   */


  /**
   * Returns the closest scale to current print feature's extent.
   */


  /**
   * Returns the closest scale to fit the print feature's extent into the
   * current extent of the map.
   */


  /**
   * Calculates the current rotation of the print extent feature.
   */


  /**
   * Resets the rotation of the print extent feature.
   */


  /**
   * Rotates the print extent by the amount of the given rotation.
   *
   * @param {Number} rotation The amount to rotate.
   */


  /**
   * Updates the geometry of the print extent feature to match the current scale.
   */


  /**
   * Calculates the extent based on a scale.
   *
   * @param {Number} scale The scale to calculate the extent for. If not given,
   *                       the current scale of the provider will be used.
   * @return {ol.Extent} The extent.
   */


  /**
   * Opens the given URL in a new browser tab to download the given response
   * (if header are set correctly).
   *
   * @param {String} url The url to open.
   */


  /**
   * Returns the currently selected layout.
   *
   * @return {Object} The currently selected layout.
   */


  /**
   * Sets the layout to use. Updates the print extent accordingly.
   *
   * @param {String} name The name of the layout to use.
   */


  /**
   * Returns the currently selected output format.
   *
   * @return {Object} The currently selected output format.
   */


  /**
   * Sets the output format to use.
   *
   * @param {String} name The name of the output format to use.
   */


  /**
   * Returns the currently selected dpi.
   *
   * @return {Object} The currently selected dpi.
   */


  /**
   * Sets the dpi to use.
   *
   * @param {String} name The name of the dpi to use.
   */


  /**
   * Returns the currently selected scale.
   *
   * @return {Object} The currently selected scale.
   */


  /**
   * Sets the scale to use. Updates the print extent accordingly.
   *
   * @param {String} name The name of the scale to use.
   */


  /**
   * Returns all supported layouts.
   *
   * @return {Array} The supported layouts.
   */


  /**
   * Returns all supported output formats.
   *
   * @return {Array} The supported output formats.
   */


  /**
   * Returns all supported dpis.
   *
   * @return {Array} The supported dpis.
   */


  /**
   * Returns all supported scales.
   *
   * @return {Array} The supported scales.
   */


  /**
   * Whether this manager has been initiated or not.
   *
   * @return {Boolean} Whether this manager has been initiated or not.
   */


  return BaseMapFishPrintManager;
}(_Observable3.default);

BaseMapFishPrintManager.EXTENT_LAYER_NAME = 'PrintManager Vector Layer';
BaseMapFishPrintManager.TRANSFORM_INTERACTION_NAME = 'PrintManager Transform Interaction';
exports.default = BaseMapFishPrintManager;