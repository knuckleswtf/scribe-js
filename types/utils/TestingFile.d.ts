declare class TestingFile {
    ___filePath: string;
    constructor(filePath?: string);
    static fromPath(filePath: string): TestingFile;
    toString(): string;
}
export = TestingFile;
