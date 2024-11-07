import {
  enableFetchMocks,
  disableFetchMocks,
  FetchMock
} from 'jest-fetch-mock';

import OlLayerVector from 'ol/layer/Vector';
import OlMap from 'ol/Map';
import OlSourceVector from 'ol/source/Vector';
import OlView from 'ol/View';

import printAppsMockResponse from '../../assets/v3/apps.json';
import printCapabilitiesMockResponse from '../../assets/v3/capabilities.json';
import { MapFishPrintV3Manager, V3CustomMapParams } from '../../src/manager/MapFishPrintV3Manager';

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

    // @ts-expect-error protected method
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

    // @ts-expect-error protected method
    const response = await manager.loadAppCapabilities(printApp);

    expect(response.app).toBe(printCapabilitiesMockResponse.app);
  });

  describe('#getBasePath', () => {
    it('is defined', () => {
      const manager = new MapFishPrintV3Manager({
        map: testMap,
        url: 'https://mock:8080/print/pdf/'
      });
      // @ts-expect-error protected method
      expect(manager.getBasePath).not.toBeUndefined();
    });
  });

  describe('#setCustomMapParams', () => {
    const customPrintManager = new MapFishPrintV3Manager({
      map: testMap,
      url: 'https://mock:8080/print/pdf/'
    });

    it('is defined', () => {
      expect(customPrintManager.setCustomMapParams).not.toBeUndefined();
    });

    it('works as expected', () => {
      const parameters: V3CustomMapParams = {
        projection: 'EPSG:25832',
        longitudeFirst: true
      };
      customPrintManager.setCustomMapParams(parameters);
      expect(customPrintManager.getCustomMapParams()).toEqual(parameters);
    });
  });

  describe('#getCustomMapParams', () => {
    const customPrintManager = new MapFishPrintV3Manager({
      map: testMap,
      url: 'https://mock:8080/print/pdf/',
      customMapParams: {
        projection: 'EPSG:25832',
        longitudeFirst: true
      }
    });

    it('is defined', () => {
      expect(customPrintManager.getCustomMapParams).not.toBeUndefined();
    });

    it('works as expected', () => {
      expect(customPrintManager.getCustomMapParams()).toEqual({
        projection: 'EPSG:25832',
        longitudeFirst: true
      });
    });
  });

  describe('#appendCustomMapParams', () => {
    const customPrintManager = new MapFishPrintV3Manager({
      map: testMap,
      url: 'https://mock:8080/print/pdf/',
      customMapParams: {
        projection: 'EPSG:25832'
      }
    });

    it('is defined', () => {
      expect(customPrintManager.appendCustomMapParams).not.toBeUndefined();
    });

    it('works as expected', () => {
      customPrintManager.appendCustomMapParams({
        longitudeFirst: true
      });
      expect(customPrintManager.getCustomMapParams()).toEqual({
        projection: 'EPSG:25832',
        longitudeFirst: true
      });
    });
  });

  describe('#clearCustomMapParams', () => {
    const customPrintManager = new MapFishPrintV3Manager({
      map: testMap,
      url: 'https://mock:8080/print/pdf/',
      customMapParams: {
        projection: 'EPSG:25832'
      }
    });

    it('is defined', () => {
      expect(customPrintManager.clearCustomMapParams).not.toBeUndefined();
    });

    it('works as expected', () => {
      customPrintManager.clearCustomMapParams();
      expect(customPrintManager.getCustomMapParams()).toEqual({});
    });
  });

});
