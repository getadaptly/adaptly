import { AdaptlyErrorValue } from '.';

export type ErrorHandler = (error?: any, context?: any) => never;

export class AdaptlyError extends Error {
    value: AdaptlyErrorValue;
    context: any;

    constructor(value: AdaptlyErrorValue, context?: any) {
        super(value.message);
        this.name = 'AdaptlyError';

        this.value = value;
        this.context = context;
        Object.setPrototypeOf(this, AdaptlyError.prototype);
    }
}

export class NpmError extends AdaptlyError {
    constructor(value: AdaptlyErrorValue, context?: any) {
        super(value, context);
        this.name = 'NpmError';
        Object.setPrototypeOf(this, NpmError.prototype);
    }
}

export class PyPiError extends AdaptlyError {
    constructor(value: AdaptlyErrorValue, context?: any) {
        super(value, context);
        this.name = 'PyPiError';
        Object.setPrototypeOf(this, PyPiError.prototype);
    }
}

export class JSONParsingError extends AdaptlyError {
    constructor(value: AdaptlyErrorValue, context?: any) {
        super(value, context);
        this.name = 'JSONParsingError';
        Object.setPrototypeOf(this, JSONParsingError.prototype);
    }
}

export class GithubError extends AdaptlyError {
    constructor(value: AdaptlyErrorValue, context?: any) {
        super(value, context);
        this.name = 'GithubError';
        Object.setPrototypeOf(this, GithubError.prototype);
    }
}

export class EnvironmentError extends AdaptlyError {
    constructor(value: AdaptlyErrorValue, context?: any) {
        super(value, context);
        this.name = 'EnvironmentError';
        Object.setPrototypeOf(this, EnvironmentError.prototype);
    }
}

export class PrismaError extends AdaptlyError {
    constructor(value: AdaptlyErrorValue, context?: any) {
        super(value, context);
        this.name = 'PrismaError';
        Object.setPrototypeOf(this, PrismaError.prototype);
    }
}

export class OpenAiError extends AdaptlyError {
    constructor(value: AdaptlyErrorValue, context?: any) {
        super(value, context);
        this.name = 'OpenAiError';
        Object.setPrototypeOf(this, OpenAiError.prototype);
    }
}

export class OctokitError extends AdaptlyError {
    constructor(value: AdaptlyErrorValue, context?: any) {
        super(value, context);
        this.name = 'OctokitError';
        Object.setPrototypeOf(this, OctokitError.prototype);
    }
}

export class TypescriptError extends AdaptlyError {
    constructor(value: AdaptlyErrorValue, context?: any) {
        super(value, context);
        this.name = 'TypescriptCompilerError';
        Object.setPrototypeOf(this, TypescriptError.prototype);
    }
}

export class PythonError extends AdaptlyError {
    constructor(value: AdaptlyErrorValue, context?: any) {
        super(value, context);
        this.name = 'PythonError';
        Object.setPrototypeOf(this, PythonError.prototype);
    }
}
