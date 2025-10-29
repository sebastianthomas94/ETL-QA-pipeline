import { Controller, Get, Res, HttpStatus, Logger } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Response } from "express";
import { EtlService } from "./etl.service";
import { LastRunStore } from "@common/last-run.store";
import { TriggerEtlResponseDto } from "./dto/etl.dto";

@ApiTags("ETL")
@Controller("etl")
export class EtlController {
    private readonly logger = new Logger(EtlController.name);

    constructor(
        private readonly etlService: EtlService,
        private readonly lastRunStore: LastRunStore,
    ) {}

    @Get("trigger")
    @ApiOperation({ summary: "Manually trigger ETL pipeline" })
    @ApiResponse({ status: 202, description: "ETL pipeline started", type: TriggerEtlResponseDto })
    @ApiResponse({ status: 500, description: "Failed to start ETL pipeline" })
    triggerEtl(@Res() res: Response) {
        try {
            this.logger.log("Manual ETL trigger requested");

            // Start ETL in background (don't await)
            this.etlService
                .runFullETL()
                .then(() => {
                    this.logger.log("Manual ETL completed successfully");
                })
                .catch((error) => {
                    this.logger.error("Manual ETL failed:", error);
                });

            res.status(HttpStatus.ACCEPTED).json({
                message: "ETL pipeline started successfully",
                status: "running",
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            this.logger.error("Failed to trigger ETL:", error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: "Failed to start ETL pipeline",
                error: error.message,
            });
        }
    }
}
