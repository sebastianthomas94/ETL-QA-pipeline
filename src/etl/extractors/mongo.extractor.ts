import { MongoClient, FindCursor } from "mongodb";

export class MongoExtractor {
    constructor(private uri: string) {} //

    async streamCollection(collectionName: string, since: Date): Promise<FindCursor> {
        const client = await MongoClient.connect(this.uri);
        const coll = client.db().collection(collectionName);
        return coll.find({ updatedAt: { $gte: since } });
    }
}
