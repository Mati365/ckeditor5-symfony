export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
//# sourceMappingURL=required-by.type.d.ts.map