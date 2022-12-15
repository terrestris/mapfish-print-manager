import {
  enableFetchMocks,
  disableFetchMocks,
  FetchMock
} from 'jest-fetch-mock';

import OlMap from 'ol/Map';
import OlView from 'ol/View';
import OlLayerVector from 'ol/layer/Vector';
import OlSourceVector from 'ol/source/Vector';

import { MapFishPrintV3Manager } from '../../src/manager/MapFishPrintV3Manager';

import printAppsMockResponse from '../../assets/v3/apps.json';
import printCapabilitiesMockResponse from '../../assets/v3/capabilities.json';

describe('MapFishPrintV3Manager', () => {

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
    expect(MapFishPrintV3Manager).not.toBeUndefined();
  });

  it('loads the print capabilities from a remote source', async () => {
    (fetch as FetchMock).mockResponses(
      JSON.stringify(printAppsMockResponse),
      JSON.stringify(printCapabilitiesMockResponse)
    );

    const manager = new MapFishPrintV3Manager({
      map: testMap,
      url: 'https://mock:8080/print/pdf/'
    });

    await expect(manager.init()).resolves.not.toThrow();
  });

  it('loads the print capabilities from a local source', async () => {
    const manager = new MapFishPrintV3Manager({
      map: testMap,
      capabilities: printCapabilitiesMockResponse
    });

    await expect(manager.init()).resolves.not.toThrow();
  });

  it('renders the print extent', () => {
    const manager = new MapFishPrintV3Manager({
      map: testMap,
      capabilities: printCapabilitiesMockResponse
    });
    manager.init();

    expect(testMap.getLayers().getArray().length).toEqual(1);
    expect((testMap.getLayers().getArray()[0] as OlLayerVector<OlSourceVector>)
      .getSource()?.getFeatures().length).toEqual(1);
  });

  it('loads available print apps', async () => {
    (fetch as FetchMock).mockResponses(
      JSON.stringify(printAppsMockResponse)
    );
    const manager = new MapFishPrintV3Manager({
      map: testMap,
      url: 'https://mock:8080/print/pdf/'
    });

    const response = await manager.loadPrintApps();

    expect(response).toEqual(printAppsMockResponse);
  });

  it('loads capabilities for chosen app', async () => {
    (fetch as FetchMock).mockResponses(
      JSON.stringify(printCapabilitiesMockResponse)
    );
    const manager = new MapFishPrintV3Manager({
      map: testMap,
      url: 'https://mock:8080/print/pdf/'
    });

    const printApp = 'default';

    const response = await manager.loadAppCapabilities(printApp);

    expect(response.app).toBe(printCapabilitiesMockResponse.app);
  });

  describe('#getBasePath', () => {
    it('is defined', () => {
      const manager = new MapFishPrintV3Manager({
        map: testMap,
        url: 'https://mock:8080/print/pdf/'
      });
      expect(manager.getBasePath).not.toBeUndefined();
    });
  });

});
