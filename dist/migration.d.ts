import { IConfig } from './interfaces';
declare class MigrationDataSource {
    private connectionQuery;
    constructor({ db_config, migrations }: IConfig);
    private run;
}
export default MigrationDataSource;
