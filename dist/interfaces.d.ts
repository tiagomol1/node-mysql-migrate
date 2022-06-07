import { ConnectionConfig } from "mysql";
export interface IConfig {
    db_config: ConnectionConfig;
    migrations: IMigration[];
}
export interface IMigration {
    (): void;
}
export interface IDatabaseQuery {
    (command: string): Promise<any[]>;
}
