const nextJest = require('next/jest')

const createJestConfig = nextJest({
    dir: './',
})

const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jest-environment-jsdom',
    testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/src/__tests__/__mocks__/'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@upstash/redis$': '<rootDir>/src/__tests__/__mocks__/upstash-redis.js',
        '^@upstash/ratelimit$': '<rootDir>/src/__tests__/__mocks__/upstash-ratelimit.js',
    },
}

module.exports = createJestConfig(customJestConfig)
