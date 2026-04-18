import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { appRoutes, permissionCodes } from "@imobiliaria/shared";
import { AppShell } from "@/layouts/app-shell";
import { ProtectedRoute } from "@/routes/protected-route";
import { PermissionGuard } from "@/routes/permission-guard";
import { LoginPage } from "@/pages/login-page";
import { ForgotPasswordPage } from "@/pages/forgot-password-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { ContractDetailPage } from "@/pages/contract-detail-page";
import { ContractGeneratorPage } from "@/pages/contract-generator-page";
import { ContractsPage } from "@/pages/contracts-page";
import { ForbiddenPage } from "@/pages/forbidden-page";
import { KeysPage } from "@/pages/keys-page";
import { OwnerDetailPage } from "@/pages/owner-detail-page";
import { OwnersPage } from "@/pages/owners-page";
import { PlaceholderPage } from "@/pages/placeholder-page";
import { PropertiesPage } from "@/pages/properties-page";
import { PropertyDetailPage } from "@/pages/property-detail-page";
import { RentLeadDetailPage } from "@/pages/rent-lead-detail-page";
import { RentsPage } from "@/pages/rents-page";
import { SaleLeadDetailPage } from "@/pages/sale-lead-detail-page";
import { SalesPage } from "@/pages/sales-page";
import { TenantDetailPage } from "@/pages/tenant-detail-page";
import { TenantsPage } from "@/pages/tenants-page";
import { UsersPage } from "@/pages/users-page";
import { VisitsPage } from "@/pages/visits-page";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to={appRoutes.dashboard} replace />,
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
            path: appRoutes.users,
            element: (
              <PermissionGuard permissions={[permissionCodes.USERS_MANAGE]}>
                <UsersPage />
              </PermissionGuard>
            ),
          },
          {
            path: appRoutes.settings,
            element: (
              <PermissionGuard permissions={[permissionCodes.SETTINGS_MANAGE]}>
                <PlaceholderPage
                  title="Configuracoes"
                  description="Area sensivel protegida para parametros, templates e politicas globais."
                />
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
