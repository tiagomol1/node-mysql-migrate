import { IConfig, IMigration } from './interfaces'
import { database } from './database'
import { migrationController } from './controller'

class MigrationDataSource{

    private connectionQuery : (command: string) => Promise<any>

    constructor({ db_config, migrations }: IConfig){
        console.info('\n> Initialize NODE-MYSQL-MIGRATION.\n')
        const connection = database(db_config)
        this.connectionQuery = connection.query
        this.run(migrations)
    }

    private async run(migrations: IMigration[]){
        migrations.map(migration => migration())
        await migrationController(this.connectionQuery)
        return
    } 

}

export default MigrationDataSource
