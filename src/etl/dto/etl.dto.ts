import { ApiProperty } from "@nestjs/swagger";

export class TriggerEtlResponseDto {
    @ApiProperty({ example: "ETL pipeline started successfully" })
    message: string;

    @ApiProperty({ example: "running" })
    status: string;

    @ApiProperty({ example: "2025-01-29T10:30:00.000Z" })
    timestamp: string;
}

export class LastRunDto {
    @ApiProperty({ example: "mongo-users" })
    key: string;

    @ApiProperty({ example: "2025-01-29T02:00:00.000Z" })
    timestamp: Date;

    @ApiProperty({ example: "2025-01-29T02:05:00.000Z" })
    updatedAt: Date;
}
