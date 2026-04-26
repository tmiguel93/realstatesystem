import type { Request, Response } from "express";
import { DashboardService } from "./dashboard.service";

const dashboardService = new DashboardService();

export class DashboardController {
  async summary(_request: Request, response: Response) {
    const summary = await dashboardService.getSummary();

    return response.status(200).json(summary);
  }

  async dailyRoutine(_request: Request, response: Response) {
    const dailyRoutine = await dashboardService.getDailyRoutine();

    return response.status(200).json(dailyRoutine);
  }
}
