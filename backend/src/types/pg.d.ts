declare module "pg" {
  export interface QueryResult<T = Record<string, unknown>> {
    rows: T[];
  }

  export interface PoolClient {
    query<T = Record<string, unknown>>(
      text: string,
      values?: unknown[],
    ): Promise<QueryResult<T>>;
    release(): void;
  }

  export class Pool {
    constructor(config?: Record<string, unknown>);
    query<T = Record<string, unknown>>(
      text: string,
      values?: unknown[],
    ): Promise<QueryResult<T>>;
    connect(): Promise<PoolClient>;
    end(): Promise<void>;
  }
}
