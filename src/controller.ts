import { tablesToCreate } from './operations/index'
import { ITable, ITablesToCreate, IDropTable } from './operations/interfaces'
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
    } = verifyTables(dbCreatedTables)

    if(pendingTablesToDrop.length > 0){
        await exec.execDropTable(pendingTablesToDrop)
    }
    if(pendingTablesToCreate.length > 0){
        await exec.execCreateTable(pendingTablesToCreate)
    }
    if(createdTablesToVerify.length > 0){
        compareTables(createdTablesToVerify, dbCreatedTables)
    }

}

function verifyTables(tables: ITable[]){
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

function compareTables(tables: ITable[], createdTables: ITable[]){

    

}