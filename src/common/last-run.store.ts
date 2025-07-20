import { Injectable } from "@nestjs/common";

@Injectable()
export class LastRunStore {
    private timestampMap = new Map<string, Date>();

    get(key: string): Date {
        return this.timestampMap.get(key) || new Date(0);
    }

    set(key: string, ts: Date) {
        this.timestampMap.set(key, ts);
    }
}
