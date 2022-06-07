"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("./database");
const runner_1 = require("./runner");
class MigrationDataSource {
    constructor({ db_config, migrations }) {
        console.info('\n> Initialize NODE-MYSQL-MIGRATION.\n');
        const connection = database_1.database(db_config);
        this.connectionQuery = connection.query;
        this.run(migrations);
    }
    async run(migrations) {
        migrations.map(migration => migration());
        await runner_1.runner(this.connectionQuery);
    }
}
exports.default = MigrationDataSource;
