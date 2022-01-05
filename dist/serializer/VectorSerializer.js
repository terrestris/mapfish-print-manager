'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.VectorSerializer = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _Vector = require('ol/source/Vector');

var _Vector2 = _interopRequireDefault(_Vector);

var _GeoJSON = require('ol/format/GeoJSON');

var _GeoJSON2 = _interopRequireDefault(_GeoJSON);

var _Style = require('ol/style/Style');

var _Style2 = _interopRequireDefault(_Style);

var _RegularShape = require('ol/style/RegularShape');

var _RegularShape2 = _interopRequireDefault(_RegularShape);

var _Polygon = require('ol/geom/Polygon');

var _Feature = require('ol/Feature');

var _Feature2 = _interopRequireDefault(_Feature);

var _Icon = require('ol/style/Icon');

var _Icon2 = _interopRequireDefault(_Icon);

var _Circle = require('ol/style/Circle');

var _Circle2 = _interopRequireDefault(_Circle);

var _Image = require('ol/style/Image');

var _Image2 = _interopRequireDefault(_Image);

var _Text = require('ol/style/Text');

var _Text2 = _interopRequireDefault(_Text);

var _Stroke = require('ol/style/Stroke');

var _Stroke2 = _interopRequireDefault(_Stroke);

var _Fill = require('ol/style/Fill');

var _Fill2 = _interopRequireDefault(_Fill);

var _get2 = require('lodash/get');

var _get3 = _interopRequireDefault(_get2);

var _pickBy = require('lodash/pickBy');

var _pickBy2 = _interopRequireDefault(_pickBy);

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
      if (!(olStyle instanceof _Style2.default)) {
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
            strokeColor: (0, _parseColor2.default)((0, _get3.default)(imageStyle, 'stroke.color')).hex,
            strokeOpacity: (0, _get3.default)((0, _parseColor2.default)((0, _get3.default)(imageStyle, 'stroke.color')), 'rgba[3]'),
            strokeWidth: (0, _get3.default)(imageStyle, 'stroke.width'),
            strokeLinecap: (0, _get3.default)(imageStyle, 'stroke.lineCap'),
            strokeDashstyle: (0, _get3.default)(imageStyle, 'stroke.lineDash'),
            fillColor: (0, _parseColor2.default)((0, _get3.default)(imageStyle, 'fill.color')).hex,
            fillOpacity: (0, _get3.default)((0, _parseColor2.default)((0, _get3.default)(imageStyle, 'fill.color')), 'rgba[3]'),
            pointRadius: imageStyle.radius,
            externalGraphic: imageStyle.src,
            graphicWidth: (0, _get3.default)(imageStyle, 'size[0]'),
            graphicHeight: (0, _get3.default)(imageStyle, 'size[1]'),
            graphicOpacity: imageStyle instanceof _Icon2.default ? imageStyle.opacity : undefined,
            // TODO not available in ol3?
            graphicXOffset: undefined,
            // TODO not available in ol3?
            graphicYOffset: undefined,
            rotation: imageStyle.rotation,
            graphicName: (0, _get3.default)(imageStyle, 'graphicName') || 'circle'
          };
          break;
        case 'LineString':
        case 'MultiLineString':
          style = {
            strokeColor: (0, _parseColor2.default)(strokeStyle.color).hex,
            strokeOpacity: (0, _get3.default)((0, _parseColor2.default)(strokeStyle.color), 'rgba[3]'),
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
            strokeOpacity: (0, _get3.default)((0, _parseColor2.default)(strokeStyle.color), 'rgba[3]'),
            strokeWidth: strokeStyle.width,
            strokeLinecap: strokeStyle.lineCap,
            strokeDashstyle: strokeStyle.lineDash,
            fillColor: (0, _parseColor2.default)(fillStyle.color).hex,
            fillOpacity: (0, _get3.default)((0, _parseColor2.default)(fillStyle.color), 'rgba[3]')
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
          fontColor: (0, _parseColor2.default)((0, _get3.default)(textStyle, 'fill.color')).hex,
          fontOpacity: (0, _get3.default)((0, _parseColor2.default)((0, _get3.default)(textStyle, 'fill.color')), 'rgba[3]')
        });
      }

      return (0, _pickBy2.default)(style, function (v) {
        return v !== undefined;
      });
    };

    _this.writeImageStyle = function (olImageStyle) {
      if (!(olImageStyle instanceof _Image2.default)) {
        return {};
      }

      if (olImageStyle instanceof _Circle2.default) {
        return _this.writeCircleStyle(olImageStyle);
      }

      if (olImageStyle instanceof _Icon2.default) {
        return _this.writeIconStyle(olImageStyle);
      }

      if (olImageStyle instanceof _RegularShape2.default) {
        return _this.writeRegularShapeStyle(olImageStyle);
      }
    };

    _this.writeCircleStyle = function (olCircleStyle) {
      if (!(olCircleStyle instanceof _Circle2.default)) {
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
      if (!(olIconStyle instanceof _Icon2.default)) {
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
      if (!(olRegularShape instanceof _RegularShape2.default)) {
        return {};
      }

      /**
       * Returns the graphicName of a RegularShape or undefined based on the
       * number of points, radius and angle.
       *
       * @returns {String | undefined} The graphicName of a RegularShape feature
       *                                (triangle, square, cross, x and star)
       */
      var getGraphicName = function getGraphicName() {
        if (olRegularShape.getPoints() === 3) {
          return 'triangle';
        } else if (olRegularShape.getPoints() === 4 && olRegularShape.getRadius2() === undefined) {
          return 'square';
        } else if (olRegularShape.getPoints() === 4 && olRegularShape.getRadius2() !== undefined && olRegularShape.getAngle() === 0) {
          return 'cross';
        } else if (olRegularShape.getPoints() === 4 && olRegularShape.getAngle() !== 0) {
          return 'x';
        } else if (olRegularShape.getPoints() === 5) {
          return 'star';
        } else {
          return undefined;
        }
      };

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
        stroke: _this.writeStrokeStyle(olRegularShape.getStroke()),
        graphicName: getGraphicName()
      };
    };

    _this.writeFillStyle = function (olFillStyle) {
      if (!(olFillStyle instanceof _Fill2.default)) {
        return {};
      }

      return {
        color: olFillStyle.getColor()
      };
    };

    _this.writeStrokeStyle = function (olStrokeStyle) {
      if (!(olStrokeStyle instanceof _Stroke2.default)) {
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
      if (!(olTextStyle instanceof _Text2.default)) {
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
      var format = new _GeoJSON2.default();
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
          var polyFeature = new _Feature2.default((0, _Polygon.fromCircle)(geometry));
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

        // assumption below: styles is an array of OlStyleStyle
        if (styles instanceof _Style2.default) {
          styles = [styles];
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
VectorSerializer.sourceCls = [_Vector2.default];
exports.default = VectorSerializer;