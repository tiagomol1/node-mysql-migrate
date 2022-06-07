import { ConnectionConfig } from "mysql";
export interface IConfig {
    db_config: ConnectionConfig;
    migrations: any[];
}
