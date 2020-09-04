import { scribe } from "../../typedefs/core";
declare function getParameterExample(type?: string, regex?: string): any;
declare function castValueToType(value: any, type?: string): any;
/**
 * Generates the "cleanXParameters" object from XParameters by removing optional parameters without values
 * and flattening the object to {}parameter name: parameter example} format
 * Also combines object field parameters into one. For instance, if there's a `details` field with type "object",
 * and `details.name` and `details.age` fields, this will return {details: {name: <value>, age: <value>}}
 * @param parameters
 */
declare function removeEmptyOptionalParametersAndTransformToKeyExample(parameters?: scribe.ParameterBag): {};
declare function gettype(value: any): "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function" | "null" | "integer" | "array";
declare function normalizeTypeName(typeName: string): string;
declare function isArrayType(typeName: string): boolean;
/**
 * Array type = int[], object[]
 * @param typeName
 */
declare function getBaseTypeFromArrayType(typeName: string): string;
declare const _default: {
    getParameterExample: typeof getParameterExample;
    removeEmptyOptionalParametersAndTransformToKeyExample: typeof removeEmptyOptionalParametersAndTransformToKeyExample;
    castValueToType: typeof castValueToType;
    gettype: typeof gettype;
    normalizeTypeName: typeof normalizeTypeName;
    isArrayType: typeof isArrayType;
    getBaseTypeFromArrayType: typeof getBaseTypeFromArrayType;
};
export = _default;
