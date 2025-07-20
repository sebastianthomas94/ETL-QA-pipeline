import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { pipeline } from "stream/promises";
import { MongoExtractor } from "./extractors/mongo.extractor";
import { PgExtractor } from "./extractors/pg.extractor";
import { MaskTransform } from "./transforms/mask.transform";
import { MongoLoader } from "./loaders/mongo.loader";
import { PgLoader } from "./loaders/pg.loader";
import { LastRunStore } from "../common/last-run.store";
import { MongoClient } from "mongodb";
import { Client as PgClient } from "pg";
import { EnvironmentService } from "@common/global/environment.service";
import { getAllMongoCollectionNames, getAllTableNames } from "@common/utils/db.util";

@Injectable()
export class EtlService implements OnApplicationBootstrap {
    private readonly logger = new Logger(EtlService.name);

    constructor(
        private readonly lastRun: LastRunStore,
        private readonly mongoExt: MongoExtractor,
        private readonly pgExt: PgExtractor,
        private readonly environmentService: EnvironmentService,
    ) {}

    async onApplicationBootstrap() {
        this.logger.log("Starting ETL pipeline...");
        await this.run();
    }

    async run() {
        const now = new Date();

        const mongoCollectionNames = this.environmentService.mongoCollectionNames;
        const pgTableNames = this.environmentService.pgTableNames;

        try {
            if (mongoCollectionNames.length === 0) {
                this.logger.warn("No MongoDB collection names configured, fetching from PRODUCTION environment...");
                const conn = await MongoClient.connect(this.environmentService.productionMongo.uri);
                mongoCollectionNames.push(...(await getAllMongoCollectionNames(conn)));
                await conn.close();
            }
            this.logger.log(`MongoDB collections to sync: ${mongoCollectionNames.join(", ")}`);
            if (pgTableNames.length === 0) {
                this.logger.warn("No PostgreSQL table names configured, fetching from PRODUCTION environment...");
                const conn = new PgClient(this.environmentService.productionPostgres);
                await conn.connect();
                pgTableNames.push(...(await getAllTableNames(conn)));
                await conn.end();
            }
            this.logger.log(`PostgreSQL tables to sync: ${pgTableNames.join(", ")}`);

            for (const collName of mongoCollectionNames) {
                await this.syncMongo(collName);
                this.lastRun.set(`mongo-${collName}`, now);
            }
            for (const tableName of pgTableNames) {
                await this.syncPg(tableName);
                this.lastRun.set(`pg-${tableName}`, now);
            }
            this.logger.log("ETL pipeline completed successfully");
        } catch (error) {
            this.logger.error("ETL pipeline failed:", error);
            throw error;
        }
    }

    private async syncMongo(collName: string) {
        const since = this.lastRun.get(`mongo-${collName}`);
        this.logger.log(`Syncing MongoDB collection '${collName}' since ${since.toISOString()}`);

        let client: MongoClient | null = null;
        try {
            client = await MongoClient.connect(this.environmentService.qaMongo.uri);

            // Ensure collection exists
            const collections = await client.db().listCollections({ name: collName }).toArray();
            if (collections.length === 0) {
                this.logger.log(`Creating collection '${collName}' in QA database`);
                await client.db().createCollection(collName);
            }

            const indexes = await client.db().collection(collName).indexes();
            console.log(`Indexes for collection '${collName}':`, indexes);
            const uniqueIndex = indexes.find((idx) => idx.unique && idx.name !== "_id_");
            const uniqueIndexKeys = uniqueIndex ? [...Object.keys(uniqueIndex.key), "_id"] : ["_id"];
            console.log(`Unique index keys for collection '${collName}':`, uniqueIndexKeys);

            const loader = new MongoLoader(client.db().collection(collName), 500, uniqueIndexKeys);
            const cursor = await this.mongoExt.streamCollection(collName, since);

            // Convert cursor to stream
            const cursorStream = cursor.stream();
            await pipeline(cursorStream, new MaskTransform(), loader);
            this.logger.log(`MongoDB collection '${collName}' sync completed`);
        } finally {
            if (client) {
                await client.close();
            }
        }
    }

    private async syncPg(table: string) {
        const since = this.lastRun.get(`pg-${table}`);
        this.logger.log(`Syncing PostgreSQL table '${table}' since ${since.toISOString()}`);

        let prodClient: PgClient | null = null;
        let qaClient: PgClient | null = null;

        try {
            prodClient = new PgClient(this.environmentService.productionPostgres);
            qaClient = new PgClient(this.environmentService.qaPostgres);

            await prodClient.connect();
            await qaClient.connect();

            const stream = await this.pgExt.streamTable(table, since);
            const loader = new PgLoader(qaClient, table);

            await pipeline(stream, new MaskTransform(), loader);
            this.logger.log(`PostgreSQL table '${table}' sync completed`);
        } finally {
            if (prodClient) {
                await prodClient.end();
            }
            if (qaClient) {
                await qaClient.end();
            }
        }
    }
}
