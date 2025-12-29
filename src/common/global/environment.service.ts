import { IMongoConfig, IPgConfig } from "@common/interfaces/db.interface";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class EnvironmentService {
    constructor(private readonly configService: ConfigService) {}

    get isDevelopment() {
        return this.configService.get("NODE_ENV", { infer: true }) === "development";
    }

    get isProduction() {
        return this.configService.get("NODE_ENV", { infer: true }) === "production";
    }

    get server() {
        return {
            port: this.configService.get("PORT", { infer: true })!,
        };
    }

    get mongoCollectionNames(): {
        collectionNames: string[];
        transformerCollectionNames: string[];
    } {
        return {
            collectionNames: this.configService.get("MONGO_COLLECTION_NAMES", { infer: true }) || [],
            transformerCollectionNames: this.configService.get("TRANSFORMER_COLLECTION_NAMES", { infer: true }) || [],
        };
    }

    get pgTableNames(): {
        tableNames: string[];
        transformerTableNames: string[];
    } {
        return {
            tableNames: this.configService.get("PG_TABLE_NAMES", { infer: true }) || [],
            transformerTableNames: this.configService.get("TRANSFORMER_TABLE_NAMES", { infer: true }) || [],
        };
    }

    get productionMongo(): IMongoConfig {
        return {
            uri: this.configService.get<string>("PROD_MONGO_URI")!,
        };
    }

    get productionPostgres(): IPgConfig {
        const sslCa = this.isProduction ? this.configService.get<string>("PROD_PG_SSL_CA") : undefined;
        return {
            host: this.configService.get("PROD_PG_HOST", { infer: true })!,
            port: this.configService.get("PROD_PG_PORT", { infer: true })!,
            database: this.configService.get("PROD_PG_DB", { infer: true })!,
            user: this.configService.get("PROD_PG_USER", { infer: true })!,
            password: this.configService.get("PROD_PG_PASS", { infer: true })!,
            ssl: sslCa
                ? {
                      ca: Buffer.from(sslCa, "base64").toString("utf-8"),
                  }
                : undefined,
        };
    }

    get qaMongo(): IMongoConfig {
        return {
            uri: this.configService.get<string>("QA_MONGO_URI")!,
        };
    }

    get qaPostgres(): IPgConfig {
        const sslCa = this.isProduction ? this.configService.get<string>("QA_PG_SSL_CA") : undefined;
        return {
            host: this.configService.get("QA_PG_HOST", { infer: true })!,
            port: this.configService.get("QA_PG_PORT", { infer: true })!,
            database: this.configService.get("QA_PG_DB", { infer: true })!,
            user: this.configService.get("QA_PG_USER", { infer: true })!,
            password: this.configService.get("QA_PG_PASS", { infer: true })!,
            ssl: sslCa
                ? {
                      ca: Buffer.from(sslCa, "base64").toString("utf-8"),
                  }
                : undefined,
        };
    }

    get r2Buckets(): {
        assetsSourceBucket: string;
        assetsDestinationBucket: string;
        resourceSourceBucket: string;
        resourceDestinationBucket: string;
        accessKeyId: string;
        secretAccessKey: string;
        endpoint: string;
    } {
        return {
            assetsSourceBucket: this.configService.get("R2_PROD_BUCKET", { infer: true })!,
            assetsDestinationBucket: this.configService.get("R2_QA_BUCKET", { infer: true })!,
            resourceSourceBucket: this.configService.get("R2_PROD_PRIVATE_BUCKET", { infer: true })!,
            resourceDestinationBucket: this.configService.get("R2_QA_PRIVATE_BUCKET", { infer: true })!,
            accessKeyId: this.configService.get("R2_ACCESS_KEY_ID", { infer: true })!,
            secretAccessKey: this.configService.get("R2_SECRET_ACCESS_KEY", { infer: true })!,
            endpoint: this.configService.get("R2_ENDPOINT", { infer: true })!,
        };
    }
}
