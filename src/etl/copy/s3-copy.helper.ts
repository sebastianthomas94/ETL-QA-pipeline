import {
    S3,
    CopyObjectCommand,
    ListObjectsV2Command,
    ListObjectsV2CommandOutput,
    CopyObjectCommandOutput,
} from "@aws-sdk/client-s3";

export const createR2Client = ({
    accessKeyId,
    secretAccessKey,
    endpoint,
}: {
    accessKeyId: string;
    secretAccessKey: string;
    endpoint: string;
}) =>
    new S3({
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
        endpoint,
        region: "auto",
        forcePathStyle: true,
    });

export const listAllObjects = async (s3: S3, bucket: string): Promise<string[]> => {
    let isTruncated = true;
    let continuationToken: string | undefined = undefined;
    const keys: string[] = [];

    while (isTruncated) {
        const response: ListObjectsV2CommandOutput = await s3.send(
            new ListObjectsV2Command({
                Bucket: bucket,
                ContinuationToken: continuationToken,
            }),
        );

        (response.Contents ?? []).forEach((obj: { Key?: string }) => {
            if (obj.Key) keys.push(obj.Key);
        });
        isTruncated = !!response.IsTruncated;
        continuationToken = response.NextContinuationToken;
    }

    return keys;
};

export const listAllObjectsWithMetadata = async (
    s3: S3,
    bucket: string,
): Promise<{ Key: string; LastModified: Date }[]> => {
    let isTruncated = true;
    let continuationToken: string | undefined = undefined;
    const objects: { Key: string; LastModified: Date }[] = [];

    while (isTruncated) {
        const response: ListObjectsV2CommandOutput = await s3.send(
            new ListObjectsV2Command({
                Bucket: bucket,
                ContinuationToken: continuationToken,
            }),
        );

        (response.Contents ?? []).forEach((obj) => {
            if (obj.Key && obj.LastModified) {
                objects.push({ Key: obj.Key, LastModified: obj.LastModified });
            }
        });

        isTruncated = !!response.IsTruncated;
        continuationToken = response.NextContinuationToken;
    }

    return objects;
};

export function copyObject(options: {
    s3: S3;
    sourceBucket: string;
    destinationBucket: string;
    key: string;
}): Promise<CopyObjectCommandOutput> {
    const { s3, sourceBucket, destinationBucket, key } = options;
    return s3.send(
        new CopyObjectCommand({
            Bucket: destinationBucket,
            CopySource: `/${sourceBucket}/${encodeURIComponent(key)}`,
            Key: key,
        }),
    );
}
