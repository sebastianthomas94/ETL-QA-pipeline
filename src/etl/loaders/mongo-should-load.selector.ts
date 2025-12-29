import { NodeType } from "@common/enums/node-type.enum";

export type ShouldLoadCallback = (obj: object) => boolean;

export function shouldLoadCallback(collectionName: string): ShouldLoadCallback | undefined {
    switch (collectionName) {
        case "nodes":
            return nodes;

        default:
            return undefined;
    }
}

const nodes = (obj: { nodeType: NodeType }) => {
    if (obj.nodeType !== NodeType.Folder) {
        return false;
    }
    return true;
};
