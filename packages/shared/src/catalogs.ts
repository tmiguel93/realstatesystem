export const personTypeOptions = [
  { value: "INDIVIDUAL", label: "Pessoa física" },
  { value: "COMPANY", label: "Pessoa jurídica" },
] as const;

export const contactRoleOptions = [
  { value: "OWNER", label: "Proprietário" },
  { value: "TENANT", label: "Locatário" },
  { value: "BUYER", label: "Comprador" },
  { value: "GUARANTOR", label: "Fiador" },
  { value: "EXTERNAL_BROKER", label: "Corretor externo" },
] as const;

export const scoreStatusOptions = [
  { value: "NOT_ANALYZED", label: "Não analisado" },
  { value: "APPROVED", label: "Aprovado" },
  { value: "RESTRICTED", label: "Restrito" },
  { value: "REJECTED", label: "Rejeitado" },
  { value: "UNDER_REVIEW", label: "Em análise" },
] as const;

export const propertyTypeOptions = [
  { value: "APARTMENT", label: "Apartamento" },
  { value: "HOUSE", label: "Casa" },
  { value: "COMMERCIAL", label: "Comercial" },
  { value: "LAND", label: "Terreno" },
  { value: "PENTHOUSE", label: "Cobertura" },
  { value: "WAREHOUSE", label: "Galpão" },
  { value: "RURAL", label: "Rural" },
  { value: "OTHER", label: "Outro" },
] as const;

export const propertyPurposeOptions = [
  { value: "SALE", label: "Venda" },
  { value: "RENT", label: "Locação" },
  { value: "BOTH", label: "Venda e locação" },
] as const;

export const propertyStatusOptions = [
  { value: "AVAILABLE", label: "Disponível" },
  { value: "RESERVED", label: "Reservado" },
  { value: "RENTED", label: "Alugado" },
  { value: "SOLD", label: "Vendido" },
  { value: "UNDER_MAINTENANCE", label: "Em manutenção" },
  { value: "INACTIVE", label: "Inativo" },
] as const;

export const commercialSituationOptions = [
  { value: "AVAILABLE_FOR_SALE", label: "Disponível para venda" },
  { value: "AVAILABLE_FOR_RENT", label: "Disponível para locação" },
  { value: "AVAILABLE_FOR_BOTH", label: "Disponível para ambos" },
  { value: "SALE_IN_NEGOTIATION", label: "Venda em negociação" },
  { value: "RENT_IN_NEGOTIATION", label: "Locação em negociação" },
  { value: "RENTED", label: "Alugado" },
  { value: "SOLD", label: "Vendido" },
  { value: "INACTIVE", label: "Inativo" },
] as const;

export const leadSourceOptions = [
  { value: "WEBSITE", label: "Website" },
  { value: "PORTAL", label: "Portal" },
  { value: "INDICATION", label: "Indicação" },
  { value: "WALK_IN", label: "Atendimento presencial" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "PHONE", label: "Telefone" },
  { value: "OTHER", label: "Outro" },
] as const;

export const leadStatusOptions = [
  { value: "OPEN", label: "Em aberto" },
  { value: "WON", label: "Ganho" },
  { value: "LOST", label: "Perdido" },
  { value: "ARCHIVED", label: "Arquivado" },
] as const;

export const saleLeadStageOptions = [
  { value: "NEW_LEAD", label: "Novo lead" },
  { value: "CONTACT_STARTED", label: "Contato iniciado" },
  { value: "INTEREST_CONFIRMED", label: "Interesse confirmado" },
  { value: "VISIT_SCHEDULED", label: "Visita agendada" },
  { value: "PROPOSAL_SENT", label: "Proposta enviada" },
  { value: "NEGOTIATION", label: "Em negociação" },
  { value: "DOCUMENTATION", label: "Documentação" },
  { value: "CLOSED", label: "Fechado" },
  { value: "LOST", label: "Perdido" },
] as const;

export const rentLeadStageOptions = [
  { value: "NEW_LEAD", label: "Novo lead" },
  { value: "CONTACT_STARTED", label: "Contato iniciado" },
  { value: "INTEREST_CONFIRMED", label: "Interesse confirmado" },
  { value: "VISIT_SCHEDULED", label: "Visita agendada" },
  { value: "PROFILE_ANALYSIS", label: "Análise de perfil" },
  { value: "PROPOSAL", label: "Proposta" },
  { value: "DOCUMENTATION", label: "Documentação" },
  { value: "CONTRACT_GENERATED", label: "Contrato gerado" },
  { value: "SIGNATURE_PENDING", label: "Assinatura pendente" },
  { value: "ACTIVE", label: "Ativo" },
  { value: "LOST", label: "Perdido" },
] as const;

export const visitStatusOptions = [
  { value: "SCHEDULED", label: "Agendada" },
  { value: "CONFIRMED", label: "Confirmada" },
  { value: "COMPLETED", label: "Concluída" },
  { value: "NO_SHOW", label: "Não compareceu" },
  { value: "CANCELLED", label: "Cancelada" },
] as const;

export const visitOutcomeOptions = [
  { value: "INTERESTED", label: "Interessado" },
  { value: "NEEDS_FOLLOW_UP", label: "Precisa de follow-up" },
  { value: "PROPOSAL_REQUESTED", label: "Solicitou proposta" },
  { value: "DISCARDED", label: "Descartado" },
  { value: "NO_DECISION", label: "Sem decisão" },
] as const;

export const keyStatusOptions = [
  { value: "AVAILABLE", label: "Disponível" },
  { value: "CHECKED_OUT", label: "Retirada" },
  { value: "COPY", label: "Cópia" },
  { value: "UNDER_MAINTENANCE", label: "Manutenção" },
  { value: "BLOCKED", label: "Bloqueada" },
  { value: "LOST", label: "Perdida" },
] as const;

export const keyActionOptions = [
  { value: "CHECKOUT", label: "Retirada" },
  { value: "CHECKIN", label: "Devolução" },
  { value: "STATUS_CHANGE", label: "Mudança de status" },
  { value: "MAINTENANCE_START", label: "Início de manutenção" },
  { value: "MAINTENANCE_END", label: "Fim de manutenção" },
  { value: "OVERRIDE", label: "Override" },
] as const;

export const holderTypeOptions = [
  { value: "INTERNAL_USER", label: "Usuário interno" },
  { value: "CLIENT", label: "Cliente" },
  { value: "OWNER", label: "Proprietário" },
  { value: "THIRD_PARTY", label: "Terceiro" },
] as const;

export const maintenanceTicketTypeOptions = [
  { value: "STRUCTURAL", label: "Estrutural" },
  { value: "INTERNAL", label: "Interno" },
  { value: "EXTERNAL", label: "Externo" },
  { value: "HYDRAULIC", label: "Hidráulico" },
  { value: "ELECTRICAL", label: "Elétrico" },
  { value: "ROOFING", label: "Telhado / cobertura" },
  { value: "LEAKAGE", label: "Infiltração / vazamento" },
  { value: "SEWAGE", label: "Esgoto / drenagem" },
  { value: "PAINTING", label: "Pintura / acabamento" },
  { value: "DOORS_WINDOWS", label: "Portas / janelas" },
  { value: "LOCKS_SECURITY", label: "Fechadura / segurança" },
  {
    value: "HVAC",
    label: "Climatização / ar-condicionado / ventilação",
  },
  { value: "GAS", label: "Gás" },
  { value: "PEST_CONTROL", label: "Pragas / dedetização" },
  { value: "LANDSCAPING", label: "Paisagismo / área externa" },
  { value: "TECHNICAL_CLEANING", label: "Limpeza técnica" },
  {
    value: "EQUIPMENT",
    label: "Equipamentos / eletrodomésticos vinculados ao imóvel",
  },
  { value: "FIXED_FURNITURE", label: "Mobiliário fixo" },
  { value: "PREVENTIVE", label: "Preventiva" },
  { value: "CORRECTIVE", label: "Corretiva" },
  { value: "EMERGENCY", label: "Emergencial" },
  { value: "CONDOMINIUM", label: "Condomínio" },
  { value: "OTHER", label: "Outros" },
] as const;

export const maintenanceTicketStatusOptions = [
  { value: "OPEN", label: "Aberto" },
  { value: "TRIAGE", label: "Em análise" },
  { value: "WAITING_APPROVAL", label: "Aprovado" },
  { value: "WAITING_PROVIDER", label: "Aguardando orçamento" },
  { value: "IN_PROGRESS", label: "Em execução" },
  { value: "WAITING_MATERIAL", label: "Aguardando material" },
  { value: "RESOLVED", label: "Resolvido" },
  { value: "FINISHED", label: "Finalizado" },
  { value: "CANCELLED", label: "Cancelado" },
] as const;

export const maintenanceSimpleStatusOptions =
  maintenanceTicketStatusOptions.filter((item) =>
    [
      "OPEN",
      "TRIAGE",
      "WAITING_PROVIDER",
      "WAITING_APPROVAL",
      "IN_PROGRESS",
      "RESOLVED",
      "CANCELLED",
    ].includes(item.value),
  );

export const maintenanceKanbanStatusOptions =
  maintenanceTicketStatusOptions.filter((item) => item.value !== "CANCELLED");

export const maintenanceTriageDecisionOptions = [
  { value: "EMERGENCY", label: "Emergencial" },
  { value: "NEEDS_QUOTE", label: "Precisa orçamento" },
  { value: "INTERNAL_REPAIR", label: "Resolver internamente" },
] as const;

export const maintenanceUrgencyOptions = [
  { value: "1", label: "1 · Baixa" },
  { value: "2", label: "2 · Moderada" },
  { value: "3", label: "3 · Alta" },
  { value: "4", label: "4 · Muito alta" },
  { value: "5", label: "5 · Urgentíssima" },
] as const;

export const guaranteeTypeOptions = [
  { value: "NONE", label: "Sem garantia" },
  { value: "SECURITY_DEPOSIT", label: "Caução" },
  { value: "GUARANTOR", label: "Fiador" },
  { value: "INSURANCE", label: "Seguro-fiança" },
  { value: "TITLE_CAPITALIZATION", label: "Título de capitalização" },
  { value: "OTHER", label: "Outra" },
] as const;

export const contractOriginOptions = [
  { value: "RENT_PIPELINE", label: "Pipeline de locação" },
  { value: "MANUAL", label: "Cadastro autorizado" },
] as const;

export const contractStatusOptions = [
  { value: "DRAFT", label: "Rascunho" },
  { value: "UNDER_REVIEW", label: "Em revisão" },
  { value: "PENDING_SIGNATURE", label: "Assinatura pendente" },
  { value: "ACTIVE", label: "Ativo" },
  { value: "RENEWED", label: "Renovado" },
  { value: "TERMINATED", label: "Encerrado" },
  { value: "CANCELLED", label: "Cancelado" },
  { value: "EXPIRED", label: "Expirado" },
] as const;

export const contractVersionStatusOptions = [
  { value: "DRAFT", label: "Rascunho" },
  { value: "REVIEWED", label: "Revisado" },
  { value: "FINALIZED", label: "Finalizado" },
  { value: "CANCELLED", label: "Cancelado" },
] as const;

export const contractChecklistItemTypeOptions = [
  { value: "DOCUMENTS", label: "Documentos" },
  { value: "BANK_DETAILS", label: "Dados bancários" },
  { value: "GUARANTEE", label: "Garantia" },
  { value: "DUE_DAY", label: "Vencimento" },
  { value: "INSPECTION", label: "Vistoria" },
  { value: "APPROVAL", label: "Aprovação" },
] as const;

export const contractChecklistStatusOptions = [
  { value: "PENDING", label: "Pendente" },
  { value: "IN_ANALYSIS", label: "Em análise" },
  { value: "APPROVED", label: "Aprovado" },
  { value: "REJECTED", label: "Reprovado" },
  { value: "NOT_APPLICABLE", label: "Não se aplica" },
] as const;

export const requiredContractChecklistItemTypes = [
  "DOCUMENTS",
  "BANK_DETAILS",
  "GUARANTEE",
  "DUE_DAY",
  "INSPECTION",
  "APPROVAL",
] as const;

export const adjustmentIndexOptions = [
  { value: "IPCA", label: "IPCA" },
  { value: "IGP_M", label: "IGP-M" },
  { value: "INPC", label: "INPC" },
  { value: "FIXED", label: "Índice fixo" },
  { value: "OTHER", label: "Outro" },
] as const;

export const userStatusOptions = [
  { value: "ACTIVE", label: "Ativo" },
  { value: "INACTIVE", label: "Inativo" },
  { value: "LOCKED", label: "Bloqueado" },
] as const;

export const booleanOptions = [
  { value: "true", label: "Sim" },
  { value: "false", label: "Não" },
] as const;

export const themeOptions = [
  { value: "SYSTEM", label: "Seguir o sistema" },
  { value: "LIGHT", label: "Claro" },
  { value: "DARK", label: "Escuro" },
] as const;

export const localeOptions = [
  { value: "PT_BR", label: "Português (Brasil)" },
  { value: "EN", label: "English" },
  { value: "ES", label: "Español" },
] as const;

export const severitySourceOptions = [
  { value: "RULE", label: "Automático por regra" },
  { value: "MANUAL", label: "Revisado manualmente" },
] as const;

export const tenantPortalAccessStatusOptions = [
  { value: "ACTIVE", label: "Ativo" },
  { value: "INACTIVE", label: "Inativo" },
  { value: "PENDING", label: "Pendente" },
] as const;

export const roleLabels = {
  MASTER_ADMIN: "Master",
  USER_OPERACIONAL: "Usuário operacional",
  BROKER: "Corretor",
  RENT_ATTENDANT: "Atendente de locação",
  MAINTENANCE_TEAM: "Setor de manutenção",
  TENANT_PORTAL: "Portal do locatário",
} as const;

export const permissionLabels = {
  "dashboard.read": "Leitura do dashboard principal",
  "reports.read": "Leitura de relatórios",
  "users.manage": "Gestão de usuários",
  "access.manage": "Gestão de perfis e permissões",
  "settings.manage": "Gestão de configurações",
  "preferences.manage": "Gestão de preferências",
  "contacts.read": "Leitura de contatos unificados",
  "contacts.write": "Edição de contatos unificados",
  "owners.read": "Leitura de proprietários",
  "owners.write": "Edição de proprietários",
  "tenants.read": "Leitura de locatários",
  "tenants.write": "Edição de locatários",
  "properties.read": "Leitura de imóveis",
  "properties.write": "Edição de imóveis",
  "propertyImages.read": "Leitura de fotos do imóvel",
  "propertyImages.write": "Gestão de fotos do imóvel",
  "saleLeads.read": "Leitura de oportunidades de venda",
  "saleLeads.write": "Edição de oportunidades de venda",
  "rentLeads.read": "Leitura de oportunidades de locação",
  "rentLeads.write": "Edição de oportunidades de locação",
  "visits.read": "Leitura de visitas",
  "visits.write": "Edição de visitas",
  "keys.read": "Leitura de chaves",
  "keys.write": "Edição de chaves",
  "keys.override": "Override de chaves",
  "contracts.read": "Leitura de contratos",
  "contracts.generate": "Geração de contratos",
  "contracts.review": "Revisão de contratos",
  "contracts.export": "Exportação de contratos",
  "leaseTermination.rules.manage": "Parametrização de rescisão",
  "leaseTermination.simulate": "Simulação de baixa contratual",
  "leaseTermination.execute": "Confirmação de baixa contratual",
  "maintenance.read": "Leitura de chamados de manutenção",
  "maintenance.write": "Edição de chamados de manutenção",
  "maintenance.override": "Override de manutenção",
  "maintenance.portal.open": "Abertura de chamado pelo portal",
  "tenantPortal.access": "Acesso ao portal do locatário",
  "audit.read": "Leitura de auditoria",
} as const;
