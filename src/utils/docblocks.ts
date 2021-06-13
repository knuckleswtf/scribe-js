import docblockParser = require('docblock-parser');
import fs = require('fs');
import readline = require('readline');
const {normalizeTypeName} = require("./parameters");
import {scribe} from "../../typedefs/core";
import BodyParameter = scribe.BodyParameter;
import DocBlock = scribe.DocBlock;
import ResponseField = scribe.ResponseField;


const defaultTagValues = {
    hideFromApiDocs: false,
    authenticated: false,
    unauthenticated: false,
    group: null,
    groupDescription: null,
    header: [],
    urlParam: [],
    queryParam: [],
    bodyParam: [],
    response: [],
    responseFile: [],
    responseField: [],
};

const allDocBlocks = {};

async function parseDocBlocksFromFile(file): Promise<{
    content: string,
    startsAt: number,
    endsAt: number,
}[]> {
    allDocBlocks[file] = [];

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
            allDocBlocks[file].push({
                content: currentDocBlock,
                startsAt: docBlockStartedAt,
                endsAt: lineNumber,
            });
            docBlockEnd = false;
            docBlockStartedAt = null;
            currentDocBlock = '';
        }
    }

    return allDocBlocks[file];
}

function parseDocBlockString(docBlock: string): DocBlock {
    const parsed = docblockParser({
        tags: {
            hideFromApiDocs: docblockParser.booleanTag,
            authenticated: docblockParser.booleanTag,
            unauthenticated: docblockParser.booleanTag,
            group: docblockParser.singleParameterTag,
            groupDescription: docblockParser.multilineTilTag,
            header: docblockParser.multiParameterTag(/\s+/),
            urlParam: docblockParser.multilineTilEmptyLineOrTag,
            queryParam: docblockParser.multilineTilEmptyLineOrTag,
            bodyParam: docblockParser.multilineTilEmptyLineOrTag,
            response: docblockParser.multilineTilEmptyLineOrTag,
            responseFile: docblockParser.multilineTilEmptyLineOrTag,
            responseField: docblockParser.multilineTilEmptyLineOrTag,
        },
        // Title and description are separated by an empty line
        text: docblockParser.multilineTilEmptyLineOrTag
    }).parse(docBlock);

    let title = null, description = null;
    if (Array.isArray(parsed.text)) {
        // If the user left a blank line between title and description, we'll get an array
        [title = null, ...description] = parsed.text;
        if (description.length) {
            description = description.join('\n');
        }
    } else if (typeof parsed.text == 'string') {
        // Otherwise, we'll get a single string
        [title = null, description = null] = parsed.text.split("\n", 2);
    }

    const result = Object.assign({}, defaultTagValues, parsed.tags);

    result.title = title ? title.trim().replace(/^\/\*\*\s*/, '') : null;
    result.description = description ? description.trim().replace(/\/$/, '') : null; // Sometimes the last slash of the docblock is included

    result.urlParam = transformFieldListToObject(result.urlParam);
    result.queryParam = transformFieldListToObject(result.queryParam);
    result.bodyParam = transformFieldListToObject(result.bodyParam);
    result.responseField =  [].concat(result.responseField).reduce((all, paramTag) => {
        const parsed = parseResponseFieldTagContent(paramTag);
        all[parsed.name] = parsed;
        return all;
    }, {});

    result.response = [].concat(result.response).map(parseResponseTagContent);
    result.responseFile = [].concat(result.responseFile).map(parseResponseFileTagContent);

    result.header = transformHeaderListIntoKeyValue([].concat(result.header));

    return result;
}

async function getDocBlockForEndpoint(endpoint: scribe.Route): Promise<DocBlock|{}> {
    const [file = null, line = null] = endpoint.declaredAt;
    if (!file) {
        return {};
    }

    const fileDocBlocks = allDocBlocks[file] ?? await parseDocBlocksFromFile(file);
    const relevantDocBlock = fileDocBlocks.find(d => d.endsAt === (line - 1));
    return relevantDocBlock ? parseDocBlockString(relevantDocBlock.content) : {};
}

export = {
    parseDocBlocksFromFile,
    parseDocBlockString,
    getDocBlockForEndpoint,
};

function transformFieldListToObject(fields) {
    return [].concat(fields).reduce((all, paramTag) => {
        const parsed = parseParameterTagContent(paramTag);
        all[parsed.name] = parsed;
        return all;
    }, {});
}

function parseParameterTagContent(tagContent: string): BodyParameter {
    // Get rid of any rogue trailing slashes (from the end of the docblocK)
    tagContent = tagContent.replace("\n/", '');
    let [, type, name, required, description] = /\s*{([\S]+?)}\s+([\S]+)(\s+required\s*)?([\s\S]*)/.exec(tagContent);
    let value;

    if (description) {
        description = description.replace(/\n\/\s*$/, ''); // For some reason, the docblock parser sometimes returns the final slash
        const parsedDescription = /(.*)\s*Example:\s+(.+)?/.exec(description);
        if (parsedDescription) {
            description = parsedDescription[1];
            value = parsedDescription[2];
        }
    }

    description  = description.trim();
    return {
        name,
        type: normalizeTypeName(type),
        required: required ? required.includes('required') : false,
        description: description || null,
        value: value ? value.trim() : null,
    };
}

function parseResponseFieldTagContent(tagContent: string): ResponseField {
    let parsedContent = /({[\S]+}\s+)?(.+?)\s+([\s\S]*)/.exec(tagContent);
    let [_, type, name, description] = parsedContent;
    type = type ? type.trim().replace(/{}/, '') : '';

    description  = description.trim();
    return {
        name,
        type: normalizeTypeName(type),
        description: description || null,
    };
}

function parseResponseTagContent(tagContent) {
    // Todo add support for scenarios
    let [, status = 200, content = null] = /^(\d{3})?\s*(\S[\s\S]*)?$/.exec(tagContent);
    content = content != null ? content.replace(/\n\/\s*$/, '').trim() : content; // For some reason, the docblock parser sometimes returns the final slash
    return {
        status,
        content
    };
}

function parseResponseFileTagContent(tagContent) {
    // Example content:  '404 responses/model.not.found.json {"type": "User"}'
    let [, status = 200, filePath = null, extraJson = null] = /^(\d{3})?\s*(.*?)({.*})?$/.exec(tagContent);
    return {
        status,
        filePath: filePath.trim(),
        extraJson: extraJson ? extraJson.trim() : null,
    };
}

function transformHeaderListIntoKeyValue(tagContent) {
    const headers = {};
    while (tagContent.length) {
        // odd keys are the header names, even keys are the values
        headers[tagContent.shift()] = tagContent.shift();
    }
    return headers;
}