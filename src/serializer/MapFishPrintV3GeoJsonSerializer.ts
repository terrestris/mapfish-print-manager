import OlSource from 'ol/source/Source';
import OlSourceVector from 'ol/source/Vector';
import OlLayer from 'ol/layer/Layer';
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
import parseFont, { IFont } from 'parse-css-font';

import BaseSerializer from './BaseSerializer';
import _isNil from 'lodash/isNil';

export class MapFishPrintV3GeoJsonSerializer implements BaseSerializer {

  /**
   * The vector GeoJSON type identificator.
   */
  static TYPE_GEOJSON: string = 'geojson';

  /**
   * The property to get the style dictionary key from.
   *
   * @type {string}
   */
  static FEAT_STYLE_PROPERTY: string = '_style';

  validateSource(source: OlSource): source is OlSourceVector {
    return source instanceof OlSourceVector;
  }

  serialize(olLayer: OlLayer, opts?: any, viewResolution?: number) {
    const optsToApply = {
      failOnError: false,
      renderAsSvg: false,
      ...opts
    };

    const source = olLayer.getSource();

    if (!source || !this.validateSource(source)) {
      return;
    }

    if (!viewResolution) {
      return;
    }

    const features = source.getFeatures();
    const format = new OlFormatGeoJSON();
    const serializedFeatures: any[] = [];
    const serializedStyles: {
      [key: string]: any;
    } = {};
    const serializedStylesDict: {
      [key: string]: number;
    } = {};
    let styleName;
    let styleId = 0;

    features.forEach(feature => {
      const geometry = feature.getGeometry();
      const geometryType = geometry?.getType();

      if (!geometryType) {
        return;
      }

      let serializedFeature: any;

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
        styles = styleFunction.call(feature, feature, viewResolution);
      } else {
        styleFunction = (olLayer as OlLayerVector<OlFeature>).getStyleFunction();
        if (styleFunction) {
          styles = styleFunction.call(olLayer, feature, viewResolution);
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

    return {
      geoJson: {
        type: 'FeatureCollection',
        features: serializedFeatures
      },
      name: olLayer.get('name') || 'Vector Layer',
      opacity: olLayer.getOpacity(),
      style: serializedStyles,
      type: MapFishPrintV3GeoJsonSerializer.TYPE_GEOJSON,
      ...optsToApply
    };
  }

  /**
   * Returns a plain object matching the passed `ol.style.Style` instance.
   *
   * @param olStyle An ol.style.Style instance.
   * @param geomType The type of the geometry.
   * @return A plain object matching the passed `ol.style.Style` instance.
   */
  writeStyle = (olStyle: OlStyleStyle, geomType: string) => {
    if (_isNil(olStyle)) {
      return undefined;
    }

    const fillStyle = this.writeFillStyle(olStyle.getFill());
    const imageStyle: any = this.writeImageStyle(olStyle.getImage());
    const strokeStyle = this.writeStrokeStyle(olStyle.getStroke());
    const textStyle = this.writeTextStyle(olStyle.getText());

    let style: {};
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
          strokeColor: parseColor(strokeStyle.color as string).hex,
          strokeOpacity: get(parseColor(strokeStyle.color as string), 'rgba[3]'),
          strokeWidth: strokeStyle.width,
          strokeLinecap: strokeStyle.lineCap,
          strokeDashstyle: strokeStyle.lineDash
        };
        break;
      case 'Polygon':
      case 'MultiPolygon':
      case 'Circle':
        style = {
          strokeColor: parseColor(strokeStyle.color as string).hex,
          strokeOpacity: get(parseColor(strokeStyle.color as string), 'rgba[3]'),
          strokeWidth: strokeStyle.width,
          strokeLinecap: strokeStyle.lineCap,
          strokeDashstyle: strokeStyle.lineDash,
          fillColor: parseColor(fillStyle.color as string).hex,
          fillOpacity: get(parseColor(fillStyle.color as string), 'rgba[3]')
        };
        break;
      default:
        // TODO some fallback style?!
        style = {

        };
    }

    if (textStyle && textStyle.text) {
      const parsedFont = textStyle.font ? parseFont(textStyle.font) as IFont : undefined;
      const fontColor = get(textStyle, 'fill.color') as string;
      style = {
        ...style,
        ...{
          label: textStyle.text,
          fontFamily: parsedFont?.family?.join(','),
          fontSize: parsedFont?.size,
          fontWeight: parsedFont?.weight,
          fontStyle: parsedFont?.style,
          fontColor: parseColor(fontColor).hex,
          fontOpacity: get(parseColor(fontColor), 'rgba[3]'),
          strokeOpacity: 0,
          fillOpacity: 0,
          graphicOpacity: 0
        }
      };
    }

    return pickBy(style, v => v !== undefined);
  };

  /**
   * Returns a plain object matching the passed ol.style.Image instance.
   *
   * Works with `ol.style.Circle`, `ol.style.Icon` and
   * `ol.style.RegularShape`
   *
   * @param olImageStyle An ol.style.Image instance.
   * @return A plain object matching the passed `ol.style.Image` instance.
   */
  writeImageStyle = (olImageStyle?: OlStyleImage | null) => {
    if (_isNil(olImageStyle)) {
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
  };

  /**
   * Returns a plain object matching the passed ol.style.Circle instance.
   *
   * @param olCircleStyle An ol.style.Circle instance.
   * @return A plain object matching the passed `ol.style.Circle` instance.
   */
  writeCircleStyle = (olCircleStyle: OlStyleCircle) => {
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
  };

  /**
   * Returns a plain object matching the passed ol.style.Icon instance.
   *
   * @param olIconStyle An ol.style.Icon instance.
   * @return A plain object matching the passed `ol.style.Icon` instance.
   */
  writeIconStyle = (olIconStyle?: OlStyleIcon | null) => {
    if (_isNil(olIconStyle)) {
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
  };

  /**
   * Returns a plain object matching the passed ol.style.RegularShape
   * instance.
   *
   * @param olRegularShape An ol.style.RegularShape instance.
   * @return A plain object matching the passed `ol.style.RegularShape` instance.
   */
  writeRegularShapeStyle = (olRegularShape?: OlStyleRegularShape | null) => {
    if (_isNil(olRegularShape)) {
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
  };

  /**
   * Returns a plain object matching the passed ol.style.Fill instance.
   *
   * @param olFillStyle An ol.style.Fill instance.
   * @return A plain object matching the passed `ol.style.Fill` instance.
   */
  writeFillStyle = (olFillStyle?: OlStyleFill | null) => {
    if (_isNil(olFillStyle)) {
      return {};
    }

    return {
      // If no fill is given, set it fully transparent. In some elements with stroke and no fill, the object cannot
      // be rendered for some reason
      color: olFillStyle ? olFillStyle.getColor() : 'rgba(0,0,0,0)'
    };
  };

  /**
   * Returns a plain object matching the passed ol.style.Stroke instance.
   *
   * @param olStrokeStyle An ol.style.Stroke instance.
   * @return A plain object matching the passed `ol.style.Stroke` instance.
   */
  writeStrokeStyle = (olStrokeStyle?: OlStyleStroke | null) => {
    if (_isNil(olStrokeStyle)) {
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
      lineDash: olStrokeStyle.getLineDash() ? olStrokeStyle.getLineDash()?.toString().replace(/,/g, ' ') : undefined,
      lineDashOffset: olStrokeStyle.getLineDashOffset(),
      miterLimit: olStrokeStyle.getMiterLimit(),
      width: olStrokeStyle.getWidth()
    };
  };

  /**
   * Returns a plain object matching the passed ol.style.Text instance.
   *
   * @param olTextStyle An ol.style.Text instance.
   * @return A plain object matching the passed `ol.style.Text` instance.
   */
  writeTextStyle = (olTextStyle: OlStyleText | null) => {
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
  };

}

export default MapFishPrintV3GeoJsonSerializer;
