import jestFetchMock from 'jest-fetch-mock';
import 'jest-canvas-mock';

global.fetch = jestFetchMock;
