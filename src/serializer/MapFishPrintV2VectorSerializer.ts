import { parseFont } from 'css-font-parser';
import get from 'lodash/get';
import _isNil from 'lodash/isNil';
import pickBy from 'lodash/pickBy';
import OlFeature from 'ol/Feature';
import OlFormatGeoJSON from 'ol/format/GeoJSON';
import OlGeometryCircle from 'ol/geom/Circle';
import {fromCircle} from 'ol/geom/Polygon';
import OlLayer from 'ol/layer/Layer';
import OlLayerVector from 'ol/layer/Vector';
import OlSource from 'ol/source/Source';
import OlSourceVector from 'ol/source/Vector';
import OlStyleCircle from 'ol/style/Circle';
import OlStyleFill from 'ol/style/Fill';
import OlStyleIcon from 'ol/style/Icon';
import OlStyleImage from 'ol/style/Image';
import OlStyleRegularShape from 'ol/style/RegularShape';
import OlStyleStroke from 'ol/style/Stroke';
import OlStyleStyle from 'ol/style/Style';
import OlStyleText from 'ol/style/Text';

import parseColor from 'parse-color';

import BaseSerializer from './BaseSerializer';

export class MapFishPrintV2VectorSerializer implements BaseSerializer {

  /**
   * The vector layer type identificator.
   */
  static TYPE_VECTOR = 'Vector';

  /**
   * The property to get the style dictionary key from.
   */
  static FEAT_STYLE_PROPERTY = '_style';

  validateSource(source: OlSource): source is OlSourceVector {
    return source instanceof OlSourceVector;
  }

  serialize(olLayer: OlLayer, opts?: any, viewResolution?: number) {
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
    const serializedStyles: Record<string, any> = {};
    const serializedStylesDict: Record<string, number> = {};
    let styleName: string | number;
    let styleId = 0;

    features.forEach(feature => {
      const geometry = feature.getGeometry();
      const geometryType = geometry?.getType();

      if (!geometryType) {
        return;
      }

      // as GeoJSON format doesn't support circle geometries, we need to
      // transform circles to polygons.
      if (geometry instanceof OlGeometryCircle) {
        const style = feature.getStyle();
        const polyFeature = new OlFeature(fromCircle(geometry));
        polyFeature.setStyle(style);
        feature = polyFeature;
      }
      const serializedFeature = format.writeFeatureObject(feature);

      let styles;
      let styleFunction = feature.getStyleFunction();

      if (styleFunction) {
        styles = styleFunction.call(feature, feature, viewResolution);
      } else {
        styleFunction = (olLayer as OlLayerVector<OlSourceVector>).getStyleFunction();
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
          serializedFeature.properties[MapFishPrintV2VectorSerializer.FEAT_STYLE_PROPERTY] = styleName;
        });
      }
    });

    return {
      ...{
        name: olLayer.get('name') || 'Vector Layer',
        opacity: olLayer.getOpacity(),
        geoJson: {
          type: 'FeatureCollection',
          features: serializedFeatures
        },
        styles: serializedStyles,
        styleProperty: MapFishPrintV2VectorSerializer.FEAT_STYLE_PROPERTY,
        type: MapFishPrintV2VectorSerializer.TYPE_VECTOR
      }
    };
  }

  /**
   * Returns a plain object matching the passed `ol.style.Style` instance.
   *
   * @param olStyle An ol.style.Style instance.
   * @param geomType The geometry type.
   * @return A plain object matching the passed `ol.style.Style` instance.
   */
  writeStyle = (olStyle: OlStyleStyle, geomType: string) => {
    const fillStyle = this.writeFillStyle(olStyle.getFill());
    const imageStyle: any = this.writeImageStyle(olStyle.getImage());
    const strokeStyle = this.writeStrokeStyle(olStyle.getStroke());
    const textStyle = this.writeTextStyle(olStyle.getText());

    let style;
    switch (geomType) {
      case 'Point':
      case 'MultiPoint':
        style = {
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
          // TODO not available in ol?
          graphicXOffset: undefined,
          // TODO not available in ol?
          graphicYOffset: undefined,
          rotation: get(imageStyle, 'rotation'),
          graphicName: get(imageStyle, 'graphicName') || 'circle'
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
        style = { };
    }

    if (textStyle && textStyle.text) {
      const parsedFont = textStyle.font ? parseFont(textStyle.font) : undefined;
      const fontColor = get(textStyle, 'fill.color') as string;
      style = {
        ...style,
        ...{
          label: textStyle.text,
          fontFamily: parsedFont?.['font-family']?.join(','),
          fontSize: parsedFont?.['font-size'],
          fontWeight: parsedFont?.['font-weight'],
          fontStyle: parsedFont?.['font-style'],
          fontColor: parseColor(fontColor).hex,
          fontOpacity: get(parseColor(fontColor), 'rgba[3]')
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
  writeIconStyle = (olIconStyle: OlStyleIcon) => {
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
  };

  /**
   * Returns a plain object matching the passed ol.style.RegularShape
   * instance.
   *
   * @param olRegularShape An ol.style.RegularShape instance.
   *
   * @return A plain object matching the passed `ol.style.RegularShape` instance.
   */
  writeRegularShapeStyle = (olRegularShape: OlStyleRegularShape) => {
    if (!(olRegularShape instanceof OlStyleRegularShape)) {
      return {};
    }

    /**
     * Returns the graphicName of a RegularShape or undefined based on the
     * number of points, radius and angle.
     *
     * @returns The graphicName of a RegularShape feature (triangle, square, cross, x and star)
     */
    const getGraphicName = () => {
      if (olRegularShape.getPoints() === 3) {
        return 'triangle';
      }
      else if (
        olRegularShape.getPoints() === 4 &&
        olRegularShape.getRadius2() === undefined
      ) {
        return 'square';
      }
      else if (
        olRegularShape.getPoints() === 4 &&
        olRegularShape.getRadius2() !== undefined &&
        olRegularShape.getAngle() === 0
      ) {
        return 'cross';
      }
      else if (
        olRegularShape.getPoints() === 4 &&
        olRegularShape.getAngle() !== 0
      ) {
        return 'x';
      }
      else if (olRegularShape.getPoints() === 5) {
        return 'star';
      }
      else {
        return undefined;
      }
    };

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
      stroke: this.writeStrokeStyle(olRegularShape.getStroke()),
      graphicName: getGraphicName()
    };
  };

  /**
   * Returns a plain object matching the passed ol.style.Fill instance.
   *
   * @param olFillStyle An ol.style.Fill instance.
   *
   * @return A plain object matching the passed `ol.style.Fill` instance.
   */
  writeFillStyle = (olFillStyle?: OlStyleFill | null) => {
    if (_isNil(olFillStyle)) {
      return {};
    }

    return {
      color: olFillStyle.getColor()
    };
  };

  /**
   * Returns a plain object matching the passed ol.style.Stroke instance.
   *
   * @param olStrokeStyle An ol.style.Stroke instance.
   * @return A plain object matching the passed `ol.style.Stroke` instance.
   */
  writeStrokeStyle = (olStrokeStyle?: OlStyleStroke| null) => {
    if (_isNil(olStrokeStyle)) {
      return {};
    }

    return {
      color: olStrokeStyle.getColor(),
      lineCap: olStrokeStyle.getLineCap(),
      lineJoin: olStrokeStyle.getLineJoin(),
      // If not set, getLineDash will return null.
      lineDash: olStrokeStyle.getLineDash() || undefined,
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

export default MapFishPrintV2VectorSerializer;
