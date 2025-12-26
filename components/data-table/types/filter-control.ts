export type FilterControl<T> = {
    value: T | null;
    set: (value: T) => void;
};
