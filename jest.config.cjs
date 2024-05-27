module.exports = {
  moduleFileExtensions: [
    'js',
    'ts'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!ol|decode-uri-component|query-string|split-on-first|filter-obj|color-[^/]+/.*)'
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
    'src/**/*.{ts,js}'
  ],
  coverageDirectory: '<rootDir>/coverage',
  testEnvironment: 'jsdom',
  testRegex: '/spec/.*\\.spec.(ts|js)$'
};
