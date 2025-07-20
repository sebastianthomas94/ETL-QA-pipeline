import { Transform, TransformCallback } from "stream";
import { Collection, AnyBulkWriteOperation } from "mongodb";

export class MongoLoader extends Transform {
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    private buffer: AnyBulkWriteOperation<any>[] = [];

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

        this.buffer.push({
            updateOne: { filter, update: { $set: doc }, upsert: true },
        });

        if (this.buffer.length >= this.batchSize) {
            await this.coll.bulkWrite(this.buffer);
            this.buffer = [];
        }
        done();
    }

    async _flush(done: TransformCallback) {
        if (this.buffer.length) {
            await this.coll.bulkWrite(this.buffer);
        }
        done();
    }
}
