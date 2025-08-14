export type GetLoadCallback = (obj: object) => object;

export function getLoadCallback(collectionOrTableName: string): GetLoadCallback | undefined {
    switch (collectionOrTableName) {
        case "form_admissions":
            return formAdmissions;

        default:
            return undefined;
    }
}

const formAdmissions = (obj: { qualificationDetails: { sslcCertificateBase64: string } }) => {
    const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        qualificationDetails: { sslcCertificateBase64, ...restOfQualificationDetails },
        ...rest
    } = obj;
    return { qualificationDetails: { ...restOfQualificationDetails }, ...rest };
};
