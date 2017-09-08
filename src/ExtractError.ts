export class ExtractError extends Error {
    constructor(message: string) {
        super(message);
        this.message = message;
        (<any>Object).setPrototypeOf(this, ExtractError.prototype);
    }
}
