import { UserAccountType } from "@common/enums/account-type.enum";

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
    const isUser = obj.accountType === UserAccountType.User;
    const isAdmin = obj.accountType === UserAccountType.Admin;
    const isRoot = obj.accountType === UserAccountType.Root;

    return isUser || isAdmin || isRoot;
};
