import { IDatabaseQuery } from "./interfaces";
import { ITable, ITablesToCreate, IDropTable, IFields } from './operations/interfaces'

export function runner(query: IDatabaseQuery){

    async function createControllerTables(){

        const getCreatedTablesList = await getCreatedTables()

        if(getCreatedTablesList.length == 0){
            await query(`
                CREATE TABLE db_migrations_tables(
                    id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
                    table_name VARCHAR(100) NOT NULL
                );
            `)

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

    async function getCreatedTables(): Promise<ITable[]>{

        const showAllTables = await query('show tables')
        const tablesList: string[] = []

        showAllTables.map((table : any) => tablesList.push(table[Object.keys(table)[0]]))

        if(
            tablesList.includes('db_migrations_tables')
            &&
            tablesList.includes('db_migrations_fields')
        ){
        
            const selectTables = await query(`SELECT * FROM db_migrations_tables;`)
            const tables: ITable[] = []
            
            for(let i = 0; i < selectTables.length; i++){

                const fields = await query(`
                    SELECT * FROM db_migrations_fields
                    WHERE db_migrations_tables_id = ${selectTables[i]['id']}
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

        return []
    }

    async function execDropTable(tables: IDropTable[]){
        console.info('\n> Dropping unused tables:')

        return await tables.forEach(async table => {
            console.info(`  - Drop table ${table.tableName}`)
            await query(`DELETE FROM ${table.tableName};`)
            await query(`DROP TABLE ${table.tableName};`)
        })
    }

    async function execCreateTable(tables: ITablesToCreate[]){
        console.info('\n> Creating new tables:')

        await tables.forEach(async table => {
            console.info(`  - Create table ${table.table.tableName}`)
            await query(table.command)

            const insertQuery = await query(`
                INSERT INTO db_migrations_tables(table_name)
                VALUES ('${table.table.tableName}');
            `)

            const insertId = insertQuery['insertId']

            await table.table.fields.map(async field =>{
                await query(`
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
                    )
                `)
            })

        })
    }

    async function execAlterTable(tables: ITable[]){
        console.log('\n> Compare schemas:')
    }

    return {
        createControllerTables,
        getCreatedTables,
        execDropTable,
        execCreateTable,
        execAlterTable
    }

}