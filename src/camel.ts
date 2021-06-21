'use strict';

import {scribe} from "../typedefs/core";

class Camel {
    constructor(public config: scribe.Config) {

    }


    async extractAndWriteApiDetailsToDisk(overwriteMarkdownFiles: boolean) {
        const markdown = require("./writers/markdown")(this.config, ".scribe");
        markdown.writeIntroAndAuthFiles();
    }
}

export = Camel;