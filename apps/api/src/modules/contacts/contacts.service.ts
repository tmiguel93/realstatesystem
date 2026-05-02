import { AuditEntityType, ContactRoleType, Prisma } from "@prisma/client";
import { createAuditLog } from "../../core/audit";
import { HttpError } from "../../core/http-error";
import { buildPaginationMeta, resolvePagination } from "../../core/pagination";
import { prisma } from "../../core/prisma";
import { rethrowPrismaError } from "../../core/prisma-error";

type ContactsListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: ContactRoleType;
  isActive?: boolean;
};

type RequestContext = {
  actorUserId?: string;
  ipAddress?: string;
  userAgent?: string;
};

type ContactPayload = {
  personType: "INDIVIDUAL" | "COMPANY";
  fullName: string;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  secondaryPhone?: string | null;
  zipCode?: string | null;
  state?: string | null;
  city?: string | null;
  district?: string | null;
  street?: string | null;
  streetNumber?: string | null;
  complement?: string | null;
  notes?: string | null;
  isActive: boolean;
  roles: ContactRoleType[];
};

type ContactSourceType = "CONTACT" | "LEGACY";

type ContactDirectoryItem = {
  id: string;
  contactId: string | null;
  sourceType: ContactSourceType;
  personType: "INDIVIDUAL" | "COMPANY";
  fullName: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  secondaryPhone: string | null;
  city: string | null;
  state: string | null;
  roles: ContactRoleType[];
  isActive: boolean;
  createdAt: Date;
  ownerId: string | null;
  tenantId: string | null;
  buyerLeadCount: number;
  propertyCount: number;
  contractCount: number;
  rentLeadCount: number;
  notes: string | null;
  zipCode: string | null;
  district: string | null;
  street: string | null;
  streetNumber: string | null;
  complement: string | null;
};

function normalizeOptionalString(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function normalizeEmail(value?: string | null) {
  const normalized = normalizeOptionalString(value);
  return normalized ? normalized.toLowerCase() : null;
}

function onlyDigits(value?: string | null) {
  const normalized = normalizeOptionalString(value);
  if (!normalized) {
    return null;
  }

  const digits = normalized.replace(/\D/g, "");
  return digits.length > 0 ? digits : normalized;
}

function documentCandidates(value?: string | null) {
  const trimmed = normalizeOptionalString(value);
  const digits = onlyDigits(value);
  return Array.from(new Set([trimmed, digits].filter(Boolean))) as string[];
}

function phoneCandidates(value?: string | null) {
  const trimmed = normalizeOptionalString(value);
  const digits = onlyDigits(value);
  return Array.from(new Set([trimmed, digits].filter(Boolean))) as string[];
}

function identityKey(item: {
  id: string;
  document: string | null;
  email: string | null;
  phone: string | null;
}) {
  const document = onlyDigits(item.document);
  if (document) {
    return `document:${document}`;
  }

  const email = normalizeEmail(item.email);
  if (email) {
    return `email:${email}`;
  }

  const phone = onlyDigits(item.phone);
  if (phone) {
    return `phone:${phone}`;
  }

  return `id:${item.id}`;
}

function hasSearch(search: string | undefined) {
  return Boolean(search?.trim());
}

function buildContactSearchWhere(search: string | undefined) {
  if (!hasSearch(search)) {
    return {};
  }

  const term = search!.trim();
  return {
    OR: [
      { fullName: { contains: term, mode: "insensitive" } },
      { document: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
      { phone: { contains: term, mode: "insensitive" } },
    ],
  } satisfies Prisma.ContactWhereInput;
}

function buildOwnerSearchWhere(search: string | undefined) {
  if (!hasSearch(search)) {
    return {};
  }

  const term = search!.trim();
  return {
    OR: [
      { fullName: { contains: term, mode: "insensitive" } },
      { document: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
      { phone: { contains: term, mode: "insensitive" } },
    ],
  } satisfies Prisma.OwnerWhereInput;
}

function buildTenantSearchWhere(search: string | undefined) {
  if (!hasSearch(search)) {
    return {};
  }

  const term = search!.trim();
  return {
    OR: [
      { fullName: { contains: term, mode: "insensitive" } },
      { document: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
      { phone: { contains: term, mode: "insensitive" } },
    ],
  } satisfies Prisma.TenantWhereInput;
}

function mapContact(contact: {
  id: string;
  personType: "INDIVIDUAL" | "COMPANY";
  fullName: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  secondaryPhone: string | null;
  zipCode: string | null;
  state: string | null;
  city: string | null;
  district: string | null;
  street: string | null;
  streetNumber: string | null;
  complement: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  roles: Array<{ role: ContactRoleType }>;
  ownerProfile: {
    id: string;
    _count: {
      properties: number;
      contracts: number;
    };
  } | null;
  tenantProfile: {
    id: string;
    _count: {
      contracts: number;
      rentLeads: number;
    };
  } | null;
}): ContactDirectoryItem {
  return {
    id: contact.id,
    contactId: contact.id,
    sourceType: "CONTACT",
    personType: contact.personType,
    fullName: contact.fullName,
    document: contact.document,
    email: contact.email,
    phone: contact.phone,
    secondaryPhone: contact.secondaryPhone,
    city: contact.city,
    state: contact.state,
    roles: contact.roles.map((item) => item.role),
    isActive: contact.isActive,
    createdAt: contact.createdAt,
    ownerId: contact.ownerProfile?.id ?? null,
    tenantId: contact.tenantProfile?.id ?? null,
    buyerLeadCount: 0,
    propertyCount: contact.ownerProfile?._count.properties ?? 0,
    contractCount:
      (contact.ownerProfile?._count.contracts ?? 0) +
      (contact.tenantProfile?._count.contracts ?? 0),
    rentLeadCount: contact.tenantProfile?._count.rentLeads ?? 0,
    notes: contact.notes,
    zipCode: contact.zipCode,
    district: contact.district,
    street: contact.street,
    streetNumber: contact.streetNumber,
    complement: contact.complement,
  };
}

function mapLegacyOwner(owner: {
  id: string;
  personType: "INDIVIDUAL" | "COMPANY";
  fullName: string;
  document: string;
  email: string | null;
  phone: string | null;
  secondaryPhone: string | null;
  zipCode: string | null;
  state: string | null;
  city: string | null;
  district: string | null;
  street: string | null;
  streetNumber: string | null;
  complement: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  _count: {
    properties: number;
    contracts: number;
  };
}): ContactDirectoryItem {
  return {
    id: `legacy-owner:${owner.id}`,
    contactId: null,
    sourceType: "LEGACY",
    personType: owner.personType,
    fullName: owner.fullName,
    document: owner.document,
    email: owner.email,
    phone: owner.phone,
    secondaryPhone: owner.secondaryPhone,
    city: owner.city,
    state: owner.state,
    roles: [ContactRoleType.OWNER],
    isActive: owner.isActive,
    createdAt: owner.createdAt,
    ownerId: owner.id,
    tenantId: null,
    buyerLeadCount: 0,
    propertyCount: owner._count.properties,
    contractCount: owner._count.contracts,
    rentLeadCount: 0,
    notes: owner.notes,
    zipCode: owner.zipCode,
    district: owner.district,
    street: owner.street,
    streetNumber: owner.streetNumber,
    complement: owner.complement,
  };
}

function mapLegacyTenant(tenant: {
  id: string;
  fullName: string;
  document: string;
  email: string | null;
  phone: string | null;
  secondaryPhone: string | null;
  zipCode: string | null;
  state: string | null;
  city: string | null;
  district: string | null;
  street: string | null;
  streetNumber: string | null;
  complement: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  _count: {
    contracts: number;
    rentLeads: number;
  };
}): ContactDirectoryItem {
  return {
    id: `legacy-tenant:${tenant.id}`,
    contactId: null,
    sourceType: "LEGACY",
    personType: "INDIVIDUAL",
    fullName: tenant.fullName,
    document: tenant.document,
    email: tenant.email,
    phone: tenant.phone,
    secondaryPhone: tenant.secondaryPhone,
    city: tenant.city,
    state: tenant.state,
    roles: [ContactRoleType.TENANT],
    isActive: tenant.isActive,
    createdAt: tenant.createdAt,
    ownerId: null,
    tenantId: tenant.id,
    buyerLeadCount: 0,
    propertyCount: 0,
    contractCount: tenant._count.contracts,
    rentLeadCount: tenant._count.rentLeads,
    notes: tenant.notes,
    zipCode: tenant.zipCode,
    district: tenant.district,
    street: tenant.street,
    streetNumber: tenant.streetNumber,
    complement: tenant.complement,
  };
}

function mergeDirectoryItems(items: ContactDirectoryItem[]) {
  const entries = new Map<string, ContactDirectoryItem>();

  for (const item of items) {
    const key = identityKey(item);
    const existing = entries.get(key);

    if (!existing) {
      entries.set(key, item);
      continue;
    }

    existing.roles = Array.from(new Set([...existing.roles, ...item.roles]));
    existing.ownerId = existing.ownerId ?? item.ownerId;
    existing.tenantId = existing.tenantId ?? item.tenantId;
    existing.propertyCount += item.propertyCount;
    existing.contractCount += item.contractCount;
    existing.rentLeadCount += item.rentLeadCount;
    existing.buyerLeadCount += item.buyerLeadCount;
    existing.isActive = existing.isActive || item.isActive;
    existing.createdAt =
      existing.createdAt > item.createdAt ? existing.createdAt : item.createdAt;

    if (existing.sourceType !== "CONTACT" && item.sourceType === "CONTACT") {
      existing.id = item.id;
      existing.contactId = item.contactId;
      existing.sourceType = "CONTACT";
    }
  }

  return Array.from(entries.values()).sort(
    (first, second) => second.createdAt.getTime() - first.createdAt.getTime(),
  );
}

export class ContactsService {
  async list(query: ContactsListQuery) {
    const { page, pageSize, skip, take } = resolvePagination(query);
    const contactWhere: Prisma.ContactWhereInput = {
      ...buildContactSearchWhere(query.search),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.role ? { roles: { some: { role: query.role } } } : {}),
    };

    const includeLegacyOwners =
      !query.role || query.role === ContactRoleType.OWNER;
    const includeLegacyTenants =
      !query.role || query.role === ContactRoleType.TENANT;

    const [contacts, owners, tenants] = await Promise.all([
      prisma.contact.findMany({
        where: contactWhere,
        include: {
          roles: true,
          ownerProfile: {
            select: {
              id: true,
              _count: {
                select: {
                  properties: true,
                  contracts: true,
                },
              },
            },
          },
          tenantProfile: {
            select: {
              id: true,
              _count: {
                select: {
                  contracts: true,
                  rentLeads: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      includeLegacyOwners
        ? prisma.owner.findMany({
            where: {
              contactId: null,
              ...buildOwnerSearchWhere(query.search),
              ...(query.isActive !== undefined
                ? { isActive: query.isActive }
                : {}),
            },
            include: {
              _count: {
                select: {
                  properties: true,
                  contracts: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),
      includeLegacyTenants
        ? prisma.tenant.findMany({
            where: {
              contactId: null,
              ...buildTenantSearchWhere(query.search),
              ...(query.isActive !== undefined
                ? { isActive: query.isActive }
                : {}),
            },
            include: {
              _count: {
                select: {
                  contracts: true,
                  rentLeads: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),
    ]);

    const mergedItems = mergeDirectoryItems([
      ...contacts.map(mapContact),
      ...owners.map(mapLegacyOwner),
      ...tenants.map(mapLegacyTenant),
    ]);
    const paginatedItems = mergedItems.slice(skip, skip + take);

    return {
      data: paginatedItems,
      meta: buildPaginationMeta(mergedItems.length, page, pageSize),
      summary: {
        total: mergedItems.length,
        owners: mergedItems.filter((item) =>
          item.roles.includes(ContactRoleType.OWNER),
        ).length,
        tenants: mergedItems.filter((item) =>
          item.roles.includes(ContactRoleType.TENANT),
        ).length,
        buyers: mergedItems.filter((item) =>
          item.roles.includes(ContactRoleType.BUYER),
        ).length,
        guarantors: mergedItems.filter((item) =>
          item.roles.includes(ContactRoleType.GUARANTOR),
        ).length,
        externalBrokers: mergedItems.filter((item) =>
          item.roles.includes(ContactRoleType.EXTERNAL_BROKER),
        ).length,
      },
    };
  }

  async create(payload: ContactPayload, context: RequestContext) {
    const normalizedPayload = this.normalizePayload(payload);
    await this.ensureNoContactDuplicate(normalizedPayload);

    const linkableProfiles = await this.findLinkableProfiles(normalizedPayload);
    const roles = Array.from(
      new Set([
        ...normalizedPayload.roles,
        ...(linkableProfiles.owners.length ? [ContactRoleType.OWNER] : []),
        ...(linkableProfiles.tenants.length ? [ContactRoleType.TENANT] : []),
      ]),
    );

    try {
      const contact = await prisma.$transaction(async (transaction) => {
        const createdContact = await transaction.contact.create({
          data: {
            ...this.toPrismaData(normalizedPayload),
            roles: {
              create: roles.map((role) => ({ role })),
            },
          },
          include: {
            roles: true,
            ownerProfile: {
              select: {
                id: true,
                _count: {
                  select: {
                    properties: true,
                    contracts: true,
                  },
                },
              },
            },
            tenantProfile: {
              select: {
                id: true,
                _count: {
                  select: {
                    contracts: true,
                    rentLeads: true,
                  },
                },
              },
            },
          },
        });

        if (linkableProfiles.owners.length > 0) {
          await transaction.owner.updateMany({
            where: { id: { in: linkableProfiles.owners.map((owner) => owner.id) } },
            data: { contactId: createdContact.id },
          });
        }

        if (linkableProfiles.tenants.length > 0) {
          await transaction.tenant.updateMany({
            where: {
              id: { in: linkableProfiles.tenants.map((tenant) => tenant.id) },
            },
            data: { contactId: createdContact.id },
          });
        }

        return transaction.contact.findUniqueOrThrow({
          where: { id: createdContact.id },
          include: {
            roles: true,
            ownerProfile: {
              select: {
                id: true,
                _count: {
                  select: {
                    properties: true,
                    contracts: true,
                  },
                },
              },
            },
            tenantProfile: {
              select: {
                id: true,
                _count: {
                  select: {
                    contracts: true,
                    rentLeads: true,
                  },
                },
              },
            },
          },
        });
      });

      await this.audit("contacts.create", contact.id, contact.fullName, context, {
        ...normalizedPayload,
        roles,
        linkedOwnerIds: linkableProfiles.owners.map((owner) => owner.id),
        linkedTenantIds: linkableProfiles.tenants.map((tenant) => tenant.id),
      });

      return mapContact(contact);
    } catch (error) {
      rethrowPrismaError(error, "Falha ao criar contato.");
    }
  }

  async update(id: string, payload: ContactPayload, context: RequestContext) {
    const normalizedPayload = this.normalizePayload(payload);
    await this.ensureNoContactDuplicate(normalizedPayload, id);
    await this.ensureNoLegacyConflict(normalizedPayload, id);

    try {
      const contact = await prisma.$transaction(async (transaction) => {
        await transaction.contactRole.deleteMany({
          where: { contactId: id },
        });

        return transaction.contact.update({
          where: { id },
          data: {
            ...this.toPrismaData(normalizedPayload),
            roles: {
              create: normalizedPayload.roles.map((role) => ({ role })),
            },
          },
          include: {
            roles: true,
            ownerProfile: {
              select: {
                id: true,
                _count: {
                  select: {
                    properties: true,
                    contracts: true,
                  },
                },
              },
            },
            tenantProfile: {
              select: {
                id: true,
                _count: {
                  select: {
                    contracts: true,
                    rentLeads: true,
                  },
                },
              },
            },
          },
        });
      });

      await this.audit("contacts.update", id, contact.fullName, context, {
        ...normalizedPayload,
      });

      return mapContact(contact);
    } catch (error) {
      rethrowPrismaError(error, "Falha ao atualizar contato.");
    }
  }

  private normalizePayload(payload: ContactPayload): ContactPayload {
    return {
      ...payload,
      fullName: payload.fullName.trim(),
      document: onlyDigits(payload.document),
      email: normalizeEmail(payload.email),
      phone: onlyDigits(payload.phone),
      secondaryPhone: onlyDigits(payload.secondaryPhone),
      zipCode: normalizeOptionalString(payload.zipCode),
      state: normalizeOptionalString(payload.state)?.toUpperCase() ?? null,
      city: normalizeOptionalString(payload.city),
      district: normalizeOptionalString(payload.district),
      street: normalizeOptionalString(payload.street),
      streetNumber: normalizeOptionalString(payload.streetNumber),
      complement: normalizeOptionalString(payload.complement),
      notes: normalizeOptionalString(payload.notes),
      roles: Array.from(new Set(payload.roles)),
    };
  }

  private toPrismaData(
    payload: ContactPayload,
  ): Prisma.ContactUncheckedCreateInput {
    return {
      personType: payload.personType,
      fullName: payload.fullName,
      document: payload.document,
      email: payload.email,
      phone: payload.phone,
      secondaryPhone: payload.secondaryPhone,
      zipCode: payload.zipCode,
      state: payload.state,
      city: payload.city,
      district: payload.district,
      street: payload.street,
      streetNumber: payload.streetNumber,
      complement: payload.complement,
      notes: payload.notes,
      isActive: payload.isActive,
    };
  }

  private async ensureNoContactDuplicate(
    payload: ContactPayload,
    currentContactId?: string,
  ) {
    const duplicateFilters = this.contactIdentityFilters(payload);
    if (duplicateFilters.length === 0) {
      return;
    }

    const duplicate = await prisma.contact.findFirst({
      where: {
        ...(currentContactId ? { id: { not: currentContactId } } : {}),
        OR: duplicateFilters,
      },
      select: {
        id: true,
        fullName: true,
      },
    });

    if (duplicate) {
      throw new HttpError(409, "Já existe um contato com estes dados.", {
        contactId: duplicate.id,
        contactName: duplicate.fullName,
      });
    }
  }

  private async findLinkableProfiles(payload: ContactPayload) {
    const documents = documentCandidates(payload.document);

    if (documents.length === 0) {
      await this.ensureNoLegacyConflict(payload);
      return { owners: [], tenants: [] };
    }

    const [ownersByDocument, tenantsByDocument] = await Promise.all([
      prisma.owner.findMany({
        where: { document: { in: documents } },
        select: { id: true, contactId: true },
      }),
      prisma.tenant.findMany({
        where: { document: { in: documents } },
        select: { id: true, contactId: true },
      }),
    ]);

    const profileWithContact = [
      ...ownersByDocument.map((owner) => owner.contactId),
      ...tenantsByDocument.map((tenant) => tenant.contactId),
    ].find(Boolean);

    if (profileWithContact) {
      throw new HttpError(
        409,
        "Este documento já está vinculado a outro contato.",
        { contactId: profileWithContact },
      );
    }

    await this.ensureNoLegacyConflict(payload, undefined, documents);

    return {
      owners: ownersByDocument,
      tenants: tenantsByDocument,
    };
  }

  private async ensureNoLegacyConflict(
    payload: ContactPayload,
    currentContactId?: string,
    allowedDocuments: string[] = [],
  ) {
    const ownerFilters = this.ownerIdentityFilters(payload);
    const tenantFilters = this.tenantIdentityFilters(payload);
    if (ownerFilters.length === 0 && tenantFilters.length === 0) {
      return;
    }

    const [owners, tenants] = await Promise.all([
      ownerFilters.length > 0
        ? prisma.owner.findMany({
            where: { OR: ownerFilters },
            select: {
              id: true,
              fullName: true,
              document: true,
              contactId: true,
            },
            take: 10,
          })
        : Promise.resolve([]),
      tenantFilters.length > 0
        ? prisma.tenant.findMany({
            where: { OR: tenantFilters },
            select: {
              id: true,
              fullName: true,
              document: true,
              contactId: true,
            },
            take: 10,
          })
        : Promise.resolve([]),
    ]);

    const owner = owners.find((item) => {
      const isAllowed =
        allowedDocuments.includes(item.document) && item.contactId === null;
      return !isAllowed && item.contactId !== currentContactId;
    });
    const tenant = tenants.find((item) => {
      const isAllowed =
        allowedDocuments.includes(item.document) && item.contactId === null;
      return !isAllowed && item.contactId !== currentContactId;
    });

    if (owner) {
      throw new HttpError(
        409,
        "Estes dados já pertencem a um proprietário existente.",
        { ownerId: owner.id, ownerName: owner.fullName },
      );
    }

    if (tenant) {
      throw new HttpError(
        409,
        "Estes dados já pertencem a um locatário existente.",
        { tenantId: tenant.id, tenantName: tenant.fullName },
      );
    }
  }

  private contactIdentityFilters(payload: ContactPayload) {
    const documentValues = documentCandidates(payload.document);
    const phoneValues = phoneCandidates(payload.phone);
    const filters: Prisma.ContactWhereInput[] = [];

    if (documentValues.length > 0) {
      filters.push({ document: { in: documentValues } });
    }

    if (payload.email) {
      filters.push({ email: { equals: payload.email, mode: "insensitive" } });
    }

    if (phoneValues.length > 0) {
      filters.push({ phone: { in: phoneValues } });
    }

    return filters;
  }

  private ownerIdentityFilters(payload: ContactPayload) {
    const documentValues = documentCandidates(payload.document);
    const phoneValues = phoneCandidates(payload.phone);
    const filters: Prisma.OwnerWhereInput[] = [];

    if (documentValues.length > 0) {
      filters.push({ document: { in: documentValues } });
    }

    if (payload.email) {
      filters.push({ email: { equals: payload.email, mode: "insensitive" } });
    }

    if (phoneValues.length > 0) {
      filters.push({ phone: { in: phoneValues } });
    }

    return filters;
  }

  private tenantIdentityFilters(payload: ContactPayload) {
    const documentValues = documentCandidates(payload.document);
    const phoneValues = phoneCandidates(payload.phone);
    const filters: Prisma.TenantWhereInput[] = [];

    if (documentValues.length > 0) {
      filters.push({ document: { in: documentValues } });
    }

    if (payload.email) {
      filters.push({ email: { equals: payload.email, mode: "insensitive" } });
    }

    if (phoneValues.length > 0) {
      filters.push({ phone: { in: phoneValues } });
    }

    return filters;
  }

  private async audit(
    action: string,
    entityId: string,
    contactName: string,
    context: RequestContext,
    metadata: unknown,
  ) {
    await createAuditLog({
      actorUserId: context.actorUserId,
      action,
      entityType: AuditEntityType.CONTACT,
      entityId,
      description: `${contactName} foi alterado no cadastro unificado de contatos.`,
      metadata,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }
}
