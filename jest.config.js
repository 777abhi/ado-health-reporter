module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/generate-report.ts',
    '!src/generate-mock-data.ts',
    '!src/list-repos.ts'
  ],
  coverageReporters: ['text', 'cobertura', 'lcov']
};
