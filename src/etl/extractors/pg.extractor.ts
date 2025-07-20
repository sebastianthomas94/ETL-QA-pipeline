import { IPgConfig } from "@common/interfaces/db.interface";
import { Client } from "pg";
import QueryStream from "pg-query-stream";

export class PgExtractor {
    constructor(private readonly pgConfig: IPgConfig) {}

    async streamTable(table: string, since: Date) {
        const client = new Client(this.pgConfig);
        await client.connect();

        const columnCheck = await client.query(
            `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = 'updated_at'
      `,
            [table],
        );
        let sql: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let params: any[];

        if (columnCheck.rows.length > 0) {
            // Table has updated_at column
            sql = `SELECT * FROM ${table} WHERE updated_at >= $1 ORDER BY updated_at`;
            params = [since];
        } else {
            // Table doesn't have updated_at, get all records
            console.warn(`Table ${table} doesn't have updated_at column, fetching all records`);
            sql = `SELECT * FROM ${table}`;
            params = [];
        }
        const stream = client.query(new QueryStream(sql, params));

        // Close connection when stream ends
        stream.on("end", () => client.end());
        stream.on("error", () => client.end());

        return stream;
    }
}
