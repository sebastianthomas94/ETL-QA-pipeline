import { Injectable, Logger } from "@nestjs/common";
import { createR2Client, copyObject, listAllObjectsWithMetadata } from "./s3-copy.helper";
import { EnvironmentService } from "@common/global/environment.service";
import { LastRunStore } from "@common/last-run.store";

@Injectable()
export class R2CopyService {
    private readonly s3 = createR2Client({
        accessKeyId: this.environmentService.r2Buckets.accessKeyId,
        secretAccessKey: this.environmentService.r2Buckets.secretAccessKey,
        endpoint: this.environmentService.r2Buckets.endpoint,
    });
    private readonly sourceBucket = this.environmentService.r2Buckets.sourceBucket;
    private readonly destinationBucket = this.environmentService.r2Buckets.destinationBucket;
    private readonly logger = new Logger(R2CopyService.name);

    constructor(
        private readonly environmentService: EnvironmentService,
        private readonly lastRunStore: LastRunStore,
    ) {}

    async copyAllAssets() {
        let isError: boolean = false;
        const lastRunKey = `copy-${this.sourceBucket}-to-${this.destinationBucket}`;
        const lastCopiedAt = this.lastRunStore.get(lastRunKey);
        try {
            const keys = await listAllObjectsWithMetadata(this.s3, this.sourceBucket);
            this.logger.log(`Found ${keys.length} keys in prod bucket`);

            for (const key of keys) {
                const { Key, LastModified } = key;

                if (LastModified <= lastCopiedAt) {
                    this.logger.debug(`Skipping unchanged object: ${Key}`);
                    continue;
                }

                await copyObject({
                    s3: this.s3,
                    sourceBucket: this.sourceBucket,
                    destinationBucket: this.destinationBucket,
                    key: Key,
                });
                this.logger.debug(`Copied ${key.Key} from ${this.sourceBucket} to ${this.destinationBucket}`);
            }
        } catch (error) {
            this.logger.error(`Error copying assets: ${error.message}`);

            isError = true;
        } finally {
            if (isError) {
                this.logger.error(`Failed to copy all assets from ${this.sourceBucket} to ${this.destinationBucket}`);
            } else {
                this.logger.log(`All assets copied from ${this.sourceBucket} to ${this.destinationBucket}`);
            }
        }
    }
}
