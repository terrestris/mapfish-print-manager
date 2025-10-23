module.exports = {
  moduleFileExtensions: [
    'js',
    'ts'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!ol|decode-uri-component|query-string|split-on-first|filter-obj|color-[^/]+/.*|rbush|quickselect)'
  ],
  setupFiles: [
    '<rootDir>/spec/jest/setup.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  modulePathIgnorePatterns: [
    '<rootDir>/build/',
    '<rootDir>/dist/'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/config/**/*.{ts,js}',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  reporters: [
    'default',
    '@casualbot/jest-sonar-reporter'
  ],
  coverageReporters: ['json-summary', 'lcov', 'text'],
  coverageDirectory: '<rootDir>/coverage',
  testEnvironment: 'jsdom',
  testRegex: '/spec/.*\\.spec.(ts|js)$'
};
