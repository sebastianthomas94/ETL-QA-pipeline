import { Transform, TransformCallback } from "stream";
import { Client } from "pg";
import format from "pg-format";

export class PgLoader extends Transform {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private buffer: any[] = [];
    private primaryKey: string | null = null;
    private tableExists: boolean | null = null;

    constructor(
        private client: Client,
        private table: string,
        private batchSize = 500,
    ) {
        super({ objectMode: true });
    }
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async ensureTableExists(sampleRow: any): Promise<void> {
        if (this.tableExists !== null) return;

        // Check if table exists (case-sensitive)
        const tableCheck = await this.client.query(
            `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = $1 AND table_schema = 'public'
    `,
            [this.table],
        );

        if (tableCheck.rows.length === 0) {
            console.log(`Table ${this.table} doesn't exist, creating it...`);
            await this.createTable(sampleRow);
        }

        this.tableExists = true;
    }
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async createTable(sampleRow: any): Promise<void> {
        const columns = Object.keys(sampleRow).map((key) => {
            const value = sampleRow[key];
            let type = "TEXT"; // Default type

            if (typeof value === "number") {
                type = Number.isInteger(value) ? "INTEGER" : "NUMERIC";
            } else if (typeof value === "boolean") {
                type = "BOOLEAN";
            } else if (value instanceof Date) {
                type = "TIMESTAMP";
            } else if (typeof value === "object" && value !== null) {
                type = "JSONB";
            }

            // Quote column names to preserve case
            return `"${key}" ${type}`;
        });

        // Quote table name to preserve case
        const query = `CREATE TABLE IF NOT EXISTS "${this.table}" (${columns.join(", ")})`;
        await this.client.query(query);
        console.log(`✅ Created table ${this.table}`);
    }

    private async getPrimaryKey(): Promise<string | null> {
        if (this.primaryKey !== null) return this.primaryKey;

        const result = await this.client.query(
            `
      SELECT column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_name = $1
        AND tc.table_schema = 'public'
      ORDER BY kcu.ordinal_position
      LIMIT 1
    `,
            [this.table],
        );

        this.primaryKey = result.rows.length > 0 ? result.rows[0].column_name : "";
        return this.primaryKey;
    }

    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    async _transform(row: any, _: BufferEncoding, done: TransformCallback) {
        if (this.tableExists === null) {
            await this.ensureTableExists(row);
        }

        this.buffer.push(row);
        if (this.buffer.length >= this.batchSize) {
            await this.upsertBatch();
            this.buffer = [];
        }
        done();
    }

    private async upsertBatch() {
        const primaryKey = await this.getPrimaryKey();
        const cols = Object.keys(this.buffer[0]);
        const values = this.buffer.map((r) => cols.map((c) => r[c]));

        let query: string;

        if (primaryKey && cols.includes(primaryKey)) {
            // Has primary key - use UPSERT with quoted identifiers
            query = format(
                `INSERT INTO %I (%I) VALUES %L ON CONFLICT (%I) DO UPDATE SET %s`,
                this.table,
                cols,
                values,
                primaryKey,
                cols
                    .filter((c) => c !== primaryKey)
                    .map((c) => `"${c}" = EXCLUDED."${c}"`)
                    .join(", "),
            );
        } else {
            // No primary key - use INSERT only with quoted identifiers
            console.warn(`Table ${this.table} has no primary key, using INSERT only`);
            query = format(`INSERT INTO %I (%I) VALUES %L`, this.table, cols, values);
        }

        await this.client.query(query);
    }

    async _flush(done: TransformCallback) {
        if (this.buffer.length) await this.upsertBatch();
        done();
    }
}
