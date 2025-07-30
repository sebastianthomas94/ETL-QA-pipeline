import { Injectable, Logger } from "@nestjs/common";
import { createR2Client, listAllObjects, copyObject } from "./s3-copy.helper";
import { EnvironmentService } from "@common/global/environment.service";

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

    constructor(private readonly environmentService: EnvironmentService) {}

    async copyAllAssets() {
        try {
            const keys = await listAllObjects(this.s3, this.sourceBucket);
            this.logger.log(`Found ${keys.length} keys in prod bucket`);

            for (const key of keys) {
                await copyObject({
                    s3: this.s3,
                    sourceBucket: this.sourceBucket,
                    destinationBucket: this.destinationBucket,
                    key,
                });
                this.logger.debug(`Copied ${key}`);
            }
        } catch (error) {
            this.logger.error(`Error copying assets: ${error.message}`);
        } finally {
            this.logger.log(`All assets copied from ${this.sourceBucket} to ${this.destinationBucket}`);
        }
    }
}
