module.exports = {
  automock: false,
  moduleFileExtensions: [
    'js',
    'ts'
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
    '<rootDir>/spec/jest/setup.js'
  ],
  collectCoverage: false,
  coverageDirectory: '<rootDir>/coverage',
  testEnvironment: 'jsdom'
};
