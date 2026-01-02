export type FilterControl<T> = {
  value: T | undefined;
  set: (value: T | undefined) => void;
};
