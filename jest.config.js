module.exports = {
  automock: false,
  moduleFileExtensions: [
    'js'
  ],
  moduleDirectories: [
    'node_modules'
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/build/'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!ol)'
  ],
  setupFiles: [
    'jest-canvas-mock',
    '<rootDir>/spec/jest/setup.js'
  ],
  collectCoverage: false,
  coverageDirectory: '<rootDir>/coverage'
};
