import OlFeature from 'ol/Feature';
import { Geometry } from 'ol/geom';
import OlGeomLineString from 'ol/geom/LineString';
import OlGeomPoint from 'ol/geom/Point';
import OlGeomPolygon from 'ol/geom/Polygon';
import OlLayerImage from 'ol/layer/Image';
import OlLayerVector from 'ol/layer/Vector';
import OlSourceImageWMS from 'ol/source/ImageWMS';
import OlSourceVector from 'ol/source/Vector';

import { MapFishPrintV3GeoJsonSerializer } from '../../src/serializer/MapFishPrintV3GeoJsonSerializer';

describe('MapFishPrintV3GeoJsonSerializer', () => {
  let serializer: MapFishPrintV3GeoJsonSerializer;

  beforeEach(() => {
    serializer = new MapFishPrintV3GeoJsonSerializer();
  });

  it('is defined', () => {
    expect(MapFishPrintV3GeoJsonSerializer).not.toBeUndefined();
  });

  it('checks if the given layer can be serialized with it', () => {
    const layer = new OlLayerImage({
      source: new OlSourceImageWMS()
    });

    const serialized = serializer.serialize(layer, {}, 1909);

    expect(serialized).toBeUndefined();
  });

  it('serializes a layer with a Vector source (no features)', () => {
    const layer = new OlLayerVector({
      source: new OlSourceVector()
    });

    const serializedSimple = serializer.serialize(layer, null, 1909);

    expect(serializedSimple).toEqual({
      geoJson: {
        type: 'FeatureCollection',
        features: []
      },
      name: layer.get('name') || 'Vector Layer',
      opacity: layer.getOpacity(),
      style: {},
      type: 'geojson',
      failOnError: false,
      renderAsSvg: false
    });
  });

  it('serializes a layer with a Vector source (including features)', () => {
    const features: OlFeature<Geometry>[] = [
      new OlFeature({
        geometry: new OlGeomPoint([0, 0])
      }),
      new OlFeature({
        geometry: new OlGeomLineString([
          [0, 0],
          [1, 1]
        ])
      }),
      new OlFeature({
        geometry: new OlGeomPolygon([
          [
            [0, 0],
            [1, 1],
            [0, 0]
          ]
        ])
      })
    ];

    const layer = new OlLayerVector({
      source: new OlSourceVector({
        features
      })
    });

    const serializedSimple = serializer.serialize(layer, null, 1909);

    expect(serializedSimple).toEqual({
      geoJson: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [0, 0]
          },
          properties: {
            _style: 0
          }
        }, {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [[0, 0], [1, 1]]
          },
          properties: {
            _style: 1
          }
        }, {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[[0, 0], [1, 1], [0, 0]]]
          },
          properties: {
            _style: 2
          }
        }]
      },
      name: layer.get('name') || 'Vector Layer',
      opacity: layer.getOpacity(),
      style: {
        0: {
          fillColor: '#ffffff',
          fillOpacity: 0.4,
          graphicName: 'circle',
          pointRadius: 5,
          rotation: 0,
          strokeColor: '#3399cc',
          strokeOpacity: 1,
          strokeWidth: 1.25,
          version: 2,
        },
        1: {
          strokeColor: '#3399cc',
          strokeOpacity: 1,
          strokeWidth: 1.25,
        },
        2: {
          fillColor: '#ffffff',
          fillOpacity: 0.4,
          strokeColor: '#3399cc',
          strokeOpacity: 1,
          strokeWidth: 1.25,
        }
      },
      type: 'geojson',
      failOnError: false,
      renderAsSvg: false
    });
  });
});
