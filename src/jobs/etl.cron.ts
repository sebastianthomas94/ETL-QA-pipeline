import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { EtlService } from "src/etl/etl.service";

@Injectable()
export class EtlCron {
    constructor(private readonly etlService: EtlService) {}

    @Cron(CronExpression.EVERY_DAY_AT_2AM)
    async handleCron() {
        await this.etlService.runFullETL();
    }
}
