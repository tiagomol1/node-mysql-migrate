import { IDatabaseQuery, IColumns } from "./interfaces";
import { ITable, ITablesToCreate, IDropTable, IFields } from './operations/interfaces'

export function runner(query: IDatabaseQuery){

    const createTableCommands: string[] = []
    const createTableController: string[] = []
    const alterTableCommand: string[] = []
    const dropTableCommand: string[] = []
    const dropTableController: string[] = []
    const migrationsController: string[] = []
    const foreignKeys: string[] = []

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
                    size_int int NULL,
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
                    if(field['size_int']){
                        fieldsFormat.size = field['size_int']
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
                        pk,
                        size_int
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
                        ${field.pk ? 1 : 0},     
                        ${field.size ? field.size : 0}     
                    );
                `)
            })

        })
    }

    async function runCommands(){
        console.info('\n > Running SQL commands:')

        console.info('  - Create new tables;')
        const createCommands = createTableCommands.concat(createTableController)
        for(let i = 0; i < createCommands.length; i++){
            await query(createCommands[i])
        }

        console.info('  - Dropp unused tables;')
        const dropCommands = dropTableCommand.concat(dropTableController)
        for(let i = 0; i < dropCommands.length; i++){
            await query(dropCommands[i])
        }

        console.info('  - Altering altered tables')
        for(let i = 0; i < alterTableCommand.length; i++){
            await query(alterTableCommand[i])
        }

        console.info('  - Update Migrations Controller DB')
        for(let i = 0; i < migrationsController.length; i++){
            await query(migrationsController[i])
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
                    size,
                    default: default_value
                }, 
                tableName
            } = column

            const table_id = await query(`select * from db_migrations_tables where table_name = '${tableName}'`)
            migrationsController.push(`
                INSERT INTO db_migrations_fields (db_migrations_tables_id, name, type, pk, fk, fk_tableName, fk_fieldName, increment, default_value, size_int, isNull)
                VALUES ('${table_id[0].id}', '${name}', '${type}', '${pk ? 1 : 0}', ${fk ? 1 : 'NULL'}, ${fk ? `'${fk.tableName}'` : 'NULL'}, ${fk ? `'${fk.fieldName}'` : 'NULL'}, ${increment ? 1 : 0}, ${default_value ? `${default_value}`: 'NULL'}, ${size ? size : 0}, ${isNull ? 1 : 0})
            `)        

            alterTableCommand.push(`ALTER TABLE ${tableName} ADD COLUMN ${name} ${type}${size? `(${size})` : ''}${pk ? ' PRIMARY KEY' : ''}${isNull? ' NULL': ' NOT NULL'}${increment? ' AUTO_INCREMENT' : ''}${default_value ? ` DEFAULT '${default_value}'`: ''};`)
            if(fk){
                foreignKeys.push(`ALTER TABLE ${tableName} ADD FOREIGN KEY (${name}) REFERENCES ${fk.tableName}(${fk.fieldName});`)
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
                    size,
                    default: default_value
                }, 
                tableName
            } = column

            const table_id = await query(`select * from db_migrations_tables where table_name = '${tableName}';`)
            migrationsController.push(`
                update db_migrations_fields set type = '${type}', pk = ${pk ? 1 : 0}, 
                    fk = ${fk ? 1 : 'NULL'}, fk_tableName = ${fk ? `'${fk.tableName}'` : 'NULL'}, 
                    fk_fieldName = ${fk ? `'${fk.fieldName}'` : 'NULL'}, increment = ${increment ? 1 : 0}, 
                    default_value = ${default_value ? `'${default_value}'` : 'NULL'}, 
                    size_int = ${size ? size : 0}, isNull = ${isNull ? 1 : 0}
                where db_migrations_tables_id = ${table_id[0].id} and name = '${name}';
            `)

            alterTableCommand.push(`ALTER TABLE ${tableName} MODIFY COLUMN ${name} ${type}${size? `(${size})` : ''}${pk ? ' PRIMARY KEY' : ''}${isNull? ' NULL': ' NOT NULL'}${increment? ' AUTO_INCREMENT' : ''}${default_value ? ` DEFAULT '${default_value}'`: ''};`)
            
            if(fk){
                foreignKeys.push(`ALTER TABLE ${tableName} ADD FOREIGN KEY (${name}) REFERENCES ${fk.tableName}(${fk.fieldName});`)
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

    return {
        createControllerTables,
        getCreatedTables,
        sqlConstructorDropTable,
        sqlConstructorCreateTable,
        sqlContructorAlterTableAddColumn,
        sqlContructorAlterTableModifyColumn,
        sqlContructorAlterTableDropColumn,
        runCommands
    }

}