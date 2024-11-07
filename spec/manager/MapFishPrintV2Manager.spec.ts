import {
  enableFetchMocks,
  disableFetchMocks,
  FetchMock
} from 'jest-fetch-mock';

import OlLayerImage from 'ol/layer/Image';
import OlLayerVector from 'ol/layer/Vector';
import OlMap from 'ol/Map';
import OlSourceImageWMS from 'ol/source/ImageWMS';
import OlSourceVector from 'ol/source/Vector';
import OlView from 'ol/View';

import mockResponse from '../../assets/v2/info.json';

import { MapFishPrintV2Manager } from '../../src/index';

describe('MapFishPrintV2Manager', () => {

  const testMap = new OlMap({
    layers: [],
    view: new OlView({
      center: [0, 0],
      zoom: 2
    })
  });

  beforeAll(() => {
    enableFetchMocks();
  });

  afterAll(() => {
    disableFetchMocks();
  });

  it('is defined', () => {
    expect(MapFishPrintV2Manager).not.toBeUndefined();
  });

  it('loads the print capabilities from a remote source', async () => {
    (fetch as FetchMock).mockResponse(JSON.stringify(mockResponse));

    const manager = new MapFishPrintV2Manager({
      map: testMap,
      url: 'https://mock:8080/print/pdf/'
    });

    await expect(manager.init()).resolves.not.toThrow();
  });

  it('loads the print capabilities from a local source', () => {
    const manager = new MapFishPrintV2Manager({
      map: testMap,
      capabilities: mockResponse
    });

    expect(manager.init()).toBeTruthy();
  });

  it('renders the print extent', () => {
    const manager = new MapFishPrintV2Manager({
      map: testMap,
      capabilities: mockResponse
    });
    manager.init();

    expect(testMap.getLayers().getArray().length).toEqual(1);
    expect(
      (testMap.getLayers().getArray()[0] as OlLayerVector<OlSourceVector>).getSource()?.getFeatures().length
    ).toEqual(1);
  });

  it('returns the print download url', async () => {
    const map = new OlMap({
      layers: [
        new OlLayerImage({
          extent: [-13884991, 2870341, -7455066, 6338219],
          source: new OlSourceImageWMS({
            url: 'https://bvb.de',
            params: {
              LAYERS: 'SHINJI:KAGAWA',
              FORMAT: 'image/png8'
            }
          })
        })
      ],
      view: new OlView({
        center: [0, 0],
        zoom: 2
      })
    });
    const manager = new MapFishPrintV2Manager({
      method: 'POST',
      map: map,
      capabilities: mockResponse
    });
    const getURLMock =
      'http://localhost:4321/print/pdf/919288886008494300.png.printout';
    manager.init();

    (fetch as FetchMock).mockResponse(
      JSON.stringify({
        getURL: getURLMock
      })
    );

    const payload = await manager.print();

    expect(payload).toEqual(getURLMock);
  });
});
