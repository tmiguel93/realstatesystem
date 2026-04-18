import {
  AdjustmentIndex,
  ContractOriginType,
  GuaranteeType,
} from "@prisma/client";

export const CONTRACT_TEMPLATE_NAME = "locacao-residencial-padrao";
export const CONTRACT_TEMPLATE_VERSION = "1.0.0";
export const DEFAULT_CONTRACT_LEGAL_WARNING =
  "Minuta parametrizada para locacao residencial urbana, com referencias gerais a Lei no 8.245/1991 e ao Codigo Civil. Validacao juridica obrigatoria antes do uso final.";

export type ContractTemplateInput = {
  contract: {
    code: string;
    originType: ContractOriginType;
    startDate: Date;
    endDate: Date;
    rentAmount: number;
    dueDay: number;
    guaranteeType: GuaranteeType;
    guaranteeDetails: string | null;
    adjustmentIndex: AdjustmentIndex;
    adjustmentFrequencyMonths: number;
    lateFeePercentage: number | null;
    penaltyDescription: string | null;
    responsibilities: string[];
    additionalClauses: string | null;
    legalWarningText: string;
  };
  property: {
    code: string;
    title: string;
    type: string;
    city: string;
    district: string;
    street: string;
    streetNumber: string;
    complement: string | null;
    zipCode: string;
    state: string;
  };
  owner: {
    fullName: string;
    document: string;
    email: string | null;
    phone: string | null;
  };
  tenant: {
    fullName: string;
    document: string;
    email: string | null;
    phone: string | null;
  };
  rentLead: {
    code: string;
    customerName: string;
  } | null;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR").format(value);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderParagraphHtml(value: string) {
  return escapeHtml(value).replaceAll("\n", "<br />");
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function resolveGuaranteeLabel(guaranteeType: GuaranteeType) {
  const labels: Record<GuaranteeType, string> = {
    NONE: "Sem garantia adicional",
    SECURITY_DEPOSIT: "Caucao",
    GUARANTOR: "Fiador",
    INSURANCE: "Seguro fianca",
    TITLE_CAPITALIZATION: "Titulo de capitalizacao",
    OTHER: "Outra garantia",
  };

  return labels[guaranteeType];
}

function resolveAdjustmentLabel(adjustmentIndex: AdjustmentIndex) {
  const labels: Record<AdjustmentIndex, string> = {
    IPCA: "IPCA",
    IGP_M: "IGP-M",
    INPC: "INPC",
    FIXED: "Indice fixo",
    OTHER: "Outro indice",
  };

  return labels[adjustmentIndex];
}

function buildAddress(input: ContractTemplateInput["property"]) {
  return [
    input.street,
    input.streetNumber,
    input.complement,
    input.district,
    input.city,
    input.state,
    input.zipCode,
  ]
    .filter(Boolean)
    .join(", ");
}

function buildClauseList(input: ContractTemplateInput) {
  const rentAmount = formatCurrency(input.contract.rentAmount);
  const adjustmentLabel = resolveAdjustmentLabel(input.contract.adjustmentIndex);
  const guaranteeLabel = resolveGuaranteeLabel(input.contract.guaranteeType);
  const penaltyDescription =
    input.contract.penaltyDescription ??
    "Persistindo inadimplemento, aplicam-se as medidas contratuais e legais cabiveis.";

  return [
    {
      title: "1. Partes e objeto",
      body: `O LOCADOR ${input.owner.fullName}, documento ${input.owner.document}, loca ao LOCATARIO ${input.tenant.fullName}, documento ${input.tenant.document}, o imovel residencial identificado como ${input.property.code} - ${input.property.title}, localizado em ${buildAddress(input.property)}.`,
    },
    {
      title: "2. Destinacao e uso",
      body: "O imovel destina-se a uso residencial, vedada alteracao de finalidade sem ajuste expresso entre as partes e sem observancia das normas aplicaveis.",
    },
    {
      title: "3. Prazo da locacao",
      body: `A locacao inicia-se em ${formatDate(input.contract.startDate)} e encerra-se em ${formatDate(input.contract.endDate)}, salvo prorrogacao, renovacao ou encerramento por instrumento proprio.`,
    },
    {
      title: "4. Aluguel e vencimento",
      body: `O aluguel mensal pactuado e de ${rentAmount}, com vencimento todo dia ${input.contract.dueDay} de cada mes, acrescido dos encargos previstos contratualmente e daqueles transferiveis por lei ou convencao valida.`,
    },
    {
      title: "5. Garantia",
      body: `A garantia contratada e ${guaranteeLabel}.${input.contract.guaranteeDetails ? ` Detalhes: ${input.contract.guaranteeDetails}.` : ""}`,
    },
    {
      title: "6. Reajuste",
      body: `O aluguel sera reajustado a cada ${input.contract.adjustmentFrequencyMonths} mes(es), conforme indice ${adjustmentLabel}, ressalvada revisao por acordo escrito ou pelas vias legalmente cabiveis.`,
    },
    {
      title: "7. Responsabilidades operacionais",
      body: input.contract.responsibilities
        .map((item, index) => `${index + 1}. ${item}`)
        .join(" "),
    },
    {
      title: "8. Mora e penalidades",
      body: `Em caso de atraso, podera incidir multa de ${input.contract.lateFeePercentage ?? 2}% sobre a parcela vencida, sem prejuizo de atualizacao, juros, cobranca e demais medidas cabiveis. ${penaltyDescription}`,
    },
    {
      title: "9. Vistoria, conservacao e devolucao",
      body: "As partes devem registrar a situacao do imovel em vistoria, comunicar danos relevantes e observar as regras de conservacao, uso regular e devolucao ao termino da locacao.",
    },
    {
      title: "10. Disposicoes finais",
      body: "Esta minuta e parametrizada para apoiar a formalizacao interna. A assinatura definitiva e a eficacia juridica dependem de revisao por profissional habilitado e validacao final das partes.",
    },
  ];
}

export function renderContractTemplate(input: ContractTemplateInput) {
  const clauses = buildClauseList(input);
  const header = `MINUTA DE CONTRATO DE LOCACAO RESIDENCIAL - ${input.contract.code}`;
  const leadReference = input.rentLead
    ? `Origem comercial: lead ${input.rentLead.code} - ${input.rentLead.customerName}.`
    : "Origem comercial: cadastro manual autorizado.";

  const renderedHtml = `
    <article style="font-family: Arial, sans-serif; color: #17211f; line-height: 1.55;">
      <header style="margin-bottom: 24px;">
        <p style="font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: #85613b;">Minuta parametrizada</p>
        <h1 style="font-size: 28px; margin: 8px 0 0;">${escapeHtml(header)}</h1>
        <p style="margin-top: 12px; font-size: 14px;">${renderParagraphHtml(input.contract.legalWarningText)}</p>
        <p style="margin-top: 8px; font-size: 14px;">${renderParagraphHtml(leadReference)}</p>
      </header>
      <section style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
        <div style="padding: 16px; border: 1px solid #d8ddd9; border-radius: 16px;">
          <strong>Locador</strong>
          <p>${escapeHtml(input.owner.fullName)}</p>
          <p>${escapeHtml(input.owner.document)}</p>
          <p>${escapeHtml(input.owner.email ?? "Sem email informado")} - ${escapeHtml(input.owner.phone ?? "Sem telefone informado")}</p>
        </div>
        <div style="padding: 16px; border: 1px solid #d8ddd9; border-radius: 16px;">
          <strong>Locatario</strong>
          <p>${escapeHtml(input.tenant.fullName)}</p>
          <p>${escapeHtml(input.tenant.document)}</p>
          <p>${escapeHtml(input.tenant.email ?? "Sem email informado")} - ${escapeHtml(input.tenant.phone ?? "Sem telefone informado")}</p>
        </div>
      </section>
      <section style="padding: 16px; border: 1px solid #d8ddd9; border-radius: 16px; margin-bottom: 24px;">
        <strong>Imovel</strong>
        <p>${escapeHtml(input.property.code)} - ${escapeHtml(input.property.title)}</p>
        <p>${escapeHtml(buildAddress(input.property))}</p>
      </section>
      ${clauses
        .map(
          (clause) => `
            <section style="margin-bottom: 20px;">
              <h2 style="font-size: 18px; margin-bottom: 8px;">${escapeHtml(clause.title)}</h2>
              <p style="font-size: 14px; margin: 0;">${renderParagraphHtml(clause.body)}</p>
            </section>
          `,
        )
        .join("")}
      ${
        input.contract.additionalClauses
          ? `
            <section style="margin-bottom: 20px;">
              <h2 style="font-size: 18px; margin-bottom: 8px;">Clausulas adicionais</h2>
              <p style="font-size: 14px; margin: 0;">${renderParagraphHtml(input.contract.additionalClauses)}</p>
            </section>
          `
          : ""
      }
      <footer style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #d8ddd9; font-size: 12px; color: #5c6662;">
        <p>${renderParagraphHtml(input.contract.legalWarningText)}</p>
      </footer>
    </article>
  `.trim();

  const renderedText = [
    header,
    "",
    input.contract.legalWarningText,
    leadReference,
    "",
    `LOCADOR: ${input.owner.fullName} - ${input.owner.document}`,
    `LOCATARIO: ${input.tenant.fullName} - ${input.tenant.document}`,
    `IMOVEL: ${input.property.code} - ${input.property.title} - ${buildAddress(input.property)}`,
    "",
    ...clauses.flatMap((clause) => [clause.title, clause.body, ""]),
    input.contract.additionalClauses
      ? `CLAUSULAS ADICIONAIS: ${input.contract.additionalClauses}`
      : "",
    "",
    input.contract.legalWarningText,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    renderedHtml,
    renderedText,
    dataSnapshot: {
      legalWarningText: input.contract.legalWarningText,
      contract: input.contract,
      property: input.property,
      owner: input.owner,
      tenant: input.tenant,
      rentLead: input.rentLead,
      clauses,
      generatedAt: new Date().toISOString(),
    },
  };
}
