import AWS from "aws-sdk";

export type S3Client = AWS.S3;
export interface IS3ListObjectsResult {
    keys: string[];
}
