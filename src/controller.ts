import { tablesToCreate, foreignKeysToCreate } from './operations/index'
import { ITable, ITablesToCreate, IDropTable, IForeignKeyCommand } from './operations/interfaces'
import { IDatabaseQuery } from './interfaces'
import { runner } from './runner'

export async function migrationController(query: IDatabaseQuery){

    const exec = await runner(query)
    await exec.createControllerTables()
    const dbCreatedTables = await exec.getCreatedTables()
    
    const {
        pendingTablesToCreate,
        pendingTablesToDrop,
        createdTablesToVerify
    } = identifyTables(dbCreatedTables)

    const {
        pendingForeignKeysToCreate,
        pendingForeignKeysToRemove,
        pendingForeignKeysToUpdate
    } = identifyForeignKeys(
        pendingTablesToCreate,
        createdTablesToVerify
    )

    if(pendingTablesToDrop.length > 0){
        await exec.sqlConstructorDropTable(pendingTablesToDrop)
    }
    if(pendingTablesToCreate.length > 0){
        await exec.sqlConstructorCreateTable(pendingTablesToCreate)
    }
    if(createdTablesToVerify.length > 0){
        compareTables(createdTablesToVerify, dbCreatedTables)
    }

    return await exec.runCommands()

}

function identifyTables(tables: ITable[]){
    console.info('\n> Checking created, dropped and altered tables.')

    const createdTables: string[] = []

    tables.map(table => {
        createdTables.push(table.tableName)
    })

    const pendingTablesToCreate: ITablesToCreate[] = []
    const pendingTablesToDrop: IDropTable[] = []
    const createdTablesToVerify: ITable[] = []

    tablesToCreate.map((table) => {
        if(createdTables.includes(table.table.tableName)){
            return createdTablesToVerify.push(table.table)
        }else{
            return pendingTablesToCreate.push(table)
        }
    })    

    createdTables.map(table => {
        const exists = tablesToCreate.filter(tableCreate => {
            return tableCreate.table.tableName === table
        })
        if(exists.length == 0){
            return pendingTablesToDrop.push({ tableName: table })
        }
    })

    return {
        pendingTablesToCreate,
        pendingTablesToDrop,
        createdTablesToVerify
    }

}

function identifyForeignKeys(
    pendingTablesToCreate: ITablesToCreate[],
    createdTablesToVerify: ITable[],
){
    
    const pendingForeignKeysToCreate : IForeignKeyCommand[] = []
    const pendingForeignKeysToRemove : IForeignKeyCommand[] = []
    const pendingForeignKeysToUpdate : IForeignKeyCommand[] = []
    foreignToCreate()
    foreignToUpdate()
    ForeignToRemove()
    
    function foreignToCreate() {

    }

    function foreignToUpdate() {

    }

    function ForeignToRemove() {

    }

    return {
        pendingForeignKeysToCreate,
        pendingForeignKeysToRemove,
        pendingForeignKeysToUpdate
    }

}

function compareTables(tables: ITable[], createdTables: ITable[]){
    console.log('NEW',tables[0].fields)
    console.log('OLD',createdTables[0].fields)
}