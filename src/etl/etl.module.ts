import { Module } from "@nestjs/common";
import { EtlService } from "./etl.service";
import { MongoExtractor } from "./extractors/mongo.extractor";
import { PgExtractor } from "./extractors/pg.extractor";
import { LastRunStore } from "../common/last-run.store";
import { EnvironmentService } from "@common/global/environment.service";

@Module({
    controllers: [],
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
        LastRunStore,
    ],
    exports: [EtlService],
})
export class EtlModule {}
