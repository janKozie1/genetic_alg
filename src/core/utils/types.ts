export type Nullable<T> = T | null | undefined;
export type Binary = string;

export type Literal = Record<string, unknown>

type ToDeepOnlyPathObject<T> = Required<T> extends Literal ? {
    [K in keyof Required<T> as `${K & string}${Required<T>[K] extends Literal ? `.${string & keyof ToDeepOnlyPathObject<Required<T>[K]>}` : ''}`]: never
  } : never;

export type DeepObjectPaths<T> = T extends Literal ? keyof ToDeepOnlyPathObject<T> : never;

export type ObjectValues<T> = T[keyof T];
