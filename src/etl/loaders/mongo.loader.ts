import { Transform, TransformCallback } from "stream";
import { Collection, AnyBulkWriteOperation } from "mongodb";

export class MongoLoader extends Transform {
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    private buffer: Map<string, AnyBulkWriteOperation<any>> = new Map(); // Changed to Map

    constructor(
        private readonly coll: Collection,
        private readonly batchSize = 500,
        private readonly uniqueFields: string[] = ["_id"],
    ) {
        super({ objectMode: true });
    }

    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    async _transform(doc: any, _: BufferEncoding, done: TransformCallback) {
        const filter: Record<string, unknown> = {};
        for (const field of this.uniqueFields) {
            filter[field] = doc[field];
        }

        // Create a key to track duplicates within the batch
        const key = this.uniqueFields.map((field) => `${field}:${doc[field]}`).join("|");

        // Store/overwrite with latest document (last wins)
        this.buffer.set(key, {
            updateOne: { filter, update: { $set: doc }, upsert: true },
        });

        if (this.buffer.size >= this.batchSize) {
            await this.coll.bulkWrite(Array.from(this.buffer.values()));
            this.buffer.clear();
        }
        done();
    }

    async _flush(done: TransformCallback) {
        if (this.buffer.size > 0) {
            await this.coll.bulkWrite(Array.from(this.buffer.values()));
            this.buffer.clear();
        }
        done();
    }
}
