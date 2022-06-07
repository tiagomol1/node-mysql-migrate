import { ConnectionConfig } from "mysql";
export declare function database(db_config: ConnectionConfig): {
    query: (command: string) => Promise<unknown>;
};
