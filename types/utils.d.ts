import { scribe } from "../typedefs/core";
declare function isPortTaken(host: any): Promise<unknown>;
declare function getParameterExample(type?: string, regex?: string): any;
declare function removeEmptyOptionalParametersAndTransformToKeyValue(parameters?: scribe.ParameterBag): {};
declare const _default: {
    isPortTaken: typeof isPortTaken;
    getParameterExample: typeof getParameterExample;
    removeEmptyOptionalParametersAndTransformToKeyValue: typeof removeEmptyOptionalParametersAndTransformToKeyValue;
};
export = _default;
