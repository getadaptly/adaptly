jest.mock('@adaptly/logging/logger', () => {
    const mockLogger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    };

    return {
        ...mockLogger, // this will mock named exports
        default: mockLogger, // this will mock the default export
        getMessage: jest.fn()
    };
});

jest.mock('@adaptly/env', () => {
    return {
        getEnv: (key) => `MOCKED_${key}`
    };
});
