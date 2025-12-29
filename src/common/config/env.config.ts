import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Matches, Max, Min, validateSync } from "class-validator";
import { plainToClass, Transform } from "class-transformer";
import { MONGO_PATTERN } from "../constant/common.constant";
import { parseCSVString } from "@common/utils/parse-csv-string.util";

export enum Environment {
    DEVELOPMENT = "development",
    PRODUCTION = "production",
    TEST = "test",
}

export class EnvironmentVariables {
    @IsEnum(Environment)
    NODE_ENV: Environment;

    @IsNumber()
    @Min(0)
    @Max(65535)
    PORT: number;

    // Production MongoDB Configuration
    @IsString()
    @Matches(MONGO_PATTERN)
    PROD_MONGO_URI: string;

    @IsOptional()
    @Transform(({ value }) => (value ? parseCSVString(value) : []))
    MONGO_COLLECTION_NAMES?: string[];

    @IsOptional()
    @Transform(({ value }) => (value ? parseCSVString(value) : []))
    PG_TABLE_NAMES?: string[];

    // Production PostgreSQL Configuration
    @IsString()
    PROD_PG_HOST: string;

    @IsNumber()
    @Min(1)
    @Max(65535)
    PROD_PG_PORT: number;

    @IsString()
    PROD_PG_DB: string;

    @IsString()
    PROD_PG_USER: string;

    @IsString()
    PROD_PG_PASS: string;

    // QA MongoDB Configuration
    @IsString()
    @Matches(MONGO_PATTERN)
    QA_MONGO_URI: string;

    // QA PostgreSQL Configuration
    @IsString()
    QA_PG_HOST: string;

    @IsNumber()
    @Min(1)
    @Max(65535)
    QA_PG_PORT: number;

    @IsString()
    QA_PG_DB: string;

    @IsString()
    QA_PG_USER: string;

    @IsString()
    QA_PG_PASS: string;

    @IsArray()
    @IsOptional()
    @Transform(({ value }) => (value ? parseCSVString(value) : []))
    TRANSFORMER_TABLE_NAMES: string[];

    @IsArray()
    @IsOptional()
    @Transform(({ value }) => (value ? parseCSVString(value) : []))
    TRANSFORMER_COLLECTION_NAMES: string[];

    // R2 Configuration
    @IsString()
    R2_ACCESS_KEY_ID: string;

    @IsString()
    R2_SECRET_ACCESS_KEY: string;

    @IsString()
    R2_ENDPOINT: string;

    @IsString()
    R2_PROD_BUCKET: string;

    @IsString()
    R2_QA_BUCKET: string;

    @IsString()
    R2_PROD_PRIVATE_BUCKET: string;

    @IsString()
    R2_QA_PRIVATE_BUCKET: string;
}

export function validate(config: Record<string, unknown>) {
    const validatedConfig = plainToClass(EnvironmentVariables, config, {
        enableImplicitConversion: true,
        excludeExtraneousValues: false,
    });
    const errors = validateSync(validatedConfig, {
        skipMissingProperties: false,
    });

    if (errors.length > 0) {
        throw new Error(errors.toString());
    }
    return validatedConfig;
}
