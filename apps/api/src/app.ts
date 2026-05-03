import path from "node:path";
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { env } from "./config/env";
import { logger } from "./core/logger";
import { authRouter } from "./modules/auth/auth.routes";
import { contactsRouter } from "./modules/contacts/contacts.routes";
import { contractsRouter } from "./modules/contracts/contracts.routes";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes";
import { keysRouter } from "./modules/keys/keys.routes";
import { maintenanceRouter } from "./modules/maintenance/maintenance.routes";
import { notificationsRouter } from "./modules/notifications/notifications.routes";
import { ownersRouter } from "./modules/owners/owners.routes";
import { propertiesRouter } from "./modules/properties/properties.routes";
import { rentLeadsRouter } from "./modules/rent-leads/rent-leads.routes";
import { saleLeadsRouter } from "./modules/sale-leads/sale-leads.routes";
import { systemRouter } from "./modules/system/system.routes";
import { tenantsRouter } from "./modules/tenants/tenants.routes";
import { tenantMagicLinkPublicRouter } from "./modules/tenant-portal/tenant-magic-link.routes";
import { tenantPortalRouter } from "./modules/tenant-portal/tenant-portal.routes";
import { rolesRouter, usersRouter } from "./modules/users/users.routes";
import { visitsRouter } from "./modules/visits/visits.routes";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";

export function createApp() {
  const app = express();

  app.use(
    pinoHttp({
      logger,
    }),
  );
  app.use(
    cors({
      origin: env.APP_ORIGIN,
      credentials: true,
    }),
  );
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "2mb" }));
  app.use(
    "/uploads",
    express.static(path.resolve(process.cwd(), env.UPLOADS_DIR)),
  );

  app.use("/api/system", systemRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/contacts", contactsRouter);
  app.use("/api/owners", ownersRouter);
  app.use("/api/tenants", tenantsRouter);
  app.use("/api/properties", propertiesRouter);
  app.use("/api/sale-leads", saleLeadsRouter);
  app.use("/api/rent-leads", rentLeadsRouter);
  app.use("/api/visits", visitsRouter);
  app.use("/api/keys", keysRouter);
  app.use("/api/maintenance-tickets", maintenanceRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/contracts", contractsRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/roles", rolesRouter);
  app.use("/api/tenant-magic-links", tenantMagicLinkPublicRouter);
  app.use("/api/tenant-portal", tenantPortalRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
