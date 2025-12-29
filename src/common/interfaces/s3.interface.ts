import { S3 } from "@aws-sdk/client-s3";

export type S3Client = S3;
export interface IS3ListObjectsResult {
    keys: string[];
}
