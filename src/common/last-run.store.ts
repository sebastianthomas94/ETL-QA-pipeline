import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { MongoClient, Collection, Db } from "mongodb";
import { EnvironmentService } from "@common/global/environment.service";
import { ILastRunDocument } from "@common/interfaces/last-run.interface";

@Injectable()
export class LastRunStore implements OnModuleInit {
    private readonly logger = new Logger(LastRunStore.name);
    private readonly COLLECTION_NAME = "etl-last-run";
    private client: MongoClient | null = null;
    private db: Db | null = null;
    private collection: Collection<ILastRunDocument> | null = null;
    private readonly timestampCache = new Map<string, Date>();

    constructor(private readonly environmentService: EnvironmentService) {}

    async onModuleInit() {
        try {
            this.logger.log("Initializing LastRunStore with MongoDB persistence...");

            // Connect to QA MongoDB where we'll store the tracking data
            this.client = await MongoClient.connect(this.environmentService.qaMongo.uri);
            this.db = this.client.db("etl-last-run");
            this.collection = this.db.collection<ILastRunDocument>(this.COLLECTION_NAME);

            // Create unique index on key field to prevent duplicates
            await this.collection.createIndex({ key: 1 }, { unique: true });
            this.logger.log(`Created unique index on '${this.COLLECTION_NAME}.key'`);

            // Load all existing timestamps into cache for fast access
            await this.loadTimestampsIntoCache();

            this.logger.log("LastRunStore initialized successfully");
        } catch (error) {
            this.logger.error("Failed to initialize LastRunStore:", error);
            throw error;
        }
    }

    private async loadTimestampsIntoCache(): Promise<void> {
        if (!this.collection) {
            throw new Error("Collection not initialized");
        }

        const documents = await this.collection.find({}).toArray();
        for (const doc of documents) {
            this.timestampCache.set(doc.key, doc.timestamp);
        }

        this.logger.log(`Loaded ${documents.length} timestamp records into cache`);
    }

    /**
     * Get the last run timestamp for a given key.
     * Returns epoch (1970-01-01) if no record exists.
     */
    get(key: string): Date {
        const cached = this.timestampCache.get(key);
        if (cached) {
            this.logger.debug(`Cache hit for key '${key}': ${cached.toISOString()}`);
            return cached;
        }

        this.logger.debug(`No timestamp found for key '${key}', returning epoch`);
        return new Date(0);
    }

    /**
     * Get all last run timestamps.
     * Returns array of all timestamp records.
     */
    async getAll(): Promise<ILastRunDocument[]> {
        if (!this.collection) {
            throw new Error("Collection not initialized");
        }

        const documents = await this.collection.find({}).sort({ updatedAt: -1 }).toArray();
        return documents;
    }

    /**
     * Set/update the last run timestamp for a given key.
     * Persists to MongoDB and updates cache.
     */
    async set(key: string, ts: Date): Promise<void> {
        if (!this.collection) {
            this.logger.error("Collection not initialized, cannot persist timestamp");
            throw new Error("Collection not initialized");
        }

        try {
            const now = new Date();

            // Upsert: update if exists, insert if not
            await this.collection.updateOne(
                { key },
                {
                    $set: {
                        key,
                        timestamp: ts,
                        updatedAt: now,
                    },
                },
                { upsert: true },
            );

            // Update cache
            this.timestampCache.set(key, ts);

            this.logger.debug(`Persisted timestamp for key '${key}': ${ts.toISOString()}`);
        } catch (error) {
            this.logger.error(`Failed to persist timestamp for key '${key}':`, error);
            throw error;
        }
    }

    /**
     * Cleanup: close MongoDB connection when module is destroyed
     */
    async onModuleDestroy() {
        if (this.client) {
            await this.client.close();
            this.logger.log("MongoDB connection closed");
        }
    }
}
