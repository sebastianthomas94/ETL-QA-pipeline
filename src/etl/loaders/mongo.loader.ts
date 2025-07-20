import { Transform, TransformCallback } from "stream";
import { Collection, AnyBulkWriteOperation } from "mongodb";

export class MongoLoader extends Transform {
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    private buffer: AnyBulkWriteOperation<any>[] = [];

    constructor(
        private coll: Collection,
        private batchSize = 500,
    ) {
        super({ objectMode: true });
    }

    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    async _transform(doc: any, _: BufferEncoding, done: TransformCallback) {
        this.buffer.push({
            updateOne: { filter: { _id: doc._id }, update: { $set: doc }, upsert: true },
        });
        if (this.buffer.length >= this.batchSize) {
            await this.executeBulkWrite(this.buffer);

            this.buffer = [];
        }
        done();
    }

    async _flush(done: TransformCallback) {
        if (this.buffer.length) {
            await this.executeBulkWrite(this.buffer);
        }
        done();
    }

    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async executeBulkWrite(buffer: AnyBulkWriteOperation<any>[]) {
        try {
            await this.coll.bulkWrite(buffer);
        } catch (error) {
            console.error("Error executing bulk write:", error);
        }
    }
}
