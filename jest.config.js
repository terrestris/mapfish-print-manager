module.exports = {
  moduleFileExtensions: [
    'js',
    'ts'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!ol|color-[^/]+/.*)'
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
