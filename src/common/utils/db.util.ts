import { MongoClient } from "mongodb";
import { Client as PgClient } from "pg";

export async function getAllMongoCollectionNames(conn: MongoClient): Promise<string[]> {
    const collections = await conn.db().listCollections().toArray();
    return collections.map((collection: { name: string }) => collection.name);
}

export async function getAllTableNames(conn: PgClient): Promise<string[]> {
    const result = await conn.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
                ORDER BY table_name
            `);
    return result.rows.map((row: { table_name: string }) => row.table_name);
}
