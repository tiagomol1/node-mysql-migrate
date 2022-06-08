import { IDatabaseQuery } from "./interfaces";
import { ITable, ITablesToCreate, IDropTable, IFields } from './operations/interfaces'

export function runner(query: IDatabaseQuery){

    const createTableCommands: string[] = []
    const createTableController: string[] = []
    const alterTableCommand: string[] = []
    const alterTableController: string[] = []
    const dropTableCommand: string[] = []
    const dropTableController: string[] = []

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
                    return {
                        name: field['name'],
                        type: field['type'],
                        default: field['default_value'],
                        fk: {
                            tableName: field['fk_tableName'],
                            fieldName: field['fk_fieldName']
                        },
                        increment: field['increment'] ? true : false,
                        isNull: field['isNull'] ? true : false,
                        pk: field['pk'] ? true : false,
                        size: field['size_int']
                    }
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
                        ${field.fk?.tableName ? `'${field.fk.tableName}'` : null},
                        ${field.fk?.fieldName ? `'${field.fk.fieldName}'` : null},
                        ${field.increment ? 1 : 0},                      
                        ${field.isNull ? 1 : 0},            
                        ${field.pk ? 1 : 0},     
                        ${field.size ? 1 : 0}     
                    );
                `)
            })

        })
    }

    async function execAlterTable(tables: ITable[]){
        console.info('\n> Compare schemas:')
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

        return
    }

    return {
        createControllerTables,
        getCreatedTables,
        sqlConstructorDropTable,
        sqlConstructorCreateTable,
        execAlterTable,
        runCommands
    }

}