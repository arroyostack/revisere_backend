import { Module } from "@nestjs/common";
import { AiBudgetService } from "./ai-budget.service";

@Module({
  providers: [AiBudgetService],
  exports: [AiBudgetService],
})
export class AiBudgetModule {}
