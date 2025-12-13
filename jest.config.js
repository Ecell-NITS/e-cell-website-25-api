/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/**/*.test.ts'], // Looks for .test.ts files
    verbose: true,
    forceExit: true, // Forces exit after tests (good for DB connections)
    // Fix for "absolute path" imports if you use them, otherwise optional:
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1',
    },
  };