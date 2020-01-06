[![Build Status](https://travis-ci.com/terrestris/mapfish-print-manager.svg?branch=master)](https://travis-ci.com/terrestris/mapfish-print-manager) [![Greenkeeper badge](https://badges.greenkeeper.io/terrestris/mapfish-print-manager.svg)](https://greenkeeper.io/)

# Mapfish Print Manager

An interface manager to easily communicate with the [MapFish Print](https://mapfish.github.io/mapfish-print-doc/#/overview)
servlet via an [OpenLayers](https://openlayers.org/) based webapplication.

# Installation

If you're using OpenLayers in version 6 just run:

```
npm i --save @terrestris/mapfish-print-manager
```

For version 4 one might use the manager in version 1:

```
npm i --save @terrestris/mapfish-print-manager@1
```

# Usage

```javascript
// Import the manager. If you're using MapFish in version 2, you might want to
// import the `MapFishPrintV2Manager` instead.
import { MapFishPrintV3Manager } from '@terrestris/mapfish-print-manager';

// Construct the manager with a remote print servlet and an `ol.Map` instance
// (required).
const printManager = new MapFishPrintV3Manager({
  url: 'https://10.10.10.10/print/',
  map: olMap
});

// Initialize the manager. It will return a resolved `Promise` as soon as the
// capabilities are loaded from the given ressource, e.g. https://10.10.10.10/print/info.json.
printManager.init()
  .then(() => {
    // Prepare the print layout via the extent feature on the map and/or the
    // usage of the setters like `printManager.setLayout()` and call
    // `printManager.print()` to create the print document.
  });
```

# Examples

Do you want to see the Mapfish Print Manager in action? There are two examples
showing how it works.

Start a locale instance for both MapFish Print version 2 and 3 by executing:

```
cd docker
docker-compose -f docker-compose.yml up --build
```

The print servlets are available under http://localhost:18083 (v2) and
http://localhost:18082/print (v3) now.

Install all needed dependencies and start the development server with

```
npm i
npm start
```

You can now try out the example applications:

* http://localhost:9000/print-manager-v2-example.html (v2)
* http://localhost:9000/print-manager-v3-example.html (v3)
