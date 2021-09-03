import { scribe } from "../../typedefs/core";
declare function getParameterExample(type?: keyof scribe.ParameterTypes, regex?: string): any;
declare function castValueToType(value: any, type?: string): any;
/**
 * This method prepares and simplifies request parameters for use in example requests and response calls.
 * It takes in an array with rich details about a parameter eg
 *   {age: {
 *     description: 'The age',
 *     example: 12,
 *     required: false,
 *   }}
 * And transforms them into key-example pairs : {age: 12}
 * It also filters out parameters which have null values and have 'required' as false.
 * It converts all file params that have string examples to actual files (instances of TestingFile).
 * It also generates a full example for object parameters (and array of objects) using the fields. For instance, if there's a `details` field with type "object",
 * and `details.name` and `details.age` fields, this will return {details: {name: <value>, age: <value>}}
 */
declare function cleanParams(parameters?: scribe.ParameterBag): {};
declare function normalizeTypeName(typeName: string): string;
declare function isArrayType(typeName: string): boolean;
declare function getBaseType(typeName: string): string;
/**
 * Array type = int[], object[]
 * @param typeName
 */
declare function getBaseTypeFromArrayType(typeName: string): string;
declare function prettyPrintResponseIfJson(content: string): string;
declare function inferParameterDescription(uri: any, parameterName: any): string;
declare const _default: {
    getBaseType: typeof getBaseType;
    getParameterExample: typeof getParameterExample;
    cleanParams: typeof cleanParams;
    castValueToType: typeof castValueToType;
    normalizeTypeName: typeof normalizeTypeName;
    isArrayType: typeof isArrayType;
    getBaseTypeFromArrayType: typeof getBaseTypeFromArrayType;
    prettyPrintResponseIfJson: typeof prettyPrintResponseIfJson;
    inferParameterDescription: typeof inferParameterDescription;
};
export = _default;
