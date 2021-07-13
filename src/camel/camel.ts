'use strict';

import Endpoint from "./Endpoint";
import OutputEndpointData = require("./OutputEndpointData");
import groupBy = require('lodash.groupby');
import sortBy = require('lodash.sortby');
import * as fs from "fs";

const yaml = require('js-yaml');

type Group = {
    name: string,
    description?: string,
    endpoints: Endpoint[] | OutputEndpointData[],
};

type OutputGroup = {
    name: string,
    description?: string,
    fileName?: string,
    endpoints: OutputEndpointData[]
};

const groupFileNames = {};

export = {
    camelDir: ".scribe/endpoints" as const,

    cacheDir: ".scribe/endpoints.cache" as const,

    groupFileNames,

    async writeEndpointsToDisk(groupedEndpoints: Group[]) {
        if (fs.existsSync(this.camelDir)) {
            const oldFiles = fs.readdirSync(this.camelDir);
            oldFiles.forEach(f => {
                if (!f.startsWith('custom.')) {
                    fs.unlinkSync(this.camelDir + `/${f}`);
                }
            });
        } else {
            fs.mkdirSync(this.camelDir, {recursive: true});
        }

        if (fs.existsSync(this.cacheDir)) {
            fs.rmdirSync(this.cacheDir, {recursive: true});
        }
        fs.mkdirSync(this.cacheDir, {recursive: true});

        let fileNameIndex = 0;
        let fileName = null;
        for (let group of groupedEndpoints) {
            const content = await yaml.dump(group, {
                schema: yaml.JSON_SCHEMA,
                skipInvalid: true,
                noRefs: true,
            });
            if (Object.keys(groupFileNames).length == groupedEndpoints.length
                && groupFileNames[group.name]) {
                fileName = groupFileNames[group.name];
            } else {
                // Format numbers as two digits so they are sorted properly when retrieving later
                // (ie "10.yaml" comes after "9.yaml", not after "1.yaml")
                fileName = String(fileNameIndex).padStart(2, '0') + ".yaml";
                fileNameIndex++;
            }

            fs.writeFileSync(`${this.camelDir}/${fileName}`, content);
            fs.writeFileSync(`${this.cacheDir}/${fileName}`, "## Autogenerated by Scribe. DO NOT MODIFY.\n\n" + content);
        }
    },

    groupEndpoints(parsedEndpoints: Endpoint[], endpointGroupIndexes: Record<string, number>): Group[] {
        const groups: Record<string, Endpoint[]> = groupBy(parsedEndpoints, 'metadata.groupName');

        return Object.entries(groups).map(([groupName, endpointsInGroup]) => {
            let sortedEndpoints = endpointsInGroup;
            if (Object.keys(endpointGroupIndexes).length) {
                sortedEndpoints = sortBy(endpointsInGroup, (e) => endpointGroupIndexes[e.endpointId] ?? Math.max);
            }

            return {
                name: groupName,
                description: endpointsInGroup.find(e => e.metadata?.groupDescription != null)?.metadata?.groupDescription,
                endpoints: sortedEndpoints.map(e => e.forSerialisation()),
            };
        });
    },

    writeExampleCustomEndpoint() {
        // We add an example to guide users in case they need to add a custom endpoint.
        if (!fs.existsSync(this.camelDir + '/custom.0.yaml')) {
            fs.copyFileSync(__dirname + '/../../resources/example_custom_endpoint.yaml', this.camelDir + '/custom.0.yaml');
        }
    },

    prepareGroupedEndpointsForOutput(groupedEndpoints: Group[]): OutputGroup[] {
        const groups = groupedEndpoints.map((group) => {
            return {
                name: group.name,
                description: group.description,
                fileName: groupFileNames[group.name] ?? null,
                endpoints: group.endpoints.map(endpoint => OutputEndpointData.fromExtractedEndpointObject(endpoint)),
            };
        });
        return sortBy(groups, 'fileName');
    },

    loadEndpointsIntoGroups(folder: string): OutputGroup[] {
        let groups = [];
        loadEndpointsFromCamelFiles(folder, (group) => {
            group.endpoints = group.endpoints.map((endpoint) => {
                return OutputEndpointData.fromExtractedEndpointObject(endpoint);
            });
            groups.push(group);
        });
        return groups;
    },

    loadUserDefinedEndpoints(folder: string): Endpoint[] {
        let userDefinedEndpoints = [];

        const contents = fs.readdirSync(folder);
        contents.forEach(fileName => {
            if (fileName.endsWith('.yaml') && fileName.startsWith('custom.')) {
                const endpoints = yaml.load(fs.readFileSync(folder + '/' + fileName));
                (endpoints ?? []).forEach(endpoint => {
                    userDefinedEndpoints.push(endpoint);
                });
            }
        });

        return userDefinedEndpoints;
    },

    /**
     * Load endpoints from the Camel files into a flat list of plain endpoint objects
     */
    loadEndpointsToFlatPrimitivesArray(folder: string, isFromCache = false): Endpoint[] {
        const endpoints = [];

        loadEndpointsFromCamelFiles(folder, (group) => {
            group.endpoints.forEach(endpoint => {
                endpoints.push(endpoint);
            });
        }, !isFromCache);
        return endpoints;
    },

    getEndpointIndexInGroup(groups: OutputGroup[], endpoint: Endpoint): number {
        for (let group of groups) {
            for (let [index, endpointInGroup] of group.endpoints.entries()) {
                if (endpointInGroup.endpointId === endpoint.endpointId) {
                    return index;
                }
            }
        }

        return null;
    }
};

function loadEndpointsFromCamelFiles(folder: string, callback: (group: Group) => any, storeGroupFilePaths = true) {
    const contents = fs.readdirSync(folder);
    contents.forEach(fileName => {
        if (fileName.endsWith('.yaml') && !fileName.startsWith('custom.')) {
            const group = yaml.load(fs.readFileSync(folder + '/' + fileName));
            if (storeGroupFilePaths) {
                groupFileNames[group['name']] = fileName;
            }
            callback(group);
        }
    });
}