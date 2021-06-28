'use strict';

const tmp = require('tmp-promise');

class TestingFile {
    ___filePath: string;

    constructor(filePath?: string) {
        if (filePath) {
            this.___filePath = filePath;
            return this;
        }

        const tempFile = tmp.fileSync();
        this.___filePath = tempFile.name;
    }

    static fromPath(filePath: string) {
        return new TestingFile(filePath);
    }

    toString() {
        return this.___filePath;
    }
}

export = TestingFile;