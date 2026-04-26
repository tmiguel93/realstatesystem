export const supportedLocales = ["PT_BR", "EN", "ES"] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

export const messages = {
  PT_BR: {
    common: {
      searchPlaceholder: "Buscar imóvel, lead, visita, contrato ou cliente",
      save: "Salvar",
      cancel: "Cancelar",
      close: "Fechar",
      loading: "Carregando",
      noData: "Nenhum registro encontrado.",
      logout: "Sair",
      preferencesSaved: "Preferências atualizadas com sucesso.",
      preferencesError: "Não foi possível atualizar suas preferências agora.",
      notInformed: "Não informado",
      back: "Voltar",
      confirm: "Confirmar",
      upload: "Enviar",
      add: "Adicionar",
      description: "Descrição",
      amount: "Valor",
      noneRegisteredYet: "Nenhum item cadastrado até agora.",
    },
    layout: {
      sections: {
        overview: "Visão",
        registry: "Cadastros",
        operation: "Operação",
        management: "Gestão",
        tenant: "Locatário",
      },
      menu: {
        dashboard: "Dashboard",
        properties: "Imóveis",
        owners: "Proprietários",
        tenants: "Locatários",
        sales: "Vendas",
        rents: "Locação",
        visits: "Visitas",
        keys: "Chaves",
        maintenance: "Manutenção",
        contracts: "Contratos",
        users: "Usuários",
        access: "Perfis e permissões",
        settings: "Configurações",
        tenantPortal: "Portal do locatário",
      },
      notificationsTitle: "Alertas",
      notificationsDescription:
        "Chamados em SLA crítico, contratos sensíveis e itens operacionais que exigem atenção.",
      notificationsEmpty: "Nenhuma notificação operacional no momento.",
      alertsCount: "{count} alerta(s)",
      themeToggleTitle: "Alternar tema",
    },
    auth: {
      heroTag: "SaaS imobiliário",
      heroTitle:
        "Administração imobiliária com postura comercial e operação madura.",
      heroDescription:
        "Centralize contratos, chaves, visitas, pipelines e acessos em uma plataforma desenhada para produtividade real.",
      featureRbacTitle: "RBAC real",
      featureRbacText:
        "Permissões granulares e rotas protegidas de ponta a ponta.",
      featureSessionTitle: "Sessão segura",
      featureSessionText:
        "JWT curto, refresh token e trilha básica de auditoria.",
      featureScaleTitle: "Base escalável",
      featureScaleText:
        "Arquitetura pronta para contratos, visitas e operação multiusuário.",
      secureAccessEyebrow: "Acesso seguro",
      loginTitle: "Acesse sua operação imobiliária",
      loginDescription:
        "Entre com suas credenciais para acompanhar imóveis, contratos e manutenção em um só lugar.",
      emailLabel: "E-mail",
      passwordLabel: "Senha",
      submit: "Entrar no sistema",
      forgotPassword: "Esqueci minha senha",
      keepSession: "Manter sessão",
      securityNote:
        "Ambiente protegido com autenticação segura, controle de acesso e experiência administrativa desenhada para operação profissional.",
      recoveryTitle: "Recuperar acesso",
      recoveryDescription:
        "Informe seu e-mail para receber a instrução de redefinição.",
      recoverySubmit: "Enviar instruções",
      backToLogin: "Voltar para o login",
      sending: "Enviando...",
      signingIn: "Entrando...",
      loadingSession: "Validando sua sessão...",
      logoutSuccess: "Sessão encerrada.",
      loginSuccess: "Bem-vindo de volta, {name}.",
    },
    dashboard: {
      prioritiesTitle: "Prioridades do escritório",
      priorities: [
        "Mantenha visitas e leads sempre vinculados ao imóvel correto para preservar rastreabilidade.",
        "Use o controle de chaves como rotina diária para evitar perda de contexto operacional.",
        "Revise contratos próximos do vencimento e acompanhe renovações com antecedência.",
      ],
      stats: {
        availableProperties: "Imóveis disponíveis",
        visitsToday: "Visitas do dia",
        activeContracts: "Contratos ativos",
        checkedOutKeys: "Chaves em posse",
        openSaleLeads: "Oportunidades em vendas",
        openRentLeads: "Oportunidades em locação",
      },
      statsDetails: {
        availableProperties:
          "Ativos liberados para venda ou loca\u00e7\u00e3o no momento.",
        visitsToday: "Compromissos confirmados para a agenda atual.",
        activeContracts:
          "Loca\u00e7\u00f5es em vig\u00eancia acompanhadas pela opera\u00e7\u00e3o.",
        checkedOutKeys:
          "Itens em circula\u00e7\u00e3o que pedem controle de devolu\u00e7\u00e3o.",
        openSaleLeads: "Leads comerciais ainda ativos no pipeline de vendas.",
        openRentLeads:
          "Leads de loca\u00e7\u00e3o em andamento e sob acompanhamento.",
      },
      dailyRoutine: {
        eyebrow: "Rotina operacional",
        title: "Rotina do Dia",
        description:
          "Priorize visitas, chaves, contratos, chamados e leads que precisam de a\u00e7\u00e3o hoje.",
        refreshedAt: "Atualizado \u00e0s {time}",
        unavailable:
          "N\u00e3o foi poss\u00edvel carregar a rotina agora. Tente atualizar o dashboard em alguns instantes.",
        noPermissionAction: "Sem acesso a esta tela",
        alerts: {
          OVERDUE: "Atrasado",
          DUE_TODAY: "Vence hoje",
          URGENT: "Urgente",
          UNASSIGNED: "Sem respons\u00e1vel",
          noAlert: "Sem alerta",
        },
        items: {
          visits: {
            title: "Visitas de hoje",
            description:
              "{overdue} visita(s) j\u00e1 deveriam ter acontecido e pedem confer\u00eancia.",
            action: "Abrir agenda",
          },
          keys: {
            title: "Chaves fora",
            description:
              "{overdue} atrasada(s) e {unassigned} sem respons\u00e1vel informado.",
            action: "Ver chaves",
          },
          contracts: {
            title: "Contratos vencendo",
            description:
              "{dueToday} vence(m) hoje, {overdue} est\u00e3o atrasado(s) e a janela \u00e9 de {days} dias.",
            action: "Ver contratos",
          },
          maintenance: {
            title: "Chamados cr\u00edticos",
            description:
              "{urgent} urgente(s), {overdue} vencido(s) no SLA e {unassigned} sem respons\u00e1vel.",
            action: "Abrir chamados",
          },
          leads: {
            title: "Leads sem retorno",
            description:
              "{overdue} atrasado(s), {dueToday} para hoje, {sales} de venda e {rents} de loca\u00e7\u00e3o.",
            action: "Revisar leads",
          },
        },
      },
    },
    settings: {
      eyebrow: "Preferências",
      title: "Configurações pessoais",
      description:
        "Ajuste idioma, tema e preferências da sua experiência administrativa.",
      themeTitle: "Tema visual",
      themeDescription:
        "Escolha entre modo claro, escuro ou siga a preferência do sistema.",
      themeResolved: "Tema resolvido agora: {theme}.",
      themeResolvedLight: "claro",
      themeResolvedDark: "escuro",
      languageTitle: "Idioma",
      languageDescription:
        "Selecione o idioma principal da interface. Telas novas já nascem preparadas para múltiplos idiomas.",
      localePrimary: "Idioma padrão inicial do produto.",
      localeSecondary:
        "Idioma adicional pronto para expansão gradual das telas.",
      saveButton: "Aplicar preferências",
      legalNote:
        "As preferências são salvas para sua conta e respeitadas em novos acessos.",
    },
    tenantPortal: {
      eyebrow: "Portal",
      title: "Portal do locatário",
      description:
        "Acompanhe seu contrato ativo e abra chamados de manutenção com evidências.",
      newTicket: "Abrir chamado",
      myContracts: "Contratos ativos",
      myTickets: "Chamados recentes",
      newTicketTitle: "Novo chamado de manutenção",
      newTicketDescription:
        "Descreva o problema com clareza e anexe fotos quando houver evidência visual.",
      noPortal: "Seu acesso ao portal ainda não está liberado.",
      noContracts: "Nenhum contrato ativo vinculado ao seu acesso.",
      noCoverPhoto: "Sem foto de capa",
      contractLabel: "Contrato",
      termLabel: "Vigência",
      rentLabel: "Aluguel",
      ownerLabel: "Proprietário",
      recentHistoryDescription:
        "Histórico recente dos chamados abertos por este acesso.",
      urgencyLabel: "Urgência {level}",
      autoAssessment: "Classificação automática registrada.",
      emptyRecentTickets: "Quando você abrir chamados, eles aparecerão aqui.",
      openTicketSectionTitle: "Abertura de chamado",
      openTicketSectionDescription:
        "O imóvel precisa estar vinculado a um contrato ativo deste acesso.",
      propertyLabel: "Imóvel",
      propertyPlaceholder: "Selecione o imóvel",
      typeLabel: "Tipo do chamado",
      typePlaceholder: "Selecione o tipo",
      descriptionLabel: "Descrição detalhada",
      descriptionPlaceholder:
        "Explique o problema, o impacto no uso do imóvel e qualquer risco percebido.",
      notesLabel: "Observação complementar",
      notesPlaceholder:
        "Campo opcional para complementar o contexto do atendimento.",
      evidenceTitle: "Fotos e evidências",
      evidenceRequired:
        "Para este tipo de chamado, ao menos uma foto é obrigatória.",
      evidenceOptional: "Você pode anexar fotos para ajudar na triagem.",
      selectFiles: "Selecionar arquivos",
      ticketOpenedSuccess: "Chamado aberto com sucesso no portal.",
      evidenceRequiredError:
        "Este tipo de chamado exige ao menos uma foto.",
    },
    accessManagement: {
      title: "Perfis e permissões",
      description:
        "Ajuste o RBAC por função sem quebrar a arquitetura de permissões do sistema.",
      roles: "Perfis disponíveis",
      permissions: "Permissões por perfil",
      saveRole: "Salvar permissões",
      updated: "Permissões do perfil atualizadas.",
      rolesDescription:
        "Os perfis permanecem dinâmicos e refletem o RBAC aplicado no backend.",
      inheritedPermissions: "{count} permissão(ões) herdada(s)",
      editHint: "Selecione um perfil para revisar a matriz de acesso.",
      noSelectionTitle: "Nenhum perfil selecionado",
      noSelectionDescription:
        "Selecione um perfil para editar suas permissões.",
      permissionMeta: "{action} · {code}",
    },
    leaseTermination: {
      eyebrow: "Baixa contratual",
      rulesTitle: "Parametrização de rescisão",
      rulesDescription:
        "Defina as regras operacionais usadas na baixa de contratos de locação.",
      confirmTitle: "Confirmação de baixa contratual",
      confirmDescription:
        "Revise os valores, registre o motivo e conclua a baixa com histórico.",
      simulationTitle: "Simulação de baixa contratual",
      simulationDescription:
        "Calcule a rescisão com memória de cálculo auditável antes de concluir a baixa.",
      legalWarning:
        "Este cálculo é operacional e deve passar por revisão administrativa e jurídica antes da conclusão.",
      ruleSaveSuccess: "Regra de rescisão salva com sucesso.",
      simulationSaveSuccess: "Simulação de baixa gerada com sucesso.",
      confirmSuccess: "Baixa contratual concluída com sucesso.",
      existingRulesTitle: "Regras existentes",
      existingRulesDescription:
        "Cada regra preserva parâmetros auditáveis e pode ser ativada pelo MASTER.",
      newRuleTitle: "Nova regra",
      newRuleDescription:
        "Crie uma parametrização adicional para cenários específicos.",
      activeBadge: "Ativa",
      ruleSummary:
        "Multa base de {penalty}% · {mode}.",
      proportionalMode: "proporcional",
      fixedMode: "fixa",
      editorTitle: "Editor da regra",
      editorDescription:
        "A parametrização é operacional, auditável e não substitui análise jurídica.",
      nameLabel: "Nome da regra",
      penaltyLabel: "Percentual de multa",
      formulaLabel: "Descrição da fórmula",
      standardNotesLabel: "Observações padrão",
      supportLabel: "Texto jurídico-operacional de apoio",
      proportionalLabel: "Aplicar proporcionalidade pelo tempo restante",
      manualAdjustLabel: "Permitir ajustes manuais",
      activeLabel: "Marcar como regra ativa",
      additionalChargesTitle: "Cobranças adicionais",
      additionalChargesDescription:
        "Valores padrão que podem compor a memória de cálculo.",
      discountsTitle: "Isenções e descontos",
      discountsDescription:
        "Itens padrão para abatimento configurável.",
      rulesSaveButton: "Salvar regra",
      rulesSavingButton: "Salvando...",
      simulationParametersTitle: "Parâmetros da simulação",
      ruleAppliedLabel: "Regra aplicada",
      manualPenaltyLabel: "Percentual manual de multa",
      simulationReasonLabel: "Motivo da simulação",
      simulationNotesLabel: "Observações operacionais",
      openRulesButton: "Abrir regras",
      generateSimulationButton: "Gerar simulação",
      calculatingButton: "Calculando...",
      memoryTitle: "Memória de cálculo",
      estimatedFinalValue: "Valor final estimado",
      remainingMonths: "Meses restantes",
      calculatedPenalty: "Multa calculada",
      additionalCharges: "Cobranças adicionais",
      discounts: "Descontos",
      finalAmount: "Total final",
      proceedToConfirmation: "Seguir para confirmação",
      emptyMemory:
        "Gere uma simulação para visualizar a memória de cálculo.",
      importantNoticeTitle: "Aviso importante",
      missingSimulationDescription:
        "Nenhuma simulação válida foi encontrada. Gere a simulação antes de confirmar a baixa.",
      backToSimulationButton: "Voltar para a simulação",
      summaryTitle: "Resumo da baixa",
      finalConfirmationTitle: "Confirmação final",
      terminationReasonLabel: "Motivo da baixa",
      finalNotesLabel: "Observações finais",
      confirmingButton: "Confirmando...",
      finishTerminationButton: "Concluir baixa",
    },
    propertyImages: {
      title: "Galeria do imóvel",
      uploadTitle: "Upload de fotos",
      uploadDescription:
        "Envie imagens JPEG, PNG ou WEBP com até 8 MB por arquivo.",
      emptyTitle: "Galeria ainda vazia",
      emptyDescription:
        "Adicione fotos do imóvel para enriquecer o detalhe comercial e a consulta operacional.",
      makeCover: "Tornar capa",
      reorder: "Reordenar",
      remove: "Remover",
      sendPhotos: "Enviar fotos",
      sendingPhotos: "Enviando...",
      selectPhotos: "Selecionar fotos",
      cover: "Capa",
      uploadSuccess: "Fotos do imóvel enviadas com sucesso.",
      coverUpdated: "Foto de capa atualizada.",
      removedSuccess: "Foto removida da galeria.",
      reorderedSuccess: "Ordem da galeria atualizada.",
      panelDescription:
        "Acompanhe a apresentação visual de {property}, defina a capa e mantenha a ordem comercial das fotos.",
    },
  },
  EN: {
    common: {
      searchPlaceholder: "Search property, lead, visit, contract or client",
      save: "Save",
      cancel: "Cancel",
      close: "Close",
      loading: "Loading",
      noData: "No records found.",
      logout: "Sign out",
      preferencesSaved: "Preferences updated successfully.",
      preferencesError: "Unable to update your preferences right now.",
      notInformed: "Not informed",
      back: "Back",
      confirm: "Confirm",
      upload: "Upload",
      add: "Add",
      description: "Description",
      amount: "Amount",
      noneRegisteredYet: "No items added yet.",
    },
    layout: {
      sections: {
        overview: "Overview",
        registry: "Registry",
        operation: "Operations",
        management: "Management",
        tenant: "Tenant",
      },
      menu: {
        dashboard: "Dashboard",
        properties: "Properties",
        owners: "Owners",
        tenants: "Tenants",
        sales: "Sales",
        rents: "Rentals",
        visits: "Visits",
        keys: "Keys",
        maintenance: "Maintenance",
        contracts: "Contracts",
        users: "Users",
        access: "Roles and permissions",
        settings: "Settings",
        tenantPortal: "Tenant portal",
      },
      notificationsTitle: "Alerts",
      notificationsDescription:
        "Critical SLA tickets, sensitive contracts and operational items that need attention.",
      notificationsEmpty: "No operational notifications right now.",
      alertsCount: "{count} alert(s)",
      themeToggleTitle: "Toggle theme",
    },
    auth: {
      heroTag: "Real estate SaaS",
      heroTitle: "Real estate management with commercial maturity.",
      heroDescription:
        "Centralize contracts, keys, visits, pipelines and access in a platform built for real productivity.",
      featureRbacTitle: "Real RBAC",
      featureRbacText:
        "Granular permissions and protected routes end to end.",
      featureSessionTitle: "Secure session",
      featureSessionText:
        "Short-lived JWT, refresh token and basic audit trail.",
      featureScaleTitle: "Scalable foundation",
      featureScaleText:
        "Architecture ready for contracts, visits and multi-user operations.",
      secureAccessEyebrow: "Secure access",
      loginTitle: "Access your real estate operation",
      loginDescription:
        "Sign in to manage properties, contracts and maintenance in one place.",
      emailLabel: "Email",
      passwordLabel: "Password",
      submit: "Sign in",
      forgotPassword: "Forgot my password",
      keepSession: "Keep session",
      securityNote:
        "Protected environment with secure authentication, access control and an admin experience designed for professional operations.",
      recoveryTitle: "Recover access",
      recoveryDescription:
        "Enter your email address to receive reset instructions.",
      recoverySubmit: "Send instructions",
      backToLogin: "Back to login",
      sending: "Sending...",
      signingIn: "Signing in...",
      loadingSession: "Validating your session...",
      logoutSuccess: "Session closed.",
      loginSuccess: "Welcome back, {name}.",
    },
    dashboard: {
      prioritiesTitle: "Office priorities",
      priorities: [
        "Keep visits and leads linked to the correct property to preserve traceability.",
        "Use key control as a daily routine to avoid operational blind spots.",
        "Review contracts close to expiration and track renewals in advance.",
      ],
      stats: {
        availableProperties: "Available properties",
        visitsToday: "Today's visits",
        activeContracts: "Active contracts",
        checkedOutKeys: "Checked-out keys",
        openSaleLeads: "Open sales opportunities",
        openRentLeads: "Open rental opportunities",
      },
      statsDetails: {
        availableProperties: "Assets currently released for sale or rent.",
        visitsToday: "Confirmed appointments for the current agenda.",
        activeContracts: "Active rentals tracked by the operation.",
        checkedOutKeys: "Items in circulation that require return control.",
        openSaleLeads: "Commercial leads still active in the sales pipeline.",
        openRentLeads: "Rental leads in progress and under follow-up.",
      },
      dailyRoutine: {
        eyebrow: "Operational routine",
        title: "Daily Routine",
        description:
          "Prioritize visits, keys, contracts, tickets and leads that need action today.",
        refreshedAt: "Updated at {time}",
        unavailable:
          "Unable to load the routine right now. Try refreshing the dashboard in a moment.",
        noPermissionAction: "No access to this screen",
        alerts: {
          OVERDUE: "Overdue",
          DUE_TODAY: "Due today",
          URGENT: "Urgent",
          UNASSIGNED: "Unassigned",
          noAlert: "No alert",
        },
        items: {
          visits: {
            title: "Today's visits",
            description:
              "{overdue} visit(s) should already have happened and need checking.",
            action: "Open agenda",
          },
          keys: {
            title: "Checked-out keys",
            description:
              "{overdue} overdue and {unassigned} without an informed holder.",
            action: "View keys",
          },
          contracts: {
            title: "Expiring contracts",
            description:
              "{dueToday} due today, {overdue} overdue and the window is {days} days.",
            action: "View contracts",
          },
          maintenance: {
            title: "Critical tickets",
            description:
              "{urgent} urgent, {overdue} over SLA and {unassigned} unassigned.",
            action: "Open tickets",
          },
          leads: {
            title: "Leads without return",
            description:
              "{overdue} overdue, {dueToday} due today, {sales} sales and {rents} rental.",
            action: "Review leads",
          },
        },
      },
    },
    settings: {
      eyebrow: "Preferences",
      title: "Personal settings",
      description:
        "Adjust language, theme and preferences for your admin experience.",
      themeTitle: "Visual theme",
      themeDescription: "Choose light, dark or follow the system preference.",
      themeResolved: "Resolved theme right now: {theme}.",
      themeResolvedLight: "light",
      themeResolvedDark: "dark",
      languageTitle: "Language",
      languageDescription:
        "Select the primary interface language. New screens are built for multilingual support.",
      localePrimary: "Initial default language of the product.",
      localeSecondary:
        "Additional language ready for the gradual expansion of screens.",
      saveButton: "Apply preferences",
      legalNote:
        "Preferences are saved to your account and respected in future sessions.",
    },
    tenantPortal: {
      eyebrow: "Portal",
      title: "Tenant portal",
      description:
        "Track your active contract and open maintenance tickets with evidence.",
      newTicket: "Open ticket",
      myContracts: "Active contracts",
      myTickets: "Recent tickets",
      newTicketTitle: "New maintenance ticket",
      newTicketDescription:
        "Describe the issue clearly and attach photos whenever visual evidence is needed.",
      noPortal: "Your portal access is not enabled yet.",
      noContracts: "No active contracts linked to your access.",
      noCoverPhoto: "No cover photo",
      contractLabel: "Contract",
      termLabel: "Term",
      rentLabel: "Rent",
      ownerLabel: "Owner",
      recentHistoryDescription: "Recent history of tickets opened from this access.",
      urgencyLabel: "Urgency {level}",
      autoAssessment: "Automatic classification recorded.",
      emptyRecentTickets: "When you open tickets, they will appear here.",
      openTicketSectionTitle: "Open ticket",
      openTicketSectionDescription:
        "The property must be linked to an active contract for this access.",
      propertyLabel: "Property",
      propertyPlaceholder: "Select the property",
      typeLabel: "Ticket type",
      typePlaceholder: "Select the type",
      descriptionLabel: "Detailed description",
      descriptionPlaceholder:
        "Explain the issue, the impact on property use and any perceived risk.",
      notesLabel: "Complementary note",
      notesPlaceholder:
        "Optional field to add extra context for the service team.",
      evidenceTitle: "Photos and evidence",
      evidenceRequired:
        "For this ticket type, at least one photo is required.",
      evidenceOptional: "You may attach photos to support triage.",
      selectFiles: "Select files",
      ticketOpenedSuccess: "Ticket opened successfully in the portal.",
      evidenceRequiredError: "This ticket type requires at least one photo.",
    },
    accessManagement: {
      title: "Roles and permissions",
      description:
        "Adjust RBAC by role without breaking the current permission architecture.",
      roles: "Available roles",
      permissions: "Permissions by role",
      saveRole: "Save permissions",
      updated: "Role permissions updated.",
      rolesDescription:
        "Roles remain dynamic and reflect the RBAC enforced in the backend.",
      inheritedPermissions: "{count} inherited permission(s)",
      editHint: "Select a role to review its access matrix.",
      noSelectionTitle: "No role selected",
      noSelectionDescription:
        "Select a role to edit its permissions.",
      permissionMeta: "{action} · {code}",
    },
    leaseTermination: {
      eyebrow: "Lease termination",
      rulesTitle: "Lease termination rules",
      rulesDescription:
        "Define the operational rules used to close rental agreements.",
      confirmTitle: "Lease termination confirmation",
      confirmDescription:
        "Review values, register the reason and complete the termination with history.",
      simulationTitle: "Lease termination simulation",
      simulationDescription:
        "Calculate termination with an auditable memory before confirming the closure.",
      legalWarning:
        "This calculation is operational and must go through administrative and legal review before confirmation.",
      ruleSaveSuccess: "Lease termination rule saved successfully.",
      simulationSaveSuccess: "Lease termination simulation generated successfully.",
      confirmSuccess: "Lease termination completed successfully.",
      existingRulesTitle: "Existing rules",
      existingRulesDescription:
        "Each rule keeps auditable parameters and can be activated by the MASTER role.",
      newRuleTitle: "New rule",
      newRuleDescription:
        "Create an additional setup for specific scenarios.",
      activeBadge: "Active",
      ruleSummary: "Base penalty of {penalty}% · {mode}.",
      proportionalMode: "proportional",
      fixedMode: "fixed",
      editorTitle: "Rule editor",
      editorDescription:
        "This setup is operational, auditable and does not replace legal review.",
      nameLabel: "Rule name",
      penaltyLabel: "Penalty percentage",
      formulaLabel: "Formula description",
      standardNotesLabel: "Standard notes",
      supportLabel: "Legal-operational support text",
      proportionalLabel: "Apply proportion by remaining time",
      manualAdjustLabel: "Allow manual adjustments",
      activeLabel: "Mark as active rule",
      additionalChargesTitle: "Additional charges",
      additionalChargesDescription:
        "Default values that may compose the calculation memory.",
      discountsTitle: "Waivers and discounts",
      discountsDescription:
        "Default items for configurable deduction.",
      rulesSaveButton: "Save rule",
      rulesSavingButton: "Saving...",
      simulationParametersTitle: "Simulation parameters",
      ruleAppliedLabel: "Applied rule",
      manualPenaltyLabel: "Manual penalty percentage",
      simulationReasonLabel: "Simulation reason",
      simulationNotesLabel: "Operational notes",
      openRulesButton: "Open rules",
      generateSimulationButton: "Generate simulation",
      calculatingButton: "Calculating...",
      memoryTitle: "Calculation memory",
      estimatedFinalValue: "Estimated final amount",
      remainingMonths: "Remaining months",
      calculatedPenalty: "Calculated penalty",
      additionalCharges: "Additional charges",
      discounts: "Discounts",
      finalAmount: "Final total",
      proceedToConfirmation: "Proceed to confirmation",
      emptyMemory:
        "Generate a simulation to view the calculation memory.",
      importantNoticeTitle: "Important notice",
      missingSimulationDescription:
        "No valid simulation was found. Generate the simulation before confirming the termination.",
      backToSimulationButton: "Back to simulation",
      summaryTitle: "Termination summary",
      finalConfirmationTitle: "Final confirmation",
      terminationReasonLabel: "Termination reason",
      finalNotesLabel: "Final notes",
      confirmingButton: "Confirming...",
      finishTerminationButton: "Complete termination",
    },
    propertyImages: {
      title: "Property gallery",
      uploadTitle: "Photo upload",
      uploadDescription:
        "Upload JPEG, PNG or WEBP images up to 8 MB each.",
      emptyTitle: "Gallery is still empty",
      emptyDescription:
        "Add property photos to improve the commercial detail and operational consultation.",
      makeCover: "Set as cover",
      reorder: "Reorder",
      remove: "Remove",
      sendPhotos: "Upload photos",
      sendingPhotos: "Uploading...",
      selectPhotos: "Select photos",
      cover: "Cover",
      uploadSuccess: "Property photos uploaded successfully.",
      coverUpdated: "Cover photo updated.",
      removedSuccess: "Photo removed from gallery.",
      reorderedSuccess: "Gallery order updated.",
      panelDescription:
        "Follow the visual presentation of {property}, choose the cover image and keep the commercial order of the gallery.",
    },
  },
  ES: {
    common: {
      searchPlaceholder:
        "Buscar inmueble, oportunidad, visita, contrato o cliente",
      save: "Guardar",
      cancel: "Cancelar",
      close: "Cerrar",
      loading: "Cargando",
      noData: "No se encontraron registros.",
      logout: "Salir",
      preferencesSaved: "Preferencias actualizadas correctamente.",
      preferencesError: "No fue posible actualizar tus preferencias ahora.",
      notInformed: "No informado",
      back: "Volver",
      confirm: "Confirmar",
      upload: "Subir",
      add: "Agregar",
      description: "Descripción",
      amount: "Valor",
      noneRegisteredYet: "Todavía no hay elementos registrados.",
    },
    layout: {
      sections: {
        overview: "Visión",
        registry: "Registros",
        operation: "Operación",
        management: "Gestión",
        tenant: "Inquilino",
      },
      menu: {
        dashboard: "Panel",
        properties: "Inmuebles",
        owners: "Propietarios",
        tenants: "Inquilinos",
        sales: "Ventas",
        rents: "Alquiler",
        visits: "Visitas",
        keys: "Llaves",
        maintenance: "Mantenimiento",
        contracts: "Contratos",
        users: "Usuarios",
        access: "Perfiles y permisos",
        settings: "Configuración",
        tenantPortal: "Portal del inquilino",
      },
      notificationsTitle: "Alertas",
      notificationsDescription:
        "Tickets críticos, contratos sensibles y elementos operativos que requieren atención.",
      notificationsEmpty: "No hay notificaciones operativas en este momento.",
      alertsCount: "{count} alerta(s)",
      themeToggleTitle: "Cambiar tema",
    },
    auth: {
      heroTag: "SaaS inmobiliario",
      heroTitle:
        "Administración inmobiliaria con postura comercial y operación madura.",
      heroDescription:
        "Centraliza contratos, llaves, visitas, embudos y accesos en una plataforma pensada para productividad real.",
      featureRbacTitle: "RBAC real",
      featureRbacText:
        "Permisos granulares y rutas protegidas de punta a punta.",
      featureSessionTitle: "Sesión segura",
      featureSessionText:
        "JWT corto, refresh token y una trazabilidad básica de auditoría.",
      featureScaleTitle: "Base escalable",
      featureScaleText:
        "Arquitectura lista para contratos, visitas y operación multiusuario.",
      secureAccessEyebrow: "Acceso seguro",
      loginTitle: "Accede a tu operación inmobiliaria",
      loginDescription:
        "Inicia sesión para gestionar inmuebles, contratos y mantenimiento en un solo lugar.",
      emailLabel: "Correo electrónico",
      passwordLabel: "Contraseña",
      submit: "Entrar al sistema",
      forgotPassword: "Olvidé mi contraseña",
      keepSession: "Mantener sesión",
      securityNote:
        "Entorno protegido con autenticación segura, control de acceso y una experiencia administrativa pensada para operación profesional.",
      recoveryTitle: "Recuperar acceso",
      recoveryDescription:
        "Ingresa tu correo para recibir las instrucciones de restablecimiento.",
      recoverySubmit: "Enviar instrucciones",
      backToLogin: "Volver al inicio de sesión",
      sending: "Enviando...",
      signingIn: "Ingresando...",
      loadingSession: "Validando tu sesión...",
      logoutSuccess: "Sesión cerrada.",
      loginSuccess: "Bienvenido de nuevo, {name}.",
    },
    dashboard: {
      prioritiesTitle: "Prioridades del despacho",
      priorities: [
        "Mantén visitas y oportunidades vinculadas al inmueble correcto para preservar la trazabilidad.",
        "Usa el control de llaves como rutina diaria para evitar pérdida de contexto operativo.",
        "Revisa los contratos próximos al vencimiento y acompaña las renovaciones con anticipación.",
      ],
      stats: {
        availableProperties: "Inmuebles disponibles",
        visitsToday: "Visitas del día",
        activeContracts: "Contratos activos",
        checkedOutKeys: "Llaves en posesión",
        openSaleLeads: "Oportunidades de venta",
        openRentLeads: "Oportunidades de alquiler",
      },
      statsDetails: {
        availableProperties:
          "Activos liberados para venta o alquiler en este momento.",
        visitsToday: "Compromisos confirmados para la agenda actual.",
        activeContracts:
          "Alquileres vigentes acompa\u00f1ados por la operaci\u00f3n.",
        checkedOutKeys:
          "Elementos en circulaci\u00f3n que requieren control de devoluci\u00f3n.",
        openSaleLeads: "Leads comerciales activos en el embudo de ventas.",
        openRentLeads:
          "Leads de alquiler en curso y bajo seguimiento.",
      },
      dailyRoutine: {
        eyebrow: "Rutina operativa",
        title: "Rutina del d\u00eda",
        description:
          "Prioriza visitas, llaves, contratos, tickets y leads que necesitan acci\u00f3n hoy.",
        refreshedAt: "Actualizado a las {time}",
        unavailable:
          "No fue posible cargar la rutina ahora. Intenta actualizar el panel en unos instantes.",
        noPermissionAction: "Sin acceso a esta pantalla",
        alerts: {
          OVERDUE: "Atrasado",
          DUE_TODAY: "Vence hoy",
          URGENT: "Urgente",
          UNASSIGNED: "Sin responsable",
          noAlert: "Sin alerta",
        },
        items: {
          visits: {
            title: "Visitas de hoy",
            description:
              "{overdue} visita(s) ya deber\u00edan haber ocurrido y requieren revisi\u00f3n.",
            action: "Abrir agenda",
          },
          keys: {
            title: "Llaves fuera",
            description:
              "{overdue} atrasada(s) y {unassigned} sin responsable informado.",
            action: "Ver llaves",
          },
          contracts: {
            title: "Contratos por vencer",
            description:
              "{dueToday} vence(n) hoy, {overdue} est\u00e1n atrasado(s) y la ventana es de {days} d\u00edas.",
            action: "Ver contratos",
          },
          maintenance: {
            title: "Tickets cr\u00edticos",
            description:
              "{urgent} urgente(s), {overdue} vencido(s) en SLA y {unassigned} sin responsable.",
            action: "Abrir tickets",
          },
          leads: {
            title: "Leads sin retorno",
            description:
              "{overdue} atrasado(s), {dueToday} para hoy, {sales} de venta y {rents} de alquiler.",
            action: "Revisar leads",
          },
        },
      },
    },
    settings: {
      eyebrow: "Preferencias",
      title: "Configuración personal",
      description:
        "Ajusta idioma, tema y preferencias de tu experiencia administrativa.",
      themeTitle: "Tema visual",
      themeDescription:
        "Elige modo claro, oscuro o sigue la preferencia del sistema.",
      themeResolved: "Tema resuelto ahora: {theme}.",
      themeResolvedLight: "claro",
      themeResolvedDark: "oscuro",
      languageTitle: "Idioma",
      languageDescription:
        "Selecciona el idioma principal de la interfaz. Las pantallas nuevas ya nacen listas para varios idiomas.",
      localePrimary: "Idioma inicial predeterminado del producto.",
      localeSecondary:
        "Idioma adicional listo para la expansión gradual de las pantallas.",
      saveButton: "Aplicar preferencias",
      legalNote:
        "Las preferencias se guardan en tu cuenta y se respetan en futuros accesos.",
    },
    tenantPortal: {
      eyebrow: "Portal",
      title: "Portal del inquilino",
      description:
        "Sigue tu contrato activo y abre tickets de mantenimiento con evidencias.",
      newTicket: "Abrir ticket",
      myContracts: "Contratos activos",
      myTickets: "Tickets recientes",
      newTicketTitle: "Nuevo ticket de mantenimiento",
      newTicketDescription:
        "Describe el problema con claridad y adjunta fotos cuando se requiera evidencia visual.",
      noPortal: "Tu acceso al portal todavía no está habilitado.",
      noContracts: "No hay contratos activos vinculados a tu acceso.",
      noCoverPhoto: "Sin foto de portada",
      contractLabel: "Contrato",
      termLabel: "Vigencia",
      rentLabel: "Alquiler",
      ownerLabel: "Propietario",
      recentHistoryDescription:
        "Historial reciente de los tickets abiertos desde este acceso.",
      urgencyLabel: "Urgencia {level}",
      autoAssessment: "Clasificación automática registrada.",
      emptyRecentTickets: "Cuando abras tickets, aparecerán aquí.",
      openTicketSectionTitle: "Apertura de ticket",
      openTicketSectionDescription:
        "El inmueble debe estar vinculado a un contrato activo de este acceso.",
      propertyLabel: "Inmueble",
      propertyPlaceholder: "Selecciona el inmueble",
      typeLabel: "Tipo de ticket",
      typePlaceholder: "Selecciona el tipo",
      descriptionLabel: "Descripción detallada",
      descriptionPlaceholder:
        "Explica el problema, el impacto en el uso del inmueble y cualquier riesgo percibido.",
      notesLabel: "Observación complementaria",
      notesPlaceholder:
        "Campo opcional para complementar el contexto del servicio.",
      evidenceTitle: "Fotos y evidencias",
      evidenceRequired:
        "Para este tipo de ticket, al menos una foto es obligatoria.",
      evidenceOptional: "Puedes adjuntar fotos para ayudar en el triaje.",
      selectFiles: "Seleccionar archivos",
      ticketOpenedSuccess: "Ticket abierto correctamente en el portal.",
      evidenceRequiredError:
        "Este tipo de ticket exige al menos una foto.",
    },
    accessManagement: {
      title: "Perfiles y permisos",
      description:
        "Ajusta el RBAC por función sin romper la arquitectura actual de permisos.",
      roles: "Perfiles disponibles",
      permissions: "Permisos por perfil",
      saveRole: "Guardar permisos",
      updated: "Permisos del perfil actualizados.",
      rolesDescription:
        "Los perfiles siguen siendo dinámicos y reflejan el RBAC aplicado en el backend.",
      inheritedPermissions: "{count} permiso(s) heredado(s)",
      editHint: "Selecciona un perfil para revisar la matriz de acceso.",
      noSelectionTitle: "Ningún perfil seleccionado",
      noSelectionDescription:
        "Selecciona un perfil para editar sus permisos.",
      permissionMeta: "{action} · {code}",
    },
    leaseTermination: {
      eyebrow: "Baja contractual",
      rulesTitle: "Parametrización de rescisión",
      rulesDescription:
        "Define las reglas operativas usadas para cerrar contratos de alquiler.",
      confirmTitle: "Confirmación de baja contractual",
      confirmDescription:
        "Revisa los valores, registra el motivo y concluye la baja con historial.",
      simulationTitle: "Simulación de baja contractual",
      simulationDescription:
        "Calcula la rescisión con memoria auditable antes de concluir la baja.",
      legalWarning:
        "Este cálculo es operativo y debe pasar por revisión administrativa y jurídica antes de la confirmación.",
      ruleSaveSuccess: "Regla de rescisión guardada correctamente.",
      simulationSaveSuccess: "Simulación de baja generada correctamente.",
      confirmSuccess: "Baja contractual concluida correctamente.",
      existingRulesTitle: "Reglas existentes",
      existingRulesDescription:
        "Cada regla conserva parámetros auditables y puede ser activada por el perfil MASTER.",
      newRuleTitle: "Nueva regla",
      newRuleDescription:
        "Crea una parametrización adicional para escenarios específicos.",
      activeBadge: "Activa",
      ruleSummary: "Multa base de {penalty}% · {mode}.",
      proportionalMode: "proporcional",
      fixedMode: "fija",
      editorTitle: "Editor de la regla",
      editorDescription:
        "La parametrización es operativa, auditable y no sustituye el análisis jurídico.",
      nameLabel: "Nombre de la regla",
      penaltyLabel: "Porcentaje de multa",
      formulaLabel: "Descripción de la fórmula",
      standardNotesLabel: "Observaciones estándar",
      supportLabel: "Texto jurídico-operativo de apoyo",
      proportionalLabel: "Aplicar proporcionalidad por tiempo restante",
      manualAdjustLabel: "Permitir ajustes manuales",
      activeLabel: "Marcar como regla activa",
      additionalChargesTitle: "Cargos adicionales",
      additionalChargesDescription:
        "Valores estándar que pueden componer la memoria de cálculo.",
      discountsTitle: "Exenciones y descuentos",
      discountsDescription:
        "Ítems estándar para abatimiento configurable.",
      rulesSaveButton: "Guardar regla",
      rulesSavingButton: "Guardando...",
      simulationParametersTitle: "Parámetros de la simulación",
      ruleAppliedLabel: "Regla aplicada",
      manualPenaltyLabel: "Porcentaje manual de multa",
      simulationReasonLabel: "Motivo de la simulación",
      simulationNotesLabel: "Observaciones operativas",
      openRulesButton: "Abrir reglas",
      generateSimulationButton: "Generar simulación",
      calculatingButton: "Calculando...",
      memoryTitle: "Memoria de cálculo",
      estimatedFinalValue: "Valor final estimado",
      remainingMonths: "Meses restantes",
      calculatedPenalty: "Multa calculada",
      additionalCharges: "Cargos adicionales",
      discounts: "Descuentos",
      finalAmount: "Total final",
      proceedToConfirmation: "Seguir a la confirmación",
      emptyMemory:
        "Genera una simulación para visualizar la memoria de cálculo.",
      importantNoticeTitle: "Aviso importante",
      missingSimulationDescription:
        "No se encontró una simulación válida. Genera la simulación antes de confirmar la baja.",
      backToSimulationButton: "Volver a la simulación",
      summaryTitle: "Resumen de la baja",
      finalConfirmationTitle: "Confirmación final",
      terminationReasonLabel: "Motivo de la baja",
      finalNotesLabel: "Observaciones finales",
      confirmingButton: "Confirmando...",
      finishTerminationButton: "Concluir baja",
    },
    propertyImages: {
      title: "Galería del inmueble",
      uploadTitle: "Carga de fotos",
      uploadDescription:
        "Sube imágenes JPEG, PNG o WEBP de hasta 8 MB por archivo.",
      emptyTitle: "La galería todavía está vacía",
      emptyDescription:
        "Agrega fotos del inmueble para enriquecer el detalle comercial y la consulta operativa.",
      makeCover: "Definir portada",
      reorder: "Reordenar",
      remove: "Eliminar",
      sendPhotos: "Subir fotos",
      sendingPhotos: "Subiendo...",
      selectPhotos: "Seleccionar fotos",
      cover: "Portada",
      uploadSuccess: "Fotos del inmueble subidas correctamente.",
      coverUpdated: "Foto de portada actualizada.",
      removedSuccess: "Foto eliminada de la galería.",
      reorderedSuccess: "Orden de la galería actualizado.",
      panelDescription:
        "Acompaña la presentación visual de {property}, define la portada y mantén el orden comercial de la galería.",
    },
  },
} as const;
