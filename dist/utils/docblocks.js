"use strict";
const docblockParser = require("docblock-parser");
const fs = require("fs");
const readline = require("readline");
const { normalizeTypeName, prettyPrintResponseIfJson } = require("./parameters");
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
async function parseDocBlocksFromFile(file) {
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
        }
        else if (line.match(/^\s*\*\/\s*$/)) {
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
function parseDocBlockString(docBlock) {
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
            // We have to join with TWO newlines, so we preserve blank lines between items.
            description = description.join('\n\n');
        }
    }
    else if (typeof parsed.text == 'string') {
        // Otherwise, we'll get a single string
        [title = null, description = null] = parsed.text.split("\n", 2);
    }
    const result = Object.assign({}, defaultTagValues, parsed.tags);
    // Remove /** and */
    result.title = title ? title.trim().replace(/^\/\*{0,2}\s*/, '').replace(/\*{0,2}\/$/, '') : null;
    result.description = description ? description.trim().replace(/\*{0,2}\/$/, '') : null; // Sometimes the last slash of the docblock is included
    result.urlParam = transformFieldListToObject(result.urlParam);
    result.queryParam = transformFieldListToObject(result.queryParam);
    result.bodyParam = transformFieldListToObject(result.bodyParam);
    result.responseField = [].concat(result.responseField).reduce((all, paramTag) => {
        const parsed = parseResponseFieldTagContent(paramTag);
        all[parsed.name] = parsed;
        return all;
    }, {});
    result.response = [].concat(result.response).map(parseResponseTagContent);
    result.responseFile = [].concat(result.responseFile).map(parseResponseFileTagContent);
    result.header = transformHeaderListIntoKeyValue([].concat(result.header));
    return result;
}
async function getDocBlockForEndpoint(endpoint) {
    var _a;
    const [file = null, line = null] = endpoint.declaredAt;
    if (!file) {
        return {};
    }
    const fileDocBlocks = (_a = allDocBlocks[file]) !== null && _a !== void 0 ? _a : await parseDocBlocksFromFile(file);
    const relevantDocBlock = fileDocBlocks.find(d => d.endsAt === (line - 1));
    return relevantDocBlock ? parseDocBlockString(relevantDocBlock.content) : {};
}
function transformFieldListToObject(fields) {
    return [].concat(fields).reduce((all, paramTag) => {
        const parsed = parseParameterTagContent(paramTag);
        all[parsed.name] = parsed;
        return all;
    }, {});
}
function parseParameterTagContent(tagContent) {
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
    description = description.trim();
    return {
        name,
        type: normalizeTypeName(type),
        required: required ? required.includes('required') : false,
        description: description || null,
        example: value ? value.trim() : null,
    };
}
function parseResponseFieldTagContent(tagContent) {
    // Get rid of any rogue trailing slashes (from the end of the docblocK)
    tagContent = tagContent.replace("\n/", '');
    let parsedContent = /({[\S]+}\s+)?(.+?)\s+([\s\S]*)/.exec(tagContent);
    let [_, type, name, description] = parsedContent;
    type = type ? type.trim().replace(/{}/, '') : '';
    description = description.trim();
    return {
        name,
        type: normalizeTypeName(type),
        description: description || null,
    };
}
function parseResponseTagContent(tagContent) {
    // Get rid of any rogue trailing slashes (from the end of the docblocK)
    tagContent = tagContent.replace("\n/", '');
    const parsed = parseIntoContentAndAttributes(tagContent, ["status", "scenario"]);
    let [, status = null, content = null] = /^(\d{3})?\s*(\S[\s\S]*)?$/.exec(parsed.content);
    return {
        status: Number(status || parsed.attributes.status || 200),
        scenario: parsed.attributes.scenario,
        content: prettyPrintResponseIfJson(content),
    };
}
function parseResponseFileTagContent(tagContent) {
    // Get rid of any rogue trailing slashes (from the end of the docblocK)
    tagContent = tagContent.replace("\n/", '');
    // Example content:
    // - '404 responses/model.not.found.json {"type": "User"}'
    // - '404 scenario="Not found" responses/model.not.found.json
    let [, status = null, mainContent = null, extraJson = null] = /^(\d{3})?\s*(.*?)({.*})?$/.exec(tagContent);
    const parsed = parseIntoContentAndAttributes(mainContent, ["status", "scenario"]);
    return {
        status: Number(status || parsed.attributes.status || 200),
        filePath: parsed.content.trim(),
        scenario: parsed.attributes.scenario,
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
/**
 * Parse an annotation like 'status=400 when="things go wrong" {"message": "failed"}'.
 * Attributes are always optional and may appear at the start or the end of the string.
 *
 */
function parseIntoContentAndAttributes(annotationContent, allowedAttributes) {
    let parsedAttributes = {};
    allowedAttributes.forEach(attribute => {
        const regex = new RegExp(`${attribute}=([^\\s'"]+|".+?"|'.+?')\\s*`);
        const matches = regex.exec(annotationContent);
        if (matches) {
            let [attributeAndValue, attributeValue] = matches;
            annotationContent = annotationContent.replace(attributeAndValue, '');
            // Remove any surrounding quotes on the value
            parsedAttributes[attribute] = attributeValue.trim().replace(/(^["']|["']$)/g, '');
        }
    });
    return {
        content: annotationContent.trim(),
        attributes: parsedAttributes
    };
}
module.exports = {
    parseDocBlocksFromFile,
    parseDocBlockString,
    getDocBlockForEndpoint,
};
//# sourceMappingURL=docblocks.js.map