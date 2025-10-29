import { R2CopyService } from "./copy/r2-copy.service";
import { Module } from "@nestjs/common";
import { EtlService } from "./etl.service";
import { MongoExtractor } from "./extractors/mongo.extractor";
import { PgExtractor } from "./extractors/pg.extractor";
import { LastRunStore } from "../common/last-run.store";
import { EnvironmentService } from "@common/global/environment.service";
import { EtlCron } from "src/jobs/etl.cron";
import { ScheduleModule } from "@nestjs/schedule";
import { EtlController } from "./etl.controller";

@Module({
    imports: [ScheduleModule.forRoot()],
    controllers: [EtlController],
    providers: [
        EtlService,
        {
            provide: MongoExtractor,
            useFactory: (envService: EnvironmentService) => {
                return new MongoExtractor(envService.productionMongo.uri);
            },
            inject: [EnvironmentService],
        },
        {
            provide: PgExtractor,
            useFactory: (envService: EnvironmentService) => {
                return new PgExtractor(envService.productionPostgres);
            },
            inject: [EnvironmentService],
        },
        EtlCron,
        LastRunStore,
        R2CopyService,
    ],
    exports: [EtlService],
})
export class EtlModule {}
