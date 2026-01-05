import { ExpressionBuilder, Selection } from "kysely";

export type InferMapper<T> = T extends (
  eb: ExpressionBuilder<infer DB, infer TB>,
  ...args: infer _Args
) => ReadonlyArray<unknown>
  ? Selection<DB, TB, ReturnType<T>[number]>
  : never;
