import AWS from "aws-sdk";

export const createR2Client = ({
    accessKeyId,
    secretAccessKey,
    endpoint,
}: {
    accessKeyId: string;
    secretAccessKey: string;
    endpoint: string;
}) =>
    new AWS.S3({
        accessKeyId,
        secretAccessKey,
        endpoint, // e.g. https://<account-id>.r2.cloudflarestorage.com
        region: "auto",
        signatureVersion: "v4",
    });

export const listAllObjects = async (s3: AWS.S3, bucket: string): Promise<string[]> => {
    let isTruncated = true;
    let continuationToken: string | undefined = undefined;
    const keys: string[] = [];

    while (isTruncated) {
        const response: AWS.S3.ListObjectsV2Output = await s3
            .listObjectsV2({
                Bucket: bucket,
                ContinuationToken: continuationToken,
            })
            .promise();

        response.Contents?.forEach((obj) => {
            if (obj.Key) keys.push(obj.Key);
        });
        isTruncated = !!response.IsTruncated;
        continuationToken = response.NextContinuationToken;
    }

    return keys;
};

export function copyObject(options: {
    s3: AWS.S3;
    sourceBucket: string;
    destinationBucket: string;
    key: string;
}): Promise<AWS.S3.CopyObjectOutput> {
    const { s3, sourceBucket, destinationBucket, key } = options;
    return s3
        .copyObject({
            Bucket: destinationBucket,
            CopySource: `/${sourceBucket}/${encodeURIComponent(key)}`,
            Key: key,
        })
        .promise();
}
