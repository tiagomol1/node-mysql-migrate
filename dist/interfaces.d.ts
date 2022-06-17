import { ConnectionConfig } from "mysql";
import { IFields } from "./operations/interfaces";
export interface IConfig {
    db_config: ConnectionConfig;
    migrations: IMigration[];
}
export interface IMigration {
    (): void;
}
export interface IDatabaseQuery {
    (command: string): Promise<any>;
}
export interface IColumns {
    field: IFields;
    tableName: string;
}
