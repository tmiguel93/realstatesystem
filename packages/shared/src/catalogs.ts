export const personTypeOptions = [
  { value: "INDIVIDUAL", label: "Pessoa fisica" },
  { value: "COMPANY", label: "Pessoa juridica" },
] as const;

export const scoreStatusOptions = [
  { value: "NOT_ANALYZED", label: "Nao analisado" },
  { value: "APPROVED", label: "Aprovado" },
  { value: "RESTRICTED", label: "Restrito" },
  { value: "REJECTED", label: "Rejeitado" },
  { value: "UNDER_REVIEW", label: "Em analise" },
] as const;

export const propertyTypeOptions = [
  { value: "APARTMENT", label: "Apartamento" },
  { value: "HOUSE", label: "Casa" },
  { value: "COMMERCIAL", label: "Comercial" },
  { value: "LAND", label: "Terreno" },
  { value: "PENTHOUSE", label: "Cobertura" },
  { value: "WAREHOUSE", label: "Galpao" },
  { value: "RURAL", label: "Rural" },
  { value: "OTHER", label: "Outro" },
] as const;

export const propertyPurposeOptions = [
  { value: "SALE", label: "Venda" },
  { value: "RENT", label: "Locacao" },
  { value: "BOTH", label: "Venda e locacao" },
] as const;

export const propertyStatusOptions = [
  { value: "AVAILABLE", label: "Disponivel" },
  { value: "RESERVED", label: "Reservado" },
  { value: "RENTED", label: "Alugado" },
  { value: "SOLD", label: "Vendido" },
  { value: "UNDER_MAINTENANCE", label: "Em manutencao" },
  { value: "INACTIVE", label: "Inativo" },
] as const;

export const commercialSituationOptions = [
  { value: "AVAILABLE_FOR_SALE", label: "Disponivel para venda" },
  { value: "AVAILABLE_FOR_RENT", label: "Disponivel para locacao" },
  { value: "AVAILABLE_FOR_BOTH", label: "Disponivel para ambos" },
  { value: "SALE_IN_NEGOTIATION", label: "Venda em negociacao" },
  { value: "RENT_IN_NEGOTIATION", label: "Locacao em negociacao" },
  { value: "RENTED", label: "Alugado" },
  { value: "SOLD", label: "Vendido" },
  { value: "INACTIVE", label: "Inativo" },
] as const;

export const leadSourceOptions = [
  { value: "WEBSITE", label: "Website" },
  { value: "PORTAL", label: "Portal" },
  { value: "INDICATION", label: "Indicacao" },
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
  { value: "NEGOTIATION", label: "Em negociacao" },
  { value: "DOCUMENTATION", label: "Documentacao" },
  { value: "CLOSED", label: "Fechado" },
  { value: "LOST", label: "Perdido" },
] as const;

export const rentLeadStageOptions = [
  { value: "NEW_LEAD", label: "Novo lead" },
  { value: "CONTACT_STARTED", label: "Contato iniciado" },
  { value: "INTEREST_CONFIRMED", label: "Interesse confirmado" },
  { value: "VISIT_SCHEDULED", label: "Visita agendada" },
  { value: "PROFILE_ANALYSIS", label: "Analise de perfil" },
  { value: "PROPOSAL", label: "Proposta" },
  { value: "DOCUMENTATION", label: "Documentacao" },
  { value: "CONTRACT_GENERATED", label: "Contrato gerado" },
  { value: "SIGNATURE_PENDING", label: "Assinatura pendente" },
  { value: "ACTIVE", label: "Ativo" },
  { value: "LOST", label: "Perdido" },
] as const;

export const visitStatusOptions = [
  { value: "SCHEDULED", label: "Agendada" },
  { value: "CONFIRMED", label: "Confirmada" },
  { value: "COMPLETED", label: "Concluida" },
  { value: "NO_SHOW", label: "Nao compareceu" },
  { value: "CANCELLED", label: "Cancelada" },
] as const;

export const visitOutcomeOptions = [
  { value: "INTERESTED", label: "Interessado" },
  { value: "NEEDS_FOLLOW_UP", label: "Precisa de follow-up" },
  { value: "PROPOSAL_REQUESTED", label: "Solicitou proposta" },
  { value: "DISCARDED", label: "Descartado" },
  { value: "NO_DECISION", label: "Sem decisao" },
] as const;

export const keyStatusOptions = [
  { value: "AVAILABLE", label: "Disponivel" },
  { value: "CHECKED_OUT", label: "Retirada" },
  { value: "COPY", label: "Copia" },
  { value: "UNDER_MAINTENANCE", label: "Manutencao" },
  { value: "BLOCKED", label: "Bloqueada" },
  { value: "LOST", label: "Perdida" },
] as const;

export const keyActionOptions = [
  { value: "CHECKOUT", label: "Retirada" },
  { value: "CHECKIN", label: "Devolucao" },
  { value: "STATUS_CHANGE", label: "Mudanca de status" },
  { value: "MAINTENANCE_START", label: "Inicio de manutencao" },
  { value: "MAINTENANCE_END", label: "Fim de manutencao" },
  { value: "OVERRIDE", label: "Override" },
] as const;

export const holderTypeOptions = [
  { value: "INTERNAL_USER", label: "Usuario interno" },
  { value: "CLIENT", label: "Cliente" },
  { value: "OWNER", label: "Proprietario" },
  { value: "THIRD_PARTY", label: "Terceiro" },
] as const;

export const guaranteeTypeOptions = [
  { value: "NONE", label: "Sem garantia" },
  { value: "SECURITY_DEPOSIT", label: "Caucao" },
  { value: "GUARANTOR", label: "Fiador" },
  { value: "INSURANCE", label: "Seguro fianca" },
  { value: "TITLE_CAPITALIZATION", label: "Titulo de capitalizacao" },
  { value: "OTHER", label: "Outra" },
] as const;

export const contractOriginOptions = [
  { value: "RENT_PIPELINE", label: "Pipeline de locacao" },
  { value: "MANUAL", label: "Cadastro autorizado" },
] as const;

export const contractStatusOptions = [
  { value: "DRAFT", label: "Rascunho" },
  { value: "UNDER_REVIEW", label: "Em revisao" },
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

export const adjustmentIndexOptions = [
  { value: "IPCA", label: "IPCA" },
  { value: "IGP_M", label: "IGP-M" },
  { value: "INPC", label: "INPC" },
  { value: "FIXED", label: "Indice fixo" },
  { value: "OTHER", label: "Outro" },
] as const;

export const userStatusOptions = [
  { value: "ACTIVE", label: "Ativo" },
  { value: "INACTIVE", label: "Inativo" },
  { value: "LOCKED", label: "Bloqueado" },
] as const;

export const booleanOptions = [
  { value: "true", label: "Sim" },
  { value: "false", label: "Nao" },
] as const;

export const roleLabels = {
  MASTER_ADMIN: "Master Admin",
  USER_OPERACIONAL: "Usuario Operacional",
} as const;

export const permissionLabels = {
  "dashboard.read": "Dashboard",
  "reports.read": "Relatorios",
  "users.manage": "Usuarios",
  "access.manage": "Controle de acesso",
  "settings.manage": "Configuracoes",
  "owners.read": "Leitura de proprietarios",
  "owners.write": "Edicao de proprietarios",
  "tenants.read": "Leitura de locatarios",
  "tenants.write": "Edicao de locatarios",
  "properties.read": "Leitura de imoveis",
  "properties.write": "Edicao de imoveis",
  "saleLeads.read": "Leitura de leads de venda",
  "saleLeads.write": "Edicao de leads de venda",
  "rentLeads.read": "Leitura de leads de locacao",
  "rentLeads.write": "Edicao de leads de locacao",
  "visits.read": "Leitura de visitas",
  "visits.write": "Edicao de visitas",
  "keys.read": "Leitura de chaves",
  "keys.write": "Edicao de chaves",
  "keys.override": "Override de chaves",
  "contracts.read": "Leitura de contratos",
  "contracts.generate": "Geracao de contratos",
  "contracts.review": "Revisao de contratos",
  "contracts.export": "Exportacao de contratos",
  "audit.read": "Auditoria",
} as const;
