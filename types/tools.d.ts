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
declare function debug(input: any): void;
declare function formatErrorMessageForListr(error: any): string;
declare function findServerStartCommand(): string;
declare function getFrameAtCallSite(exclude?: string[]): string;
declare function getFilePathAndLineNumberFromCallStackFrame(callStackFrame: any): {
    filePath: any;
    lineNumber: number;
};
declare function set(object: any, path: string, value: any): any;
declare function setVerbosity(state: boolean): void;
declare function isVerbose(): boolean;
declare function spoofConsoleLogForTask(task: any): void;
declare function restoreConsoleMethods(): void;
declare function checkConfigFile(config: string | object): any;
declare const _default: {
    generateConfigFile: typeof generateConfigFile;
    searchFileLazily: typeof searchFileLazily;
    info: typeof info;
    warn: typeof warn;
    success: typeof success;
    error: typeof error;
    debug: typeof debug;
    inferApiName: () => string;
    set: typeof set;
    findServerStartCommand: typeof findServerStartCommand;
    formatErrorMessageForListr: typeof formatErrorMessageForListr;
    getFrameAtCallSite: typeof getFrameAtCallSite;
    getFilePathAndLineNumberFromCallStackFrame: typeof getFilePathAndLineNumberFromCallStackFrame;
    setVerbosity: typeof setVerbosity;
    isVerbose: typeof isVerbose;
    spoofConsoleLogForTask: typeof spoofConsoleLogForTask;
    restoreConsoleMethods: typeof restoreConsoleMethods;
    checkConfigFile: typeof checkConfigFile;
};
export = _default;
