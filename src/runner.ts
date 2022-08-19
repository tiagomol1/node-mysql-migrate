import { IDatabaseQuery, IColumns } from "./interfaces";
import { foreignKeysToCreate } from './operations/table'
import { ITable, ITablesToCreate, IDropTable, IFields, IForeignKeyCommand } from './operations/interfaces'

export function runner(query: IDatabaseQuery){

    const createTableCommands: string[] = []
    const createTableController: string[] = []
    const alterTableCommand: string[] = []
    const dropTableCommand: string[] = []
    const dropTableController: string[] = []
    const migrationsController: string[] = []
    const foreignKeysController: string[] = []

    async function createControllerTables(){

        const showAllTables = await query('show tables')
        const tablesList: string[] = []

        showAllTables.map((table : any) => {
            tablesList.push(table[Object.keys(table)[0]])
        })
        
        if(!tablesList.includes('db_migrations_tables')){
            await query(`
                CREATE TABLE db_migrations_tables(
                    id INT PRIMARY KEY NOT NULL,
                    table_name VARCHAR(100) NOT NULL
                );
            `)
        }
        if(!tablesList.includes('db_migrations_fields')){
            await query(`
                CREATE TABLE db_migrations_fields(
                    db_migrations_tables_id INT NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    type VARCHAR(30) NOT NULL,
                    pk BOOLEAN NULL,
                    fk BOOLEAN NULL,
                    fk_tableName VARCHAR(255) NULL,
                    fk_fieldName VARCHAR(255) NULL,
                    increment BOOLEAN NULL,
                    default_value VARCHAR(255) NULL,
                    isNull BOOLEAN NULL
                );
            `)

            await query(`
                ALTER TABLE db_migrations_fields ADD FOREIGN KEY (db_migrations_tables_id) 
                REFERENCES db_migrations_tables(id) ON DELETE CASCADE;
            `)
        }
    }

    async function  getCreatedTables(): Promise<ITable[]>{

        const selectTables = await query(`SELECT * FROM db_migrations_tables;`)
        const tables: ITable[] = []
        
        for(let i = 0; i < selectTables.length; i++){

            const fields = await query(`
                SELECT * FROM db_migrations_fields
                WHERE db_migrations_tables_id = ${selectTables[i]['id']};
            `)

            tables.push({
                tableName: selectTables[i]['table_name'],
                fields: fields.map((field: any): IFields => {
                    
                    const fieldsFormat: IFields = {
                        name: field['name'],
                        type: field['type'],
                        isNull: field['isNull'] ? true : false
                    }

                    if(field['increment']){ 
                        fieldsFormat.increment = true
                    }
                    if(field['pk']){ 
                        fieldsFormat.pk = true
                    }
                    if(field['default_value']){
                        fieldsFormat.default = field['default_value']
                    } 
                    if(field['fk']){
                        fieldsFormat.fk = {
                            tableName: field['fk_tableName'],
                            fieldName: field['fk_fieldName']
                        }
                    }


                    return fieldsFormat
                })
            })
        }

        return tables

    }

    function sqlConstructorDropTable(tables: IDropTable[]){
        console.info('\n> List Table to dropping:')

        return tables.forEach(async table => {
            console.info(`  - ${table.tableName}`)

            dropTableCommand.push(`
                DROP TABLE ${table.tableName};
            `)
            dropTableController.push(`
                DELETE FROM db_migrations_tables 
                WHERE table_name = '${table.tableName}';
            `)

        })
    }

    async function sqlConstructorCreateTable(tables: ITablesToCreate[]){
        console.info('\n> New Tables:')

        const selectMigrationsTable = await query(`
            SELECT MAX(id) as lastInsertId FROM db_migrations_tables;
        `)

        let insertId = selectMigrationsTable[0]['lastInsertId'] 
            ? selectMigrationsTable[0]['lastInsertId'] 
            : 0

        await tables.forEach(async table => {
            console.info(`  - ${table.table.tableName}`)
            
            insertId++
            createTableCommands.push(table.command)

            createTableController.push(`
                INSERT INTO db_migrations_tables(id, table_name)
                VALUES (${insertId}, '${table.table.tableName}');
            `)
                

            table.table.fields.map(field =>{
                createTableController.push(`
                    INSERT INTO db_migrations_fields(
                        db_migrations_tables_id,
                        name,
                        type,
                        default_value,
                        fk,
                        fk_tableName,
                        fk_fieldName,
                        increment,
                        isNull,
                        pk
                    )
                    VALUES (
                        '${insertId}',
                        '${field.name}',
                        '${field.type}',
                        ${field.default ? `'${field.default}'` : null},
                        ${field.fk ? 1 : null},
                        ${field.fk?.tableName ? `'${field.fk.tableName}'` : null},
                        ${field.fk?.fieldName ? `'${field.fk.fieldName}'` : null},
                        ${field.increment ? 1 : 0},                      
                        ${field.isNull ? 1 : 0},            
                        ${field.pk ? 1 : 0}  
                    );
                `)
            })

        })
    }

    async function runCommands(){
        console.info('\n > Running SQL commands:')

        console.info('  - Create new tables;')
        const createCommands = createTableCommands.concat(createTableController)
        for(const createCommand of createCommands){
            await query(createCommand)
        }

        console.info('  - Dropp unused tables;')
        const dropCommands = dropTableCommand.concat(dropTableController)
        for(const dropCommand of dropCommands){
            await query(dropCommand)
        }

        console.info('  - Altering altered tables')
        for(const alterTable of alterTableCommand){
            await query(alterTable)
        }

        console.info('  - Create Foreign Keys')
        foreignKeysToCreate.forEach(foreign => {
            foreignKeysController.push(foreign.command)
        })
        for(const foreignkey of foreignKeysController){
            await query(foreignkey)
        }

        console.info('  - Update Migrations Controller DB')
        for(const migrationController of migrationsController){
            await query(migrationController)
        }
    }

    async function sqlContructorAlterTableAddColumn(columns: IColumns[]){
        for(const column of columns){
            const {
                field: {
                    isNull,
                    name,
                    type,
                    fk,
                    increment,
                    pk,
                    default: default_value
                }, 
                tableName
            } = column

            const table_id = await query(`select * from db_migrations_tables where table_name = '${tableName}'`)
            migrationsController.push(`
                INSERT INTO db_migrations_fields (db_migrations_tables_id, name, type, pk, fk, fk_tableName, fk_fieldName, increment, default_value, isNull)
                VALUES ('${table_id[0].id}', '${name}', '${type}', '${pk ? 1 : 0}', ${fk ? 1 : 'NULL'}, ${fk ? `'${fk.tableName}'` : 'NULL'}, ${fk ? `'${fk.fieldName}'` : 'NULL'}, ${increment ? 1 : 0}, ${default_value ? `${default_value}`: 'NULL'}, ${isNull ? 1 : 0})
            `)        

            alterTableCommand.push(`ALTER TABLE ${tableName} ADD COLUMN ${name} ${type} ${pk ? 'PRIMARY KEY' : ''}${isNull? ' NULL': ' NOT NULL'}${increment? ' AUTO_INCREMENT' : ''}${default_value ? ` DEFAULT ${default_value.toString().includes('(') ? default_value : `'${default_value}'`}`: ''};`)
            console.log(`ALTER TABLE ${tableName} ADD COLUMN ${name} ${type} ${pk ? 'PRIMARY KEY' : ''}${isNull? ' NULL': ' NOT NULL'}${increment? ' AUTO_INCREMENT' : ''}${default_value ? ` DEFAULT ${default_value.toString().includes('(') ? default_value : `'${default_value}'`}`: ''};`)
            if(fk){
                foreignKeysController.push(`ALTER TABLE ${tableName} ADD FOREIGN KEY (${name}) REFERENCES ${fk.tableName}(${fk.fieldName});`)
            }
        }
    }

    async function sqlContructorAlterTableModifyColumn(columns: IColumns[]){
        for(const column of columns){
            const {
                field: {
                    isNull,
                    name,
                    type,
                    fk,
                    increment,
                    pk,
                    default: default_value
                }, 
                tableName
            } = column

            const table_id = await query(`select * from db_migrations_tables where table_name = '${tableName}';`)
            migrationsController.push(`
                update db_migrations_fields set type = '${type}', pk = ${pk ? 1 : 0}, 
                    fk = ${fk ? 1 : 'NULL'}, fk_tableName = ${fk ? `'${fk.tableName}'` : 'NULL'}, 
                    fk_fieldName = ${fk ? `'${fk.fieldName}'` : 'NULL'}, increment = ${increment ? 1 : 0}, 
                    default_value = ${default_value ? `'${default_value}'` : 'NULL'}, isNull = ${isNull ? 1 : 0}
                where db_migrations_tables_id = ${table_id[0].id} and name = '${name}';
            `)

            alterTableCommand.push(`ALTER TABLE ${tableName} MODIFY COLUMN ${name} ${type}${pk ? ' PRIMARY KEY' : ''}${isNull? ' NULL': ' NOT NULL'}${increment? ' AUTO_INCREMENT' : ''}${default_value ? ` DEFAULT ${default_value.toString().includes('(') ? default_value : `'${default_value}'`}`: ''};`)
            
            if(fk){
                foreignKeysController.push(`ALTER TABLE ${tableName} ADD FOREIGN KEY (${name}) REFERENCES ${fk.tableName}(${fk.fieldName});`)
            }
        }
    }

    async function sqlContructorAlterTableDropColumn(columns: IColumns[]){
        for(const column of columns){
            const {
                field: {
                    name
                }, 
                tableName
            } = column

            const table_id = await query(`select * from db_migrations_tables where table_name = '${tableName}';`)
            migrationsController.push(`delete from db_migrations_fields where db_migrations_tables_id = ${table_id[0].id} and name = '${name}';`)  
            
            alterTableCommand.push(`ALTER TABLE ${tableName} DROP COLUMN ${name};`)
        }
    }

    async function sqlConstructorForeignKeys(foreignKeys: IForeignKeyCommand[]){
        for(const foreignKey of foreignKeys){
            foreignKeysController.push(foreignKey.command)
        }
    }

    return {
        createControllerTables,
        getCreatedTables,
        sqlConstructorDropTable,
        sqlConstructorCreateTable,
        sqlContructorAlterTableAddColumn,
        sqlContructorAlterTableModifyColumn,
        sqlContructorAlterTableDropColumn,
        sqlConstructorForeignKeys,
        runCommands
    }

}