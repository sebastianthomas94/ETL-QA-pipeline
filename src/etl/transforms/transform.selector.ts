export type ShouldTransformCallback = (obj: object) => boolean;

export function getTransformCallback(collectionOrTableName: string): ShouldTransformCallback | undefined {
    switch (collectionOrTableName) {
        case "users":
            return users;

        default:
            return undefined;
    }
}

const users = (obj: { accountType: string }) => {
    const isUser = obj.accountType === "User";
    const isAdmin = obj.accountType === "Admin";
    const isRoot = obj.accountType === "Root";

    return isUser || isAdmin || isRoot;
};
