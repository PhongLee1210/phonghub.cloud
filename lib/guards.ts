import cloneDeep from "lodash.clonedeep";
import lodashIsNull from "lodash.isnull";
import isPlainObject from "lodash.isplainobject";
import lodashIsString from "lodash.isstring";
import lodashIsUndefined from "lodash.isundefined";

export function isUndefined(value: unknown): value is undefined {
  return lodashIsUndefined(value);
}

export function isNull(value: unknown): value is null {
  return lodashIsNull(value);
}

export function isNil(value: unknown): value is null | undefined {
  return isUndefined(value) || isNull(value);
}

/** True only for plain objects (`{}`), not arrays, functions, or class instances. */
export function isObject(value: unknown): value is Record<string, unknown> {
  return isPlainObject(value);
}

/** True for any string value, including empty strings. */
export function isString(value: unknown): value is string {
  return lodashIsString(value);
}

/** True for strings with at least one character. */
export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.length > 0;
}

/** Deep copy via lodash `cloneDeep` (handles Dates, Maps, nested structures). */
export const cloneCopy = cloneDeep;
