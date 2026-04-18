import type { PaginatedResponse } from "@imobiliaria/shared";

export type OwnerListItem = {
  id: string;
  personType: string;
  fullName: string;
  document: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  isActive: boolean;
  createdAt: string;
  propertyCount: number;
  contractCount: number;
};

export type OwnerDetail = {
  id: string;
  personType: string;
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
  bankName: string | null;
  bankBranch: string | null;
  bankAccount: string | null;
  pixKey: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  propertyCount: number;
  contractCount: number;
  properties: Array<{
    id: string;
    code: string;
    title: string;
    type: string;
    purpose: string;
    status: string;
    city: string;
    district: string;
    salePrice: number | null;
    rentPrice: number | null;
  }>;
  contracts: Array<{
    id: string;
    code: string;
    status: string;
    startDate: string;
    endDate: string;
    rentAmount: number;
    property: {
      code: string;
      title: string;
    };
    tenant: {
      fullName: string;
    };
  }>;
};

export type TenantListItem = {
  id: string;
  fullName: string;
  document: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  scoreStatus: string;
  scoreValue: number | null;
  isActive: boolean;
  createdAt: string;
  contractCount: number;
  rentLeadCount: number;
};

export type TenantDetail = {
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
  scoreStatus: string;
  scoreValue: number | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  contractCount: number;
  rentLeadCount: number;
  contracts: Array<{
    id: string;
    code: string;
    status: string;
    startDate: string;
    endDate: string;
    rentAmount: number;
    property: {
      code: string;
      title: string;
    };
    owner: {
      fullName: string;
    };
  }>;
  rentLeads: Array<{
    id: string;
    code: string;
    pipelineStage: string;
    status: string;
    property: {
      code: string;
      title: string;
    } | null;
  }>;
};

export type PropertyListItem = {
  id: string;
  code: string;
  title: string;
  type: string;
  purpose: string;
  status: string;
  commercialSituation: string;
  city: string;
  district: string;
  salePrice: number | null;
  rentPrice: number | null;
  isPublished: boolean;
  owner: {
    id: string;
    fullName: string;
  };
  contractCount: number;
  visitCount: number;
  keyCount: number;
};

export type PropertyDetail = {
  id: string;
  code: string;
  title: string;
  type: string;
  purpose: string;
  status: string;
  commercialSituation: string;
  zipCode: string;
  state: string;
  city: string;
  district: string;
  street: string;
  streetNumber: string;
  complement: string | null;
  description: string | null;
  internalNotes: string | null;
  salePrice: number | null;
  rentPrice: number | null;
  condoFee: number | null;
  iptu: number | null;
  areaTotal: number | null;
  areaBuilt: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  suites: number | null;
  parkingSpots: number | null;
  floor: number | null;
  furnished: boolean;
  acceptsPet: boolean | null;
  isPublished: boolean;
  createdAt: string;
  owner: {
    id: string;
    fullName: string;
    document: string;
    phone: string | null;
    email: string | null;
  };
  metrics: {
    contractCount: number;
    visitCount: number;
    keyCount: number;
    saleLeadCount: number;
    rentLeadCount: number;
  };
  propertyKeys: Array<{
    id: string;
    identifier: string;
    currentStatus: string;
    currentHolderName: string | null;
    lastCheckoutAt: string | null;
  }>;
  visits: Array<{
    id: string;
    scheduledAt: string;
    status: string;
    outcome: string | null;
    broker: {
      fullName: string;
    };
  }>;
  contracts: Array<{
    id: string;
    code: string;
    status: string;
    startDate: string;
    endDate: string;
    rentAmount: number;
    tenant: {
      fullName: string;
    };
  }>;
};

export type UserListItem = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: string;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  roleCodes: string[];
  permissionCount: number;
};

export type UserDetail = UserListItem & {
  permissions: string[];
  auditLogs: Array<{
    id: string;
    action: string;
    description: string;
    createdAt: string;
  }>;
};

export type RoleItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  permissionCodes: string[];
};

export type AssignableUser = {
  id: string;
  fullName: string;
  roleCodes: string[];
};

export type SaleLeadListItem = {
  id: string;
  code: string;
  pipelineStage: string;
  status: string;
  source: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  desiredRegion: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  nextFollowUpAt: string | null;
  lastContactAt: string | null;
  createdAt: string;
  closedAt: string | null;
  property: {
    id: string;
    code: string;
    title: string;
    status: string;
  } | null;
  responsibleUser: {
    id: string;
    fullName: string;
  };
  visitCount: number;
};

export type SaleLeadDetail = SaleLeadListItem & {
  customerDocument: string | null;
  notes: string | null;
  lossReason: string | null;
  createdByUser: {
    fullName: string;
  };
  visits: Array<{
    id: string;
    scheduledAt: string;
    status: string;
    outcome: string | null;
    resultSummary: string | null;
    broker: {
      fullName: string;
    };
  }>;
  metrics: {
    visitCount: number;
  };
};

export type RentLeadListItem = {
  id: string;
  code: string;
  pipelineStage: string;
  status: string;
  source: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  desiredRegion: string | null;
  monthlyBudget: number | null;
  guaranteePreference: string | null;
  nextFollowUpAt: string | null;
  lastContactAt: string | null;
  createdAt: string;
  closedAt: string | null;
  property: {
    id: string;
    code: string;
    title: string;
    status: string;
  } | null;
  tenant: {
    id: string;
    fullName: string;
  } | null;
  responsibleUser: {
    id: string;
    fullName: string;
  };
  visitCount: number;
  contractCount: number;
};

export type RentLeadDetail = RentLeadListItem & {
  customerDocument: string | null;
  notes: string | null;
  lossReason: string | null;
  createdByUser: {
    fullName: string;
  };
  visits: Array<{
    id: string;
    scheduledAt: string;
    status: string;
    outcome: string | null;
    resultSummary: string | null;
    broker: {
      fullName: string;
    };
  }>;
  contracts: Array<{
    id: string;
    code: string;
    status: string;
    startDate: string;
    endDate: string;
    rentAmount: number;
  }>;
  metrics: {
    visitCount: number;
    contractCount: number;
  };
};

export type VisitListItem = {
  id: string;
  scheduledAt: string;
  completedAt: string | null;
  status: string;
  outcome: string | null;
  createdAt: string;
  property: {
    id: string;
    code: string;
    title: string;
  };
  broker: {
    id: string;
    fullName: string;
  };
  lead: {
    id: string;
    code: string;
    customerName: string;
    type: "SALE" | "RENT";
  } | null;
};

export type VisitDetail = VisitListItem & {
  notes: string | null;
  resultSummary: string | null;
  createdByUser: {
    fullName: string;
  };
};

export type PropertyKeyListItem = {
  id: string;
  identifier: string;
  description: string | null;
  isCopy: boolean;
  currentStatus: string;
  currentHolderType: string | null;
  currentHolderName: string | null;
  currentHolderDocument: string | null;
  lastCheckoutAt: string | null;
  lastCheckinAt: string | null;
  createdAt: string;
  expectedReturnAt: string | null;
  isOverdue: boolean;
  property: {
    id: string;
    code: string;
    title: string;
  };
};

export type PropertyKeyDetail = PropertyKeyListItem & {
  history: Array<{
    id: string;
    action: string;
    previousStatus: string | null;
    resultingStatus: string;
    holderType: string | null;
    holderName: string | null;
    holderDocument: string | null;
    checkoutAt: string | null;
    expectedReturnAt: string | null;
    returnedAt: string | null;
    notes: string | null;
    overrideReason: string | null;
    createdAt: string;
    responsibleUser: {
      fullName: string;
    } | null;
  }>;
};

export type ContractListItem = {
  id: string;
  code: string;
  originType: string;
  status: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  dueDay: number;
  guaranteeType: string;
  adjustmentIndex: string;
  createdAt: string;
  activatedAt: string | null;
  terminatedAt: string | null;
  property: {
    id: string;
    code: string;
    title: string;
    status: string;
    commercialSituation: string;
    purpose: string;
  };
  owner: {
    id: string;
    fullName: string;
    document: string;
  };
  tenant: {
    id: string;
    fullName: string;
    document: string;
  };
  rentLead: {
    id: string;
    code: string;
    customerName: string;
    pipelineStage: string;
    status: string;
  } | null;
  latestVersion: {
    id: string;
    versionNumber: number;
    status: string;
    templateName: string;
    templateVersion: string;
    pdfFileUrl: string | null;
    reviewedAt: string | null;
    createdAt: string;
    reviewedByUser: {
      fullName: string;
    } | null;
  } | null;
  versionCount: number;
  daysToEnd: number;
  isExpiringSoon: boolean;
};

export type ContractDetail = {
  id: string;
  code: string;
  originType: string;
  status: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  dueDay: number;
  guaranteeType: string;
  guaranteeDetails: string | null;
  adjustmentIndex: string;
  adjustmentFrequencyMonths: number;
  lateFeePercentage: number | null;
  penaltyDescription: string | null;
  responsibilities: string[];
  additionalClauses: string | null;
  legalWarningAcknowledgedAt: string | null;
  activatedAt: string | null;
  terminatedAt: string | null;
  terminationReason: string | null;
  createdAt: string;
  updatedAt: string;
  property: {
    id: string;
    code: string;
    title: string;
    type: string;
    purpose: string;
    status: string;
    commercialSituation: string;
    zipCode: string;
    state: string;
    city: string;
    district: string;
    street: string;
    streetNumber: string;
    complement: string | null;
  };
  owner: {
    id: string;
    fullName: string;
    document: string;
    email: string | null;
    phone: string | null;
  };
  tenant: {
    id: string;
    fullName: string;
    document: string;
    email: string | null;
    phone: string | null;
  };
  rentLead: {
    id: string;
    code: string;
    customerName: string;
    pipelineStage: string;
    status: string;
  } | null;
  createdByUser: {
    id: string;
    fullName: string;
    email: string;
  };
  versions: Array<{
    id: string;
    versionNumber: number;
    status: string;
    templateName: string;
    templateVersion: string;
    renderedHtml: string;
    renderedText: string | null;
    dataSnapshot: unknown;
    pdfFileUrl: string | null;
    reviewedAt: string | null;
    createdAt: string;
    reviewedByUser: {
      id: string;
      fullName: string;
    } | null;
    createdByUser: {
      id: string;
      fullName: string;
    };
  }>;
  metrics: {
    versionCount: number;
    daysToEnd: number;
    latestVersionId: string | null;
  };
};

export type PaginatedOwners = PaginatedResponse<OwnerListItem>;
export type PaginatedTenants = PaginatedResponse<TenantListItem>;
export type PaginatedProperties = PaginatedResponse<PropertyListItem>;
export type PaginatedUsers = PaginatedResponse<UserListItem>;
export type PaginatedSaleLeads = PaginatedResponse<SaleLeadListItem>;
export type PaginatedRentLeads = PaginatedResponse<RentLeadListItem>;
export type PaginatedVisits = PaginatedResponse<VisitListItem>;
export type PaginatedPropertyKeys = PaginatedResponse<PropertyKeyListItem>;
export type PaginatedContracts = PaginatedResponse<ContractListItem>;
