declare function generateConfigFile(configFilePath: any, values: any, options?: {
    silent: boolean;
}): void;
/**
 * Find first line where a string or regex occurs in a file, without reading the entire file
 * @param filePath
 * @param content
 */
declare function searchFileLazily(filePath: any, content: any): Promise<number | false>;
declare function info(input: any): void;
declare function warn(input: any): void;
declare function success(input: any): void;
declare function error(input: any): void;
declare const _default: {
    generateConfigFile: typeof generateConfigFile;
    searchFileLazily: typeof searchFileLazily;
    info: typeof info;
    warn: typeof warn;
    success: typeof success;
    error: typeof error;
};
export = _default;
