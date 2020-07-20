import docblockParser = require('docblock-parser');
import fs = require('fs');
import readline = require('readline');

const docBlocks = {};

async function parseDocBlocksFromFile(file) {
    docBlocks[file] = [];

    const fileStream = fs.createReadStream(file);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let docBlockStartedAt = null, docBlockEnd = false, currentDocBlock = '', lineNumber = 0;

    for await (const line of rl) {
        lineNumber++;
        if (line.match(/^\s*\/\*\*\s*$/)) {
            docBlockStartedAt = lineNumber;
        } else if (line.match(/^\s*\*\/\s*$/)) {
            docBlockEnd = true;
        }

        if (docBlockStartedAt) {
            currentDocBlock += line + "\n";
        }

        if (docBlockEnd) {
            docBlocks[file].push({
                content: currentDocBlock,
                startsAt: docBlockStartedAt,
                endsAt: lineNumber,
            });
            docBlockEnd = false;
            docBlockStartedAt = null;
            currentDocBlock = '';
        }
    }
    return docBlocks[file];
}
function parseParameterTag(tagContent) {
    const parsed = /\s*\{(\w+?)\}\s+([^\s]+)\s+(required\s*)?(.+)\s*/.exec(tagContent);
    const [_, type, name, required, description] = parsed;
    return {name, type, required: Boolean(required), description};
}

function parseDocBlockString(docBlock) {
    const parsed = docblockParser({
        tags: {
            authenticated: docblockParser.booleanTag,
            group: docblockParser.singleParameterTag,
            groupDescription: docblockParser.multilineTilEmptyLineOrTag,
            header: docblockParser.multiParameterTag(/\s+/),
            response: docblockParser.multilineTilEmptyLineOrTag,
        },
        // Title and description are separated by an empty line
        text: docblockParser.multilineTilEmptyLineOrTag
    }).parse(docBlock);

    const [title = null, description = null] = parsed.text ? parsed.text : [null, null];
    const result = parsed.tags;
    result.title = title ? title.replace(/^\/\*\*\s*/, '') : null;
    result.description = description || null;

    result.bodyParam = result.bodyParam ? [].concat(result.bodyParam).reduce((all, paramTag) => {
        const parsed = parseParameterTag(paramTag);
        all[parsed.name] = parsed;
        return all;
    }, {}) : {};
    result.queryParam = result.queryParam ? [].concat(result.queryParam).reduce((all, paramTag) => {
        const parsed = parseParameterTag(paramTag);
        all[parsed.name] = parsed;
        return all;
    }, {}) : {};
    result.urlParam = result.urlParam ? [].concat(result.urlParam).reduce((all, paramTag) => {
        const parsed = parseParameterTag(paramTag);
        all[parsed.name] = parsed;
        return all;
    }, {}) : {};

    return result;
}

export = {
    parseDocBlocksFromFile,
    parseDocBlockString,
};