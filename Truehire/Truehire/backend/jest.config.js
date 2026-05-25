export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/unit'],
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/database.js'
  ],
  coverageDirectory: '<rootDir>/../../qa/reports/jest-coverage',
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: '<rootDir>/../../qa/reports/junit', outputName: 'backend-unit.xml' }]
  ]
};
