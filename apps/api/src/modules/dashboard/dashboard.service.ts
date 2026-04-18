import { LeadStatus, PropertyStatus } from "@prisma/client";
import { prisma } from "../../core/prisma";

export class DashboardService {
  async getSummary() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [
      availableProperties,
      visitsToday,
      activeContracts,
      checkedOutKeys,
      openSaleLeads,
      openRentLeads,
    ] = await Promise.all([
      prisma.property.count({
        where: {
          status: PropertyStatus.AVAILABLE,
        },
      }),
      prisma.visit.count({
        where: {
          scheduledAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),
      prisma.contract.count({
        where: {
          status: "ACTIVE",
        },
      }),
      prisma.propertyKey.count({
        where: {
          currentStatus: "CHECKED_OUT",
        },
      }),
      prisma.saleLead.count({
        where: {
          status: LeadStatus.OPEN,
        },
      }),
      prisma.rentLead.count({
        where: {
          status: LeadStatus.OPEN,
        },
      }),
    ]);

    return {
      availableProperties,
      visitsToday,
      activeContracts,
      checkedOutKeys,
      openSaleLeads,
      openRentLeads,
    };
  }
}

