/**
 * Filters the values of an object based on a provided filter function.
 *
 * @param obj The object to filter.
 * @param filter The filter function that determines whether a value should be included.
 * @returns A new object containing only the key-value pairs that passed the filter.
 */
export declare function filterObjectValues<T>(obj: Record<string, T>, filter: (value: T, key: string) => boolean): Record<string, T>;
//# sourceMappingURL=filter-object-values.d.ts.map