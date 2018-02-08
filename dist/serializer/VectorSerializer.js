'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.VectorSerializer = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _vector = require('ol/source/vector');

var _vector2 = _interopRequireDefault(_vector);

var _geojson = require('ol/format/geojson');

var _geojson2 = _interopRequireDefault(_geojson);

var _style = require('ol/style/style');

var _style2 = _interopRequireDefault(_style);

var _regularshape = require('ol/style/regularshape');

var _regularshape2 = _interopRequireDefault(_regularshape);

var _polygon = require('ol/geom/polygon');

var _polygon2 = _interopRequireDefault(_polygon);

var _feature = require('ol/feature');

var _feature2 = _interopRequireDefault(_feature);

var _icon = require('ol/style/icon');

var _icon2 = _interopRequireDefault(_icon);

var _circle = require('ol/style/circle');

var _circle2 = _interopRequireDefault(_circle);

var _image = require('ol/style/image');

var _image2 = _interopRequireDefault(_image);

var _text = require('ol/style/text');

var _text2 = _interopRequireDefault(_text);

var _stroke = require('ol/style/stroke');

var _stroke2 = _interopRequireDefault(_stroke);

var _fill = require('ol/style/fill');

var _fill2 = _interopRequireDefault(_fill);

var _lodash = require('lodash');

var _parseColor = require('parse-color');

var _parseColor2 = _interopRequireDefault(_parseColor);

var _parseCssFont = require('parse-css-font');

var _parseCssFont2 = _interopRequireDefault(_parseCssFont);

var _BaseSerializer2 = require('./BaseSerializer');

var _BaseSerializer3 = _interopRequireDefault(_BaseSerializer2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * The VectorSerializer.
 *
 * @class
 */
var VectorSerializer = exports.VectorSerializer = function (_BaseSerializer) {
  _inherits(VectorSerializer, _BaseSerializer);

  /**
   * The constructor
   */


  /**
   * The property to get the style dictionary key from.
   *
   * @type {String}
   */


  /**
   * The vector layer type identificator.
   *
   * @type {String}
   */
  function VectorSerializer() {
    _classCallCheck(this, VectorSerializer);

    var _this = _possibleConstructorReturn(this, (VectorSerializer.__proto__ || Object.getPrototypeOf(VectorSerializer)).call(this, arguments));

    _this.writeStyle = function (olStyle, geomType) {
      if (!(olStyle instanceof _style2.default)) {
        return undefined;
      }

      var fillStyle = _this.writeFillStyle(olStyle.getFill());
      var imageStyle = _this.writeImageStyle(olStyle.getImage());
      var strokeStyle = _this.writeStrokeStyle(olStyle.getStroke());
      var textStyle = _this.writeTextStyle(olStyle.getText());

      var style = {};
      switch (geomType) {
        case 'Point':
        case 'MultiPoint':
          style = {
            strokeColor: (0, _parseColor2.default)((0, _lodash.get)(imageStyle, 'stroke.color')).hex,
            strokeOpacity: (0, _lodash.get)((0, _parseColor2.default)((0, _lodash.get)(imageStyle, 'stroke.color')), 'rgba[3]'),
            strokeWidth: (0, _lodash.get)(imageStyle, 'stroke.width'),
            strokeLinecap: (0, _lodash.get)(imageStyle, 'stroke.lineCap'),
            strokeDashstyle: (0, _lodash.get)(imageStyle, 'stroke.lineDash'),
            fillColor: (0, _parseColor2.default)((0, _lodash.get)(imageStyle, 'fill.color')).hex,
            fillOpacity: (0, _lodash.get)((0, _parseColor2.default)((0, _lodash.get)(imageStyle, 'fill.color')), 'rgba[3]'),
            pointRadius: imageStyle.radius,
            externalGraphic: imageStyle.src,
            graphicWidth: (0, _lodash.get)(imageStyle, 'size[0]'),
            graphicHeight: (0, _lodash.get)(imageStyle, 'size[1]'),
            graphicOpacity: imageStyle instanceof _icon2.default ? imageStyle.opacity : undefined,
            // TODO not available in ol3?
            graphicXOffset: undefined,
            // TODO not available in ol3?
            graphicYOffset: undefined,
            rotation: imageStyle.rotation,
            // TODO Support full list of graphics: 'circle', 'square', 'star', 'x',
            // 'cross' and 'triangle'
            graphicName: 'circle'
          };
          break;
        case 'LineString':
        case 'MultiLineString':
          style = {
            strokeColor: (0, _parseColor2.default)(strokeStyle.color).hex,
            strokeOpacity: (0, _lodash.get)((0, _parseColor2.default)(strokeStyle.color), 'rgba[3]'),
            strokeWidth: strokeStyle.width,
            strokeLinecap: strokeStyle.lineCap,
            strokeDashstyle: strokeStyle.lineDash
          };
          break;
        case 'Polygon':
        case 'MultiPolygon':
        case 'Circle':
          style = {
            strokeColor: (0, _parseColor2.default)(strokeStyle.color).hex,
            strokeOpacity: (0, _lodash.get)((0, _parseColor2.default)(strokeStyle.color), 'rgba[3]'),
            strokeWidth: strokeStyle.width,
            strokeLinecap: strokeStyle.lineCap,
            strokeDashstyle: strokeStyle.lineDash,
            fillColor: (0, _parseColor2.default)(fillStyle.color).hex,
            fillOpacity: (0, _lodash.get)((0, _parseColor2.default)(fillStyle.color), 'rgba[3]')
          };
          break;
        default:
          // TODO some fallback style?!
          style = {};
      }

      if (textStyle && textStyle.text) {
        var parsedFont = (0, _parseCssFont2.default)(textStyle.font);
        style = _extends({}, style, {
          label: textStyle.text,
          fontFamily: parsedFont.family.join(','),
          fontSize: parsedFont.size,
          fontWeight: parsedFont.weight,
          fontStyle: parsedFont.style,
          fontColor: (0, _parseColor2.default)((0, _lodash.get)(textStyle, 'fill.color')).hex,
          fontOpacity: (0, _lodash.get)((0, _parseColor2.default)((0, _lodash.get)(textStyle, 'fill.color')), 'rgba[3]')
        });
      }

      return (0, _lodash.pickBy)(style, function (v) {
        return v !== undefined;
      });
    };

    _this.writeImageStyle = function (olImageStyle) {
      if (!(olImageStyle instanceof _image2.default)) {
        return {};
      }

      if (olImageStyle instanceof _circle2.default) {
        return _this.writeCircleStyle(olImageStyle);
      }

      if (olImageStyle instanceof _icon2.default) {
        return _this.writeIconStyle(olImageStyle);
      }

      if (olImageStyle instanceof _regularshape2.default) {
        return _this.writeRegularShapeStyle(olImageStyle);
      }
    };

    _this.writeCircleStyle = function (olCircleStyle) {
      if (!(olCircleStyle instanceof _circle2.default)) {
        return {};
      }

      return {
        fill: _this.writeFillStyle(olCircleStyle.getFill()),
        image: _this.writeImageStyle(olCircleStyle.getImage()),
        opacity: olCircleStyle.getOpacity(),
        radius: olCircleStyle.getRadius(),
        rotateWithView: olCircleStyle.getRotateWithView(),
        rotation: olCircleStyle.getRotation(),
        scale: olCircleStyle.getScale(),
        snapToPixel: olCircleStyle.getSnapToPixel(),
        stroke: _this.writeStrokeStyle(olCircleStyle.getStroke())
      };
    };

    _this.writeIconStyle = function (olIconStyle) {
      if (!(olIconStyle instanceof _icon2.default)) {
        return {};
      }

      return {
        anchor: olIconStyle.getAnchor(),
        // getAnchor() returns the anchor in pixel values always, hence
        // we need to set the anchorUnits respectively
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        anchorOrigin: olIconStyle.getOrigin(),
        opacity: olIconStyle.getOpacity(),
        rotateWithView: olIconStyle.getRotateWithView(),
        rotation: olIconStyle.getRotation(),
        scale: olIconStyle.getScale(),
        size: olIconStyle.getSize(),
        snapToPixel: olIconStyle.getSnapToPixel(),
        src: olIconStyle.getSrc()
      };
    };

    _this.writeRegularShapeStyle = function (olRegularShape) {
      if (!(olRegularShape instanceof _regularshape2.default)) {
        return {};
      }

      return {
        angle: olRegularShape.getAngle(),
        fill: _this.writeFillStyle(olRegularShape.getFill()),
        opacity: olRegularShape.getOpacity(),
        points: olRegularShape.getPoints(),
        radius: olRegularShape.getRadius(),
        radius2: olRegularShape.getRadius2(),
        rotateWithView: olRegularShape.getRotateWithView(),
        rotation: olRegularShape.getRotation(),
        scale: olRegularShape.getScale(),
        snapToPixel: olRegularShape.getSnapToPixel(),
        stroke: _this.writeStrokeStyle(olRegularShape.getStroke())
      };
    };

    _this.writeFillStyle = function (olFillStyle) {
      if (!(olFillStyle instanceof _fill2.default)) {
        return {};
      }

      return {
        color: olFillStyle.getColor()
      };
    };

    _this.writeStrokeStyle = function (olStrokeStyle) {
      if (!(olStrokeStyle instanceof _stroke2.default)) {
        return {};
      }

      return {
        color: olStrokeStyle.getColor(),
        lineCap: olStrokeStyle.getLineCap(),
        lineJoin: olStrokeStyle.getLineJoin(),
        // If not set, getLineDash will return null.
        lineDash: olStrokeStyle.getLineDash() || undefined,
        lineDashOffeset: olStrokeStyle.getLineDashOffset(),
        miterLimit: olStrokeStyle.getMiterLimit(),
        width: olStrokeStyle.getWidth()
      };
    };

    _this.writeTextStyle = function (olTextStyle) {
      if (!(olTextStyle instanceof _text2.default)) {
        return {};
      }

      return {
        fill: _this.writeFillStyle(olTextStyle.getFill()),
        font: olTextStyle.getFont(),
        offsetX: olTextStyle.getOffsetX(),
        offsetY: olTextStyle.getOffsetY(),
        rotation: olTextStyle.getRotation(),
        scale: olTextStyle.getScale(),
        stroke: _this.writeStrokeStyle(olTextStyle.getStroke()),
        text: olTextStyle.getText(),
        textAlign: olTextStyle.getTextAlign(),
        textBaseline: olTextStyle.getTextBaseline()
      };
    };

    return _this;
  }

  /**
   * Serializes/Encodes the given layer.
   *
   * @param {ol.layer.Layer} layer The layer to serialize/encode.
   * @param {Number} viewResolution The resolution to calculate the styles for.
   * @return {Object} The serialized/encoded layer.
   */


  /**
   * The ol sources this serializer is capable of serializing.
   *
   * @type {Array}
   */


  /**
   * The circle geometry type name.
   *
   * @type {String}
   */


  _createClass(VectorSerializer, [{
    key: 'serialize',
    value: function serialize(layer, viewResolution) {
      var _this2 = this;

      var source = layer.getSource();

      if (!this.validateSource(source)) {
        return;
      }

      var features = source.getFeatures();
      var format = new _geojson2.default();
      var serializedFeatures = [];
      var serializedStyles = {};
      var serializedStylesDict = {};
      var styleName = void 0;
      var styleId = 0;

      features.forEach(function (feature) {
        var geometry = feature.getGeometry();
        var geometryType = geometry.getType();
        var serializedFeature = void 0;

        // as GeoJSON format doesn't support circle geometries, we need to
        // transform circles to polygons.
        if (geometryType === _this2.constructor.CIRCLE_GEOMETRY_TYPE) {
          var style = feature.getStyle();
          var polyFeature = new _feature2.default(_polygon2.default.fromCircle(geometry));
          polyFeature.setStyle(style);
          feature = polyFeature;
        }
        serializedFeature = format.writeFeatureObject(feature);

        var styles = void 0;
        var styleFunction = feature.getStyleFunction();

        if (styleFunction) {
          styles = styleFunction.call(feature, viewResolution);
        } else {
          styleFunction = layer.getStyleFunction();
          if (styleFunction) {
            styles = styleFunction.call(layer, feature, viewResolution);
          }
        }

        if (styles) {
          serializedFeatures.push(serializedFeature);

          styles.forEach(function (style) {
            var styleObject = _this2.writeStyle(style, geometryType);
            var serializedStyle = JSON.stringify(styleObject);
            var dictStyle = serializedStylesDict[serializedStyle];

            if (dictStyle >= 0) {
              styleName = dictStyle;
            } else {
              serializedStylesDict[serializedStyle] = styleName = styleId++;
              serializedStyles[styleName] = styleObject;
            }
            if (!serializedFeature.properties) {
              serializedFeature.properties = {};
            }
            serializedFeature.properties[_this2.constructor.FEAT_STYLE_PROPERTY] = styleName;
          });
        }
      });

      var serialized = _extends({}, _get(VectorSerializer.prototype.__proto__ || Object.getPrototypeOf(VectorSerializer.prototype), 'serialize', this).call(this, layer, source), {
        name: layer.get('name') || 'Vector Layer',
        opacity: layer.getOpacity(),
        geoJson: {
          type: 'FeatureCollection',
          features: serializedFeatures
        },
        styles: serializedStyles,
        styleProperty: this.constructor.FEAT_STYLE_PROPERTY,
        type: this.constructor.TYPE_VECTOR
      });

      return serialized;
    }

    /**
     * Returns a plain object matching the passed `ol.style.Style` instance.
     *
     * @param {ol.style.Style} olStyle An ol.style.Style instance.
     * @return {Object} A plain object matching the passed `ol.style.Style`
     *                  instance.
     */


    /**
     * Returns a plain object matching the passed ol.style.Image instance.
     *
     * Works with `ol.style.Circle`, `ol.style.Icon` and
     * `ol.style.RegularShape`
     *
     * @param {ol.style.Image} olImageStyle An ol.style.Image instance.
     * @return {Object} A plain object matching the passed `ol.style.Image`
     *                  instance.
     */


    /**
     * Returns a plain object matching the passed ol.style.Circle instance.
     *
     * @param {ol.style.Circle} olCircleStyle An ol.style.Circle instance.
     * @return {Object} A plain object matching the passed `ol.style.Circle`
     *                  instance.
     */


    /**
     * Returns a plain object matching the passed ol.style.Icon instance.
     *
     * @param {ol.style.Icon} olIconStyle An ol.style.Icon instance.
     * @return {Object} A plain object matching the passed `ol.style.Icon`
     *                  instance.
     */


    /**
     * Returns a plain object matching the passed ol.style.RegularShape
     * instance.
     *
     * @param {ol.style.RegularShape} olRegularShape An ol.style.RegularShape
     *                                               instance.
     * @return {Object} A plain object matching the passed `ol.style.RegularShape`
     *                  instance.
     */


    /**
     * Returns a plain object matching the passed ol.style.Fill instance.
     *
     * @param {ol.style.Fill} olFillStyle An ol.style.Fill instance.
     * @return {Object} A plain object matching the passed `ol.style.Fill`
     *                  instance.
     */


    /**
     * Returns a plain object matching the passed ol.style.Stroke instance.
     *
     * @param {ol.style.Stroke} olStrokeStyle An ol.style.Stroke instance.
     * @return {Object} A plain object matching the passed `ol.style.Stroke`
     *                  instance.
     */


    /**
     * Returns a plain object matching the passed ol.style.Text instance.
     *
     * @param {ol.style.Text} olTextStyle An ol.style.Text instance.
     * @return {Object} A plain object matching the passed `ol.style.Text`
     *                  instance.
     */

  }]);

  return VectorSerializer;
}(_BaseSerializer3.default);

VectorSerializer.TYPE_VECTOR = 'Vector';
VectorSerializer.CIRCLE_GEOMETRY_TYPE = 'Circle';
VectorSerializer.FEAT_STYLE_PROPERTY = '_style';
VectorSerializer.sourceCls = [_vector2.default];
exports.default = VectorSerializer;