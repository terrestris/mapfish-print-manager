import OlMap from 'ol/Map';
import OlView from 'ol/View';
import OlLayerTile from 'ol/layer/Tile';
import OlSourceTileWMS from 'ol/source/TileWMS';
import { fromLonLat } from 'ol/proj';

import { MapFishPrintV2Manager } from '../src/index';

const map = new OlMap({
  target: 'map',
  layers: [
    new OlLayerTile({
      source: new OlSourceTileWMS({
        url: 'https://ows.terrestris.de/osm/service',
        params: {
          'LAYERS': 'OSM-WMS'
        }
      })
    })
  ],
  view: new OlView({
    center: fromLonLat([7.11566, 50.40570]),
    zoom: 10
  })
});

// @ts-ignore
const printProvider = new MapFishPrintV2Manager({
  url: 'http://localhost:9000/print-v2/pdf',
  map: map
});

// @ts-ignore
printProvider.init()
  .then(() => {
    fillCombos();
    registerPrintHandler();
    printProvider.on('change:scale', onChangePrintExtent);
  });

/**
 *
 */
const onChangePrintExtent = scale => {
  const scaleSelect: any = document.querySelector('select#scale-select');
  scaleSelect.value = scale.name;
};

/**
 *
 */
const onLayoutChange = event => {
  const value = event.target.value;
  printProvider.setLayout(value);
};

/**
 *
 */
const onDpiChange = event => {
  const value = event.target.value;
  printProvider.setDpi(value);
};

/**
 *
 */
const onFormatChange = event => {
  const value = event.target.value;
  printProvider.setOutputFormat(value);
};

/**
 *
 */
const onScaleChange = event => {
  const value = event.target.value;
  printProvider.setScale(value);
};

/**
 *
 */
const registerPrintHandler = () => {
  const printBtn: any = document.querySelector('button#print');
  printBtn.onclick = onPrintClick;
};

/**
 *
 */
const onPrintClick = () => {
  printProvider?.print(true)?.catch(error => {
    console.log('Error while printing: ' + error);
  });
};

/**
 *
 */
const fillCombos = () => {
  const layoutSelect: any = document.querySelector('select#layout-select');
  printProvider.getLayouts().forEach((layout: any) => {
    const option = document.createElement('option');
    option.text = layout.name;
    layoutSelect?.add(option);
  });
  layoutSelect.value = printProvider.getLayout().name;
  layoutSelect.onchange = onLayoutChange;

  const dpiSelect: any = document.querySelector('select#dpi-select');
  printProvider.getDpis().forEach((dpi: any) => {
    const option = document.createElement('option');
    option.text = dpi.name;
    dpiSelect?.add(option);
  });
  dpiSelect.value = printProvider.getDpi().name;
  dpiSelect.onchange = onDpiChange;

  const formatSelect: any = document.querySelector('select#format-select');
  printProvider.getOutputFormats().forEach((format: any) => {
    const option = document.createElement('option');
    option.text = format.name;
    formatSelect.add(option);
  });
  formatSelect.value = printProvider.getOutputFormat().name;
  formatSelect.onchange = onFormatChange;

  const scaleSelect: any = document.querySelector('select#scale-select');
  printProvider.getScales().forEach((scale: any) => {
    const option = document.createElement('option');
    option.text = scale.name;
    scaleSelect.add(option);
  });
  scaleSelect.value = printProvider.getScale().name;
  scaleSelect.onchange = onScaleChange;
};
