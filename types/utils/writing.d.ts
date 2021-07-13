declare function renderEjsTemplate(key: string, data: Record<string, any>): Promise<string>;
declare function copyDirectory(sourceDir: string, destDir: string): Promise<any>;
declare const _default: {
    renderEjsTemplate: typeof renderEjsTemplate;
    copyDirectory: typeof copyDirectory;
};
export = _default;
