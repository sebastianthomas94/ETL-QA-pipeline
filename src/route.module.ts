import { HealthModule } from "@modules/health/health.module";
import { Module } from "@nestjs/common";
import { EtlModule } from "./etl/etl.module";

@Module({
    imports: [HealthModule, EtlModule],
})
export class RouteModule {}
