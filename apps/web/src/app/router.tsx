import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { appRoutes, permissionCodes } from "@imobiliaria/shared";
import { AppShell } from "@/layouts/app-shell";
import { ProtectedRoute } from "@/routes/protected-route";
import { PermissionGuard } from "@/routes/permission-guard";
import { useAuth } from "@/features/auth/auth-context";
import { resolveHomeRoute } from "@/lib/navigation";
import { AccessManagementPage } from "@/pages/access-management-page";
import { ContactsPage } from "@/pages/contacts-page";
import { ContractDetailPage } from "@/pages/contract-detail-page";
import { ContractGeneratorPage } from "@/pages/contract-generator-page";
import { ContractTerminationConfirmPage } from "@/pages/contract-termination-confirm-page";
import { ContractTerminationRulesPage } from "@/pages/contract-termination-rules-page";
import { ContractTerminationSimulationPage } from "@/pages/contract-termination-simulation-page";
import { ContractsPage } from "@/pages/contracts-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { ForbiddenPage } from "@/pages/forbidden-page";
import { ForgotPasswordPage } from "@/pages/forgot-password-page";
import { KeysPage } from "@/pages/keys-page";
import { LoginPage } from "@/pages/login-page";
import { MaintenanceDashboardPage } from "@/pages/maintenance-dashboard-page";
import { MaintenanceKanbanPage } from "@/pages/maintenance-kanban-page";
import { MaintenanceTicketDetailPage } from "@/pages/maintenance-ticket-detail-page";
import { MaintenanceTicketNewPage } from "@/pages/maintenance-ticket-new-page";
import { MaintenanceTicketsPage } from "@/pages/maintenance-tickets-page";
import { OwnerDetailPage } from "@/pages/owner-detail-page";
import { OwnersPage } from "@/pages/owners-page";
import { PropertiesPage } from "@/pages/properties-page";
import { PropertyDetailPage } from "@/pages/property-detail-page";
import { RentLeadDetailPage } from "@/pages/rent-lead-detail-page";
import { RentsPage } from "@/pages/rents-page";
import { SaleLeadDetailPage } from "@/pages/sale-lead-detail-page";
import { SalesPage } from "@/pages/sales-page";
import { SettingsPage } from "@/pages/settings-page";
import { TenantDetailPage } from "@/pages/tenant-detail-page";
import { TenantMagicLinkPage } from "@/pages/tenant-magic-link-page";
import { TenantMagicLinkTicketNewPage } from "@/pages/tenant-magic-link-ticket-new-page";
import { TenantPortalPage } from "@/pages/tenant-portal-page";
import { TenantPortalTicketNewPage } from "@/pages/tenant-portal-ticket-new-page";
import { TenantsPage } from "@/pages/tenants-page";
import { UsersPage } from "@/pages/users-page";
import { VisitsPage } from "@/pages/visits-page";

function DefaultLanding() {
  const { status, user } = useAuth();

  if (status === "loading") {
    return null;
  }

  if (status !== "authenticated" || !user) {
    return <Navigate to={appRoutes.login} replace />;
  }

  return <Navigate to={resolveHomeRoute(user.permissions)} replace />;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <DefaultLanding />,
  },
  {
    path: appRoutes.login,
    element: <LoginPage />,
  },
  {
    path: appRoutes.forgotPassword,
    element: <ForgotPasswordPage />,
  },
  {
    path: appRoutes.forbidden,
    element: <ForbiddenPage />,
  },
  {
    path: appRoutes.tenantMagicLink,
    element: <TenantMagicLinkPage />,
  },
  {
    path: appRoutes.tenantMagicLinkTicketNew,
    element: <TenantMagicLinkTicketNewPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            path: appRoutes.dashboard,
            element: (
              <PermissionGuard permissions={[permissionCodes.DASHBOARD_READ]}>
                <DashboardPage />
              </PermissionGuard>
            ),
          },
          {
            path: appRoutes.sales,
            element: (
              <PermissionGuard permissions={[permissionCodes.SALE_LEADS_READ]}>
                <SalesPage />
              </PermissionGuard>
            ),
          },
          {
            path: appRoutes.salesLeadDetail,
            element: (
              <PermissionGuard permissions={[permissionCodes.SALE_LEADS_READ]}>
                <SaleLeadDetailPage />
              </PermissionGuard>
            ),
          },
          {
            path: appRoutes.rents,
            element: (
              <PermissionGuard permissions={[permissionCodes.RENT_LEADS_READ]}>
                <RentsPage />
              </PermissionGuard>
            ),
          },
          {
            path: appRoutes.rentLeadDetail,
            element: (
              <PermissionGuard permissions={[permissionCodes.RENT_LEADS_READ]}>
                <RentLeadDetailPage />
              </PermissionGuard>
            ),
          },
          {
            path: appRoutes.visits,
            element: (
              <PermissionGuard permissions={[permissionCodes.VISITS_READ]}>
                <VisitsPage />
              </PermissionGuard>
            ),
          },
          {
            path: appRoutes.keys,
            element: (
              <PermissionGuard permissions={[permissionCodes.KEYS_READ]}>
                <KeysPage />
              </PermissionGuard>
            ),
          },
          {
            path: appRoutes.maintenanceDashboard,
            element: (
              <PermissionGuard permissions={[permissionCodes.MAINTENANCE_READ]}>
                <MaintenanceDashboardPage />
              </PermissionGuard>
            ),
          },
          {
            path: appRoutes.maintenanceTickets,
            element: (
              <PermissionGuard permissions={[permissionCodes.MAINTENANCE_READ]}>
                <MaintenanceTicketsPage />
              </PermissionGuard>
            ),
          },
          {
            path: appRoutes.maintenanceTicketNew,
            element: (
              <PermissionGuard permissions={[permissionCodes.MAINTENANCE_WRITE]}>
                <MaintenanceTicketNewPage />
              </PermissionGuard>
            ),
          },
          {
            path: appRoutes.maintenanceTicketDetail,
            element: (
              <PermissionGuard permissions={[permissionCodes.MAINTENANCE_READ]}>
                <MaintenanceTicketDetailPage />
              </PermissionGuard>
            ),
          },
          {
            path: appRoutes.maintenanceKanban,
            element: (
              <PermissionGuard permissions={[permissionCodes.MAINTENANCE_READ]}>
                <MaintenanceKanbanPage />
              </PermissionGuard>
            ),
          },
          {
            path: appRoutes.tenantPortal,
            element: (
              <PermissionGuard permissions={[permissionCodes.TENANT_PORTAL_ACCESS]}>
                <TenantPortalPage />
              </PermissionGuard>
            ),
          },
          {
            path: appRoutes.tenantPortalTicketNew,
            element: (
              <PermissionGuard
                permissions={[
                  permissionCodes.TENANT_PORTAL_ACCESS,
                  permissionCodes.MAINTENANCE_PORTAL_OPEN,
                ]}
              >
                <TenantPortalTicketNewPage />
              </PermissionGuard>
            ),
          },
          {
            path: appRoutes.contracts,
            element: (
              <PermissionGuard permissions={[permissionCodes.CONTRACTS_READ]}>
                <ContractsPage />
              </PermissionGuard>
            ),
          },
          {
            path: appRoutes.contractDetail,
            element: (
              <PermissionGuard permissions={[permissionCodes.CONTRACTS_READ]}>
                <ContractDetailPage />
              </PermissionGuard>
            ),
          },
          {
            path: appRoutes.contractGenerator,
            element: (
              <PermissionGuard permissions={[permissionCodes.CONTRACTS_GENERATE]}>
                <ContractGeneratorPage />
              </PermissionGuard>
            ),
          },
          {
            path: appRoutes.contractTerminationRules,
            element: (
              <PermissionGuard
                permissions={[permissionCodes.LEASE_TERMINATION_RULES_MANAGE]}
              >
                <ContractTerminationRulesPage />
              </PermissionGuard>
            ),
          },
          {
            path: appRoutes.contractTerminationSimulate,
            element: (
              <PermissionGuard
                permissions={[permissionCodes.LEASE_TERMINATION_SIMULATE]}
              >
                <ContractTerminationSimulationPage />
              </PermissionGuard>
            ),
          },
          {
            path: appRoutes.contractTerminationConfirm,
            element: (
              <PermissionGuard
                permissions={[permissionCodes.LEASE_TERMINATION_EXECUTE]}
              >
                <ContractTerminationConfirmPage />
              </PermissionGuard>
            ),
          },
          {
            path: appRoutes.contacts,
            element: (
              <PermissionGuard permissions={[permissionCodes.CONTACTS_READ]}>
                <ContactsPage />
              </PermissionGuard>
            ),
          },
          {
            path: appRoutes.owners,
            element: (
              <PermissionGuard permissions={[permissionCodes.OWNERS_READ]}>
                <OwnersPage />
              </PermissionGuard>
            ),
          },
          {
            path: appRoutes.ownerDetail,
            element: (
              <PermissionGuard permissions={[permissionCodes.OWNERS_READ]}>
                <OwnerDetailPage />
              </PermissionGuard>
            ),
          },
          {
            path: appRoutes.tenants,
            element: (
              <PermissionGuard permissions={[permissionCodes.TENANTS_READ]}>
                <TenantsPage />
              </PermissionGuard>
            ),
          },
          {
            path: appRoutes.tenantDetail,
            element: (
              <PermissionGuard permissions={[permissionCodes.TENANTS_READ]}>
                <TenantDetailPage />
              </PermissionGuard>
            ),
          },
          {
            path: appRoutes.properties,
            element: (
              <PermissionGuard permissions={[permissionCodes.PROPERTIES_READ]}>
                <PropertiesPage />
              </PermissionGuard>
            ),
          },
          {
            path: appRoutes.propertyDetail,
            element: (
              <PermissionGuard permissions={[permissionCodes.PROPERTIES_READ]}>
                <PropertyDetailPage />
              </PermissionGuard>
            ),
          },
          {
            path: appRoutes.property360,
            element: (
              <PermissionGuard permissions={[permissionCodes.PROPERTIES_READ]}>
                <PropertyDetailPage />
              </PermissionGuard>
            ),
          },
          {
            path: appRoutes.users,
            element: (
              <PermissionGuard permissions={[permissionCodes.USERS_MANAGE]}>
                <UsersPage />
              </PermissionGuard>
            ),
          },
          {
            path: appRoutes.accessManagement,
            element: (
              <PermissionGuard permissions={[permissionCodes.ACCESS_MANAGE]}>
                <AccessManagementPage />
              </PermissionGuard>
            ),
          },
          {
            path: appRoutes.settings,
            element: (
              <PermissionGuard permissions={[permissionCodes.PREFERENCES_MANAGE]}>
                <SettingsPage />
              </PermissionGuard>
            ),
          },
        ],
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
