import {
  ContractStatus,
  KeyStatus,
  LeadStatus,
  MaintenanceTicketStatus,
  PropertyStatus,
  VisitStatus,
} from "@prisma/client";
import { prisma } from "../../core/prisma";
import { resolveSlaDaysForUrgency } from "../maintenance/maintenance.rules";

const contractExpiringWindowDays = 45;
const leadWithoutReturnDays = 3;
const maintenanceUrgencyLevels = [1, 2, 3, 4, 5];

function getStartOfDay(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function getEndOfDay(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(23, 59, 59, 999);
  return normalized;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

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

  async getDailyRoutine() {
    const referenceDate = new Date();
    const startOfDay = getStartOfDay(referenceDate);
    const endOfDay = getEndOfDay(referenceDate);
    const expiringUntil = getEndOfDay(
      addDays(referenceDate, contractExpiringWindowDays),
    );
    const staleLeadDate = addDays(referenceDate, -leadWithoutReturnDays);
    const activeContractStatuses = [
      ContractStatus.ACTIVE,
      ContractStatus.RENEWED,
    ];
    const activeVisitStatuses = [
      VisitStatus.SCHEDULED,
      VisitStatus.CONFIRMED,
    ];
    const terminalMaintenanceStatuses = [
      MaintenanceTicketStatus.FINISHED,
      MaintenanceTicketStatus.CANCELLED,
    ];
    const openMaintenanceWhere = {
      status: {
        notIn: terminalMaintenanceStatuses,
      },
    };
    const maintenanceSlaWhere = maintenanceUrgencyLevels.map((urgencyLevel) => ({
      urgencyLevel,
      createdAt: {
        lt: addDays(referenceDate, -resolveSlaDaysForUrgency(urgencyLevel)),
      },
    }));
    const leadsWithoutReturnWhere = {
      status: LeadStatus.OPEN,
      OR: [
        {
          nextFollowUpAt: {
            lte: endOfDay,
          },
        },
        {
          nextFollowUpAt: null,
          lastContactAt: {
            lt: staleLeadDate,
          },
        },
        {
          nextFollowUpAt: null,
          lastContactAt: null,
          createdAt: {
            lte: staleLeadDate,
          },
        },
      ],
    };

    const [
      visitsToday,
      overdueVisitsToday,
      checkedOutKeys,
      overdueKeys,
      keysWithoutHolder,
      expiringContracts,
      contractsDueToday,
      overdueContracts,
      criticalMaintenanceTickets,
      urgentMaintenanceTickets,
      overdueMaintenanceTickets,
      unassignedMaintenanceTickets,
      saleLeadsWithoutReturn,
      rentLeadsWithoutReturn,
      overdueSaleLeads,
      overdueRentLeads,
      saleLeadsDueToday,
      rentLeadsDueToday,
    ] = await Promise.all([
      prisma.visit.count({
        where: {
          scheduledAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: {
            in: activeVisitStatuses,
          },
        },
      }),
      prisma.visit.count({
        where: {
          scheduledAt: {
            gte: startOfDay,
            lt: referenceDate,
          },
          status: {
            in: activeVisitStatuses,
          },
        },
      }),
      prisma.propertyKey.count({
        where: {
          currentStatus: KeyStatus.CHECKED_OUT,
        },
      }),
      prisma.propertyKey.count({
        where: {
          currentStatus: KeyStatus.CHECKED_OUT,
          controls: {
            some: {
              returnedAt: null,
              expectedReturnAt: {
                lt: referenceDate,
              },
            },
          },
        },
      }),
      prisma.propertyKey.count({
        where: {
          currentStatus: KeyStatus.CHECKED_OUT,
          currentHolderName: null,
        },
      }),
      prisma.contract.count({
        where: {
          status: {
            in: activeContractStatuses,
          },
          endDate: {
            lte: expiringUntil,
          },
        },
      }),
      prisma.contract.count({
        where: {
          status: {
            in: activeContractStatuses,
          },
          endDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),
      prisma.contract.count({
        where: {
          status: {
            in: activeContractStatuses,
          },
          endDate: {
            lt: startOfDay,
          },
        },
      }),
      prisma.maintenanceTicket.count({
        where: {
          ...openMaintenanceWhere,
          OR: [
            {
              urgencyLevel: {
                gte: 5,
              },
            },
            {
              assignedToUserId: null,
            },
            ...maintenanceSlaWhere,
          ],
        },
      }),
      prisma.maintenanceTicket.count({
        where: {
          ...openMaintenanceWhere,
          urgencyLevel: {
            gte: 5,
          },
        },
      }),
      prisma.maintenanceTicket.count({
        where: {
          ...openMaintenanceWhere,
          OR: maintenanceSlaWhere,
        },
      }),
      prisma.maintenanceTicket.count({
        where: {
          ...openMaintenanceWhere,
          assignedToUserId: null,
        },
      }),
      prisma.saleLead.count({
        where: leadsWithoutReturnWhere,
      }),
      prisma.rentLead.count({
        where: leadsWithoutReturnWhere,
      }),
      prisma.saleLead.count({
        where: {
          status: LeadStatus.OPEN,
          nextFollowUpAt: {
            lt: startOfDay,
          },
        },
      }),
      prisma.rentLead.count({
        where: {
          status: LeadStatus.OPEN,
          nextFollowUpAt: {
            lt: startOfDay,
          },
        },
      }),
      prisma.saleLead.count({
        where: {
          status: LeadStatus.OPEN,
          nextFollowUpAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),
      prisma.rentLead.count({
        where: {
          status: LeadStatus.OPEN,
          nextFollowUpAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),
    ]);

    const totalLeadsWithoutReturn =
      saleLeadsWithoutReturn + rentLeadsWithoutReturn;
    const overdueLeads = overdueSaleLeads + overdueRentLeads;
    const leadsDueToday = saleLeadsDueToday + rentLeadsDueToday;

    return {
      refreshedAt: referenceDate,
      visitsToday: {
        count: visitsToday,
        overdueCount: overdueVisitsToday,
        alert:
          overdueVisitsToday > 0
            ? "OVERDUE"
            : visitsToday > 0
              ? "DUE_TODAY"
              : null,
      },
      checkedOutKeys: {
        count: checkedOutKeys,
        overdueCount: overdueKeys,
        unassignedCount: keysWithoutHolder,
        alert:
          overdueKeys > 0
            ? "OVERDUE"
            : keysWithoutHolder > 0
              ? "UNASSIGNED"
              : null,
      },
      expiringContracts: {
        count: expiringContracts,
        dueTodayCount: contractsDueToday,
        overdueCount: overdueContracts,
        windowDays: contractExpiringWindowDays,
        alert:
          overdueContracts > 0
            ? "OVERDUE"
            : contractsDueToday > 0
              ? "DUE_TODAY"
              : null,
      },
      criticalMaintenanceTickets: {
        count: criticalMaintenanceTickets,
        urgentCount: urgentMaintenanceTickets,
        overdueCount: overdueMaintenanceTickets,
        unassignedCount: unassignedMaintenanceTickets,
        alert:
          urgentMaintenanceTickets > 0
            ? "URGENT"
            : overdueMaintenanceTickets > 0
              ? "OVERDUE"
              : unassignedMaintenanceTickets > 0
                ? "UNASSIGNED"
                : null,
      },
      leadsWithoutReturn: {
        count: totalLeadsWithoutReturn,
        saleCount: saleLeadsWithoutReturn,
        rentCount: rentLeadsWithoutReturn,
        overdueCount: overdueLeads,
        dueTodayCount: leadsDueToday,
        staleAfterDays: leadWithoutReturnDays,
        alert:
          overdueLeads > 0
            ? "OVERDUE"
            : leadsDueToday > 0
              ? "DUE_TODAY"
              : null,
      },
    };
  }
}
