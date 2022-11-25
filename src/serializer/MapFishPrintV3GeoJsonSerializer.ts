import OlSource from 'ol/source/Source';
import OlSourceVector from 'ol/source/Vector';
import OlLayer from 'ol/layer/Layer';
// eslint-disable-next-line no-unused-vars
import OlLayerVector from 'ol/layer/Vector';
import OlFormatGeoJSON from 'ol/format/GeoJSON';
import OlStyleStyle from 'ol/style/Style';
import OlStyleRegularShape from 'ol/style/RegularShape';
import { fromCircle } from 'ol/geom/Polygon';
import OlGeometryCircle from 'ol/geom/Circle';
import OlFeature from 'ol/Feature';
import OlStyleIcon from 'ol/style/Icon';
import OlStyleCircle from 'ol/style/Circle';
import OlStyleImage from 'ol/style/Image';
import OlStyleText from 'ol/style/Text';
import OlStyleStroke from 'ol/style/Stroke';
import OlStyleFill from 'ol/style/Fill';
import get from 'lodash/get';
import pickBy from 'lodash/pickBy';
import parseColor from 'parse-color';
// eslint-disable-next-line no-unused-vars
import parseFont, { IFont } from 'parse-css-font';

import defaultsDeep from 'lodash/defaultsDeep';

import BaseSerializer from './BaseSerializer';

/**
 * The MapFishPrintV3GeoJsonSerializer.
 *
 * @class
 */
export class MapFishPrintV3GeoJsonSerializer extends BaseSerializer {

  /**
   * The vector GeoJSON type identificator.
   *
   * @type {string}
   */
  static TYPE_GEOJSON = 'geojson';

  /**
   * The property to get the style dictionary key from.
   *
   * @type {string}
   */
  static FEAT_STYLE_PROPERTY = '_style';

  /**
   * The constructor
   */
  constructor() {
    super();
  }

  /**
   * @param {OlSource} source
   * @return {boolean}
   */
  canSerialize(source) {
    return source instanceof OlSourceVector;
  }

  /**
   * Serializes/Encodes the given layer.
   *
   * @abstract
   * @param {OlLayer} oLayer The layer to serialize/encode.
   * @param {Object} opts Additional properties to pass to the serialized
   *   layer object that can't be obtained by the layer itself. It can also be
   *   used to override all generated layer values, e.g. the image format. Only
   *   used in V3.
   * @param {number} viewResolution The resolution to calculate the styles for.
   * @return {Object} The serialized/encoded layer.
   */
  serialize(oLayer, opts, viewResolution) {
    defaultsDeep(opts, {
      failOnError: false,
      renderAsSvg: false
    });

    const layer = /** @type {OlLayerVector} */ (oLayer);
    const source = /** @type {OlSourceVector} */ (layer.getSource());

    if (!this.validateSource(source)) {
      return;
    }

    const features = source.getFeatures();
    const format = new OlFormatGeoJSON();
    const serializedFeatures = [];
    const serializedStyles = {};
    const serializedStylesDict = {};
    let styleName;
    let styleId = 0;

    features.forEach(feature => {
      const geometry = feature.getGeometry();
      const geometryType = geometry.getType();
      let serializedFeature;

      // as GeoJSON format doesn't support circle geometries, we need to
      // transform circles to polygons.
      if (geometry instanceof OlGeometryCircle) {
        const style = feature.getStyle();
        const polyFeature = new OlFeature(fromCircle(geometry));
        polyFeature.setStyle(style);
        feature = polyFeature;
      }
      serializedFeature = format.writeFeatureObject(feature);

      let styles;
      let styleFunction = feature.getStyleFunction();

      if (styleFunction) {
        styles = styleFunction.call(feature, viewResolution);
      } else {
        styleFunction = layer.getStyleFunction();
        if (styleFunction) {
          styles = styleFunction.call(layer, feature, viewResolution);
        }
      }

      // assumption below: styles is an array of OlStyleStyle
      if (styles instanceof OlStyleStyle) {
        styles = [styles];
      }

      if (styles) {
        serializedFeatures.push(serializedFeature);

        styles.forEach(style => {
          const styleObject = this.writeStyle(style, geometryType);
          const serializedStyle = JSON.stringify(styleObject);
          const dictStyle = serializedStylesDict[serializedStyle];

          if (dictStyle >= 0) {
            styleName = dictStyle;
          } else {
            serializedStylesDict[serializedStyle] = styleName = styleId++;
            serializedStyles[styleName] = styleObject;
          }
          if (!serializedFeature.properties) {
            serializedFeature.properties = {};
          }
          serializedFeature.properties[MapFishPrintV3GeoJsonSerializer.FEAT_STYLE_PROPERTY] = styleName;
        });
      }
    });

    const serialized = {
      ...{
        geoJson: {
          type: 'FeatureCollection',
          features: serializedFeatures
        },
        name: layer.get('name') || 'Vector Layer',
        opacity: layer.getOpacity(),
        style: serializedStyles,
        type: MapFishPrintV3GeoJsonSerializer.TYPE_GEOJSON
      },
      ...opts
    };

    return serialized;
  }

  /**
   * Returns a plain object matching the passed `ol.style.Style` instance.
   *
   * @param {OlStyleStyle} olStyle An ol.style.Style instance.
   * @return {Object} A plain object matching the passed `ol.style.Style`
   *                  instance.
   */
  writeStyle = (olStyle, geomType) => {
    if (!(olStyle instanceof OlStyleStyle)) {
      return undefined;
    }

    const fillStyle = this.writeFillStyle(olStyle.getFill());
    const imageStyle: any = this.writeImageStyle(olStyle.getImage());
    const strokeStyle = this.writeStrokeStyle(olStyle.getStroke());
    const textStyle = this.writeTextStyle(olStyle.getText());

    let style = {};
    switch (geomType) {
      case 'Point':
      case 'MultiPoint':
        style = {
          version: 2,
          strokeColor: parseColor(get(imageStyle, 'stroke.color')).hex,
          strokeOpacity: get(parseColor(get(imageStyle, 'stroke.color')), 'rgba[3]'),
          strokeWidth: get(imageStyle, 'stroke.width'),
          strokeLinecap: get(imageStyle, 'stroke.lineCap'),
          strokeDashstyle: get(imageStyle, 'stroke.lineDash'),
          fillColor: parseColor(get(imageStyle, 'fill.color')).hex,
          fillOpacity: get(parseColor(get(imageStyle, 'fill.color')), 'rgba[3]'),
          pointRadius: imageStyle.radius,
          externalGraphic: imageStyle.src,
          graphicWidth: get(imageStyle, 'size[0]'),
          graphicHeight: get(imageStyle, 'size[1]'),
          graphicOpacity: imageStyle instanceof OlStyleIcon ? imageStyle.getOpacity() : undefined,
          // TODO not available in ol3?
          graphicXOffset: undefined,
          // TODO not available in ol3?
          graphicYOffset: undefined,
          rotation: get(imageStyle, 'rotation'),
          // TODO Support full list of graphics: 'circle', 'square', 'star', 'x',
          // 'cross' and 'triangle'
          graphicName: 'circle'
        };
        break;
      case 'LineString':
      case 'MultiLineString':
        style = {
          strokeColor: parseColor(strokeStyle.color).hex,
          strokeOpacity: get(parseColor(strokeStyle.color), 'rgba[3]'),
          strokeWidth: strokeStyle.width,
          strokeLinecap: strokeStyle.lineCap,
          strokeDashstyle: strokeStyle.lineDash
        };
        break;
      case 'Polygon':
      case 'MultiPolygon':
      case 'Circle':
        style = {
          strokeColor: parseColor(strokeStyle.color).hex,
          strokeOpacity: get(parseColor(strokeStyle.color), 'rgba[3]'),
          strokeWidth: strokeStyle.width,
          strokeLinecap: strokeStyle.lineCap,
          strokeDashstyle: strokeStyle.lineDash,
          fillColor: parseColor(fillStyle.color).hex,
          fillOpacity: get(parseColor(fillStyle.color), 'rgba[3]')
        };
        break;
      default:
        // TODO some fallback style?!
        style = {

        };
    }

    if (textStyle && textStyle.text) {
      const parsedFont: any = /** @type {IFont} */ (parseFont(textStyle.font));
      style = {
        ...style,
        ...{
          label: textStyle.text,
          fontFamily: parsedFont.family.join(','),
          fontSize: parsedFont.size,
          fontWeight: parsedFont.weight,
          fontStyle: parsedFont.style,
          fontColor: parseColor(get(textStyle, 'fill.color')).hex,
          fontOpacity: get(parseColor(get(textStyle, 'fill.color')), 'rgba[3]'),
          strokeOpacity: 0,
          fillOpacity: 0,
          graphicOpacity: 0
        }
      };
    }

    return pickBy(style, v => v !== undefined);
  }

  /**
   * Returns a plain object matching the passed ol.style.Image instance.
   *
   * Works with `ol.style.Circle`, `ol.style.Icon` and
   * `ol.style.RegularShape`
   *
   * @param {OlStyleImage} olImageStyle An ol.style.Image instance.
   * @return {Object} A plain object matching the passed `ol.style.Image`
   *                  instance.
   */
  writeImageStyle = olImageStyle => {
    if (!(olImageStyle instanceof OlStyleImage)) {
      return {};
    }

    if (olImageStyle instanceof OlStyleCircle) {
      return this.writeCircleStyle(olImageStyle);
    }

    if (olImageStyle instanceof OlStyleIcon) {
      return this.writeIconStyle(olImageStyle);
    }

    if (olImageStyle instanceof OlStyleRegularShape) {
      return this.writeRegularShapeStyle(olImageStyle);
    }
  }

  /**
   * Returns a plain object matching the passed ol.style.Circle instance.
   *
   * @param {OlStyleCircle} olCircleStyle An ol.style.Circle instance.
   * @return {Object} A plain object matching the passed `ol.style.Circle`
   *                  instance.
   */
  writeCircleStyle = olCircleStyle => {
    if (!(olCircleStyle instanceof OlStyleCircle)) {
      return {};
    }

    return {
      fill: this.writeFillStyle(olCircleStyle.getFill()),
      image: olCircleStyle.getImage(1),
      opacity: olCircleStyle.getOpacity(),
      radius: olCircleStyle.getRadius(),
      rotateWithView: olCircleStyle.getRotateWithView(),
      rotation: olCircleStyle.getRotation(),
      scale: olCircleStyle.getScale(),
      stroke: this.writeStrokeStyle(olCircleStyle.getStroke())
    };
  }

  /**
   * Returns a plain object matching the passed ol.style.Icon instance.
   *
   * @param {OlStyleIcon} olIconStyle An ol.style.Icon instance.
   * @return {Object} A plain object matching the passed `ol.style.Icon`
   *                  instance.
   */
  writeIconStyle = olIconStyle => {
    if (!(olIconStyle instanceof OlStyleIcon)) {
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
      src: olIconStyle.getSrc()
    };
  }

  /**
   * Returns a plain object matching the passed ol.style.RegularShape
   * instance.
   *
   * @param {OlStyleRegularShape} olRegularShape An ol.style.RegularShape
   *                                               instance.
   * @return {Object} A plain object matching the passed `ol.style.RegularShape`
   *                  instance.
   */
  writeRegularShapeStyle = olRegularShape => {
    if (!(olRegularShape instanceof OlStyleRegularShape)) {
      return {};
    }

    return {
      angle: olRegularShape.getAngle(),
      fill: this.writeFillStyle(olRegularShape.getFill()),
      opacity: olRegularShape.getOpacity(),
      points: olRegularShape.getPoints(),
      radius: olRegularShape.getRadius(),
      radius2: olRegularShape.getRadius2(),
      rotateWithView: olRegularShape.getRotateWithView(),
      rotation: olRegularShape.getRotation(),
      scale: olRegularShape.getScale(),
      stroke: this.writeStrokeStyle(olRegularShape.getStroke())
    };
  }

  /**
   * Returns a plain object matching the passed ol.style.Fill instance.
   *
   * @param {OlStyleFill} olFillStyle An ol.style.Fill instance.
   * @return {Object} A plain object matching the passed `ol.style.Fill`
   *                  instance.
   */
  writeFillStyle = olFillStyle => {
    if (olFillStyle && !(olFillStyle instanceof OlStyleFill)) {
      return {};
    }

    return {
      // If no fill is given, set it fully transparent. In some elements with stroke and no fill, the object cannot
      // be rendered for some reason
      color: olFillStyle ? olFillStyle.getColor() : 'rgba(0,0,0,0)'
    };
  }

  /**
   * Returns a plain object matching the passed ol.style.Stroke instance.
   *
   * @param {OlStyleStroke} olStrokeStyle An ol.style.Stroke instance.
   * @return {Object} A plain object matching the passed `ol.style.Stroke`
   *                  instance.
   */
  writeStrokeStyle = olStrokeStyle => {
    if (!(olStrokeStyle instanceof OlStyleStroke)) {
      return {};
    }

    // If not set, getLineDash will return null.
    // according to http://mapfish.github.io/mapfish-print-doc/styles.html#mapfishJsonParser
    // strokeDashstyle - (line, point, polygon) A string describing how to draw the line or an array of floats
    // describing the line lengths and space lengths:

    // dot - translates to dash array: [0.1, 2 * strokeWidth]
    // dash - translates to dash array: [2 * strokeWidth, 2 * strokeWidth]
    // dashdot - translates to dash array: [3 * strokeWidth, 2 * strokeWidth, 0.1, 2 * strokeWidth]
    // longdash - translates to dash array: [4 * strokeWidth, 2 * strokeWidth]
    // longdashdot - translates to dash array: [5 * strokeWidth, 2 * strokeWidth, 0.1, 2 * strokeWidth]
    // {string containing spaces to delimit array elements} - Example: [1 2 3 1 2]

    // olStrokeStyle.getLineDash() will return a number array, wich is not valid for mapfish print.
    // Here we translate the number array in lineDash to a valid value recognized by mapfish print like "5 5" instead
    // of [5, 5]
    return {
      color: olStrokeStyle.getColor(),
      lineCap: olStrokeStyle.getLineCap(),
      lineJoin: olStrokeStyle.getLineJoin(),
      lineDash: olStrokeStyle.getLineDash() ? olStrokeStyle.getLineDash().toString().replace(/,/g, ' ') : undefined,
      lineDashOffset: olStrokeStyle.getLineDashOffset(),
      miterLimit: olStrokeStyle.getMiterLimit(),
      width: olStrokeStyle.getWidth()
    };
  }

  /**
   * Returns a plain object matching the passed ol.style.Text instance.
   *
   * @param {OlStyleText} olTextStyle An ol.style.Text instance.
   * @return {Object} A plain object matching the passed `ol.style.Text`
   *                  instance.
   */
  writeTextStyle = olTextStyle => {
    if (!(olTextStyle instanceof OlStyleText)) {
      return {};
    }

    return {
      fill: this.writeFillStyle(olTextStyle.getFill()),
      font: olTextStyle.getFont(),
      offsetX: olTextStyle.getOffsetX(),
      offsetY: olTextStyle.getOffsetY(),
      rotation: olTextStyle.getRotation(),
      scale: olTextStyle.getScale(),
      stroke: this.writeStrokeStyle(olTextStyle.getStroke()),
      text: olTextStyle.getText(),
      textAlign: olTextStyle.getTextAlign(),
      textBaseline: olTextStyle.getTextBaseline()
    };
  }

}

export default MapFishPrintV3GeoJsonSerializer;
