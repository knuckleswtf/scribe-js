'use strict';
const tmp = require('tmp-promise');
class TestingFile {
    constructor(filePath) {
        if (filePath) {
            this.___filePath = filePath;
            return this;
        }
        const tempFile = tmp.fileSync();
        this.___filePath = tempFile.name;
    }
    static fromPath(filePath) {
        return new TestingFile(filePath);
    }
    toString() {
        return this.___filePath;
    }
}
module.exports = TestingFile;
//# sourceMappingURL=TestingFile.js.map