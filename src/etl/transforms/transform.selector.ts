import { SELECTED_ACCOUNTS } from "@common/constant/select-accounts.common";
import { UserAccountType } from "@common/enums/account-type.enum";

export type ShouldTransformCallback = (obj: object) => boolean;

export function shouldTransformCallback(collectionOrTableName: string): ShouldTransformCallback | undefined {
    switch (collectionOrTableName) {
        case "users":
            return users;

        default:
            return undefined;
    }
}

const users = (obj: { accountType: string; _id: string }) => {
    const isUser = obj.accountType === UserAccountType.User;
    const isAdmin = obj.accountType === UserAccountType.Admin;
    const isRoot = obj.accountType === UserAccountType.Root;
    const isAllowedAccountType = isUser || isAdmin || isRoot;
    const isNotSelectedAccount = !SELECTED_ACCOUNTS.includes(obj._id);

    return isAllowedAccountType && isNotSelectedAccount;
};
