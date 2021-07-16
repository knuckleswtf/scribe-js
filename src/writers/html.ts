'use strict';

import {scribe} from "../../typedefs/core";
import fs = require("fs");
import path = require("path");
import writing = require("../utils/writing");

const showdown = require('showdown');

class HtmlWriter {
    private converter: typeof showdown.Converter;

    constructor(private config: scribe.Config) {
        this.converter = new showdown.Converter();
    }

    async generate(groupedEndpoints, sourceFolder = '.scribe', destinationFolder: string = 'public/docs') {
        const intro = await this.transformMarkdownFileToHTML(sourceFolder + '/intro.md');
        const auth = await this.transformMarkdownFileToHTML(sourceFolder + '/auth.md');

        const appendFile = `${sourceFolder}/append.md`;
        const append = fs.existsSync(appendFile) ? this.transformMarkdownFileToHTML(appendFile) : '';

        const theme = this.config.theme ?? 'default';
        const output = await writing.renderEjsTemplate(`themes/${theme}/index`, {
            metadata: this.getMetadata(),
            baseUrl: this.config.baseUrl,
            tryItOut: this.config.tryItOut || {enabled: true},
            intro,
            auth,
            groupedEndpoints,
            append,
            getVersionedAsset,
        });

        if (!fs.existsSync(destinationFolder)) {
            fs.mkdirSync(destinationFolder, {recursive: true});
        }

        fs.writeFileSync(destinationFolder + '/index.html', output);

        // Copy assets
        const assetsFolder = path.join(__dirname, '/../../resources');
        // Prune older versioned assets
        if (fs.existsSync(destinationFolder + "/css")) {
            (fs.rmSync || fs.rmdirSync)(destinationFolder + '/css', {recursive: true});
        }
        if (fs.existsSync(destinationFolder + "/js")) {
            (fs.rmSync || fs.rmdirSync)(destinationFolder + '/js', {recursive: true});
        }
        await require('../utils/writing').copyDirectory(`${assetsFolder}/images/`, `${destinationFolder}/images`);

        const assets = {
            [`${assetsFolder}/css/theme-${theme}.style.css`]: [`${destinationFolder}/css/`, `theme-${theme}.style.css`],
            [`${assetsFolder}/css/theme-${theme}.print.css`]: [`${destinationFolder}/css/`, `theme-${theme}.print.css`],
            [`${assetsFolder}/js/theme-${theme}.js`]: [`${destinationFolder}/js/`, getVersionedAsset(`theme-${theme}.js`)],
        };

        Object.entries(assets).forEach(([path, [destination, fileName]]) => {
            if (fs.existsSync(path)) {
                if (!fs.existsSync(destination)) {
                    fs.mkdirSync(destination, {recursive: true});
                }
                fs.copyFileSync(path, destination + fileName);
            }
        });

        if (this.config.tryItOut?.enabled ?? true) {
            fs.copyFileSync(`${assetsFolder}/js/tryitout.js`, destinationFolder + getVersionedAsset('/js/tryitout.js'));
        }
    }

    transformMarkdownFileToHTML(filePath) {
        return this.converter.makeHtml(fs.readFileSync(filePath, 'utf8'));
    }

    getMetadata() {
        const links = [];
        if (this.config.postman.enabled ?? true) {
            links.push('<a href="collection.json">View Postman collection</a>');
        }
        if (this.config.openapi.enabled ?? false) {
            links.push('<a href="openapi.yaml">View OpenAPI spec</a>');
        }

        const auth = Object.assign({}, this.config.auth) as any;
        if (auth.in === 'bearer' || auth.in === 'basic') {
            auth.name = 'Authorization';
            auth.location = 'header';
            auth.prefix = auth.in[0].toUpperCase() + auth.in.slice(1) + ' ';
        } else {
            auth.location = auth.in;
            auth.prefix = '';
        }

        return {
            title: this.config.title,
            exampleLanguages: this.config.exampleLanguages,
            logo: this.config.logo ?? false,
            lastUpdated: getDateString(new Date),
            auth: auth,
            tryItOut: this.config.tryItOut || {enabled: true},
            links: links.concat(['<a href="http://github.com/knuckleswtf/scribe-js">Documentation powered by Scribe ✍</a>']),
        };
    }
}

export = HtmlWriter;

function getDateString(date) {
    return new Intl.DateTimeFormat('en-US', {month: 'long', 'day': 'numeric', year: 'numeric'})
        .format(date);
}

function getVersionedAsset(assetPath) {
    const index = assetPath.lastIndexOf(".");
    return assetPath.slice(0, index) + `-${process.env.SCRIBE_VERSION}` + assetPath.slice(index);
}
