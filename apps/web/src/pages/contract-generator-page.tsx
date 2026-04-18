import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appRoutes } from "@imobiliaria/shared";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader } from "@/components/feedback/page-header";
import { SectionCard } from "@/components/feedback/section-card";
import { useAuth } from "@/features/auth/auth-context";
import { ContractGeneratorForm } from "@/features/contracts/contract-generator-form";
import { buildDetailPath } from "@/lib/format";
import { contractsService } from "@/services/contracts-service";
import { propertiesService } from "@/services/properties-service";
import { rentsService } from "@/services/rents-service";
import { tenantsService } from "@/services/tenants-service";

export function ContractGeneratorPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  const [searchParams] = useSearchParams();
  const contractId = searchParams.get("contractId");
  const mode = contractId ? "version" : "create";

  const contractQuery = useQuery({
    queryKey: ["contract-detail", contractId],
    queryFn: () => contractsService.getById(accessToken!, contractId!),
    enabled: Boolean(accessToken && contractId),
  });

  const rentLeadsQuery = useQuery({
    queryKey: ["rent-leads-contract-select"],
    queryFn: () =>
      rentsService.list({
        accessToken: accessToken!,
        page: 1,
        pageSize: 100,
      }),
    enabled: Boolean(accessToken),
  });

  const propertiesQuery = useQuery({
    queryKey: ["properties-contract-select"],
    queryFn: () =>
      propertiesService.list({
        accessToken: accessToken!,
        page: 1,
        pageSize: 100,
      }),
    enabled: Boolean(accessToken),
  });

  const tenantsQuery = useQuery({
    queryKey: ["tenants-contract-select"],
    queryFn: () =>
      tenantsService.list({
        accessToken: accessToken!,
        page: 1,
        pageSize: 100,
      }),
    enabled: Boolean(accessToken),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof contractsService.create>[1]) =>
      contractsService.create(accessToken!, payload),
    onSuccess: async (contract) => {
      toast.success("Contrato gerado com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["contracts"] });
      navigate(buildDetailPath(appRoutes.contractDetail, contract.id));
    },
  });

  const versionMutation = useMutation({
    mutationFn: (payload: Parameters<typeof contractsService.createVersion>[2]) =>
      contractsService.createVersion(accessToken!, contractId!, payload),
    onSuccess: async (contract) => {
      toast.success("Nova versao registrada com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["contracts"] });
      await queryClient.invalidateQueries({ queryKey: ["contract-detail", contract.id] });
      navigate(buildDetailPath(appRoutes.contractDetail, contract.id));
    },
  });

  const rentLeadOptions = useMemo(
    () =>
      (rentLeadsQuery.data?.data ?? []).map((lead) => ({
        value: lead.id,
        label: `${lead.code} - ${lead.customerName}`,
      })),
    [rentLeadsQuery.data],
  );

  const propertyOptions = useMemo(
    () =>
      (propertiesQuery.data?.data ?? []).map((property) => ({
        value: property.id,
        label: `${property.code} - ${property.title}`,
      })),
    [propertiesQuery.data],
  );

  const tenantOptions = useMemo(
    () =>
      (tenantsQuery.data?.data ?? []).map((tenant) => ({
        value: tenant.id,
        label: tenant.fullName,
      })),
    [tenantsQuery.data],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gerador contratual"
        title={mode === "version" ? "Nova versao de contrato" : "Gerar contrato de locacao"}
        description="Monte a minuta parametrizavel a partir do pipeline de locacao ou de cadastro autorizado, sempre com revisao juridica obrigatoria."
      />

      <SectionCard
        title="Orientacao de uso"
        description="Use esta area para produzir a minuta, revisar os parametros e seguir com assinatura pendente ou ativacao apenas apos conferencias internas."
      >
        <div className="grid gap-3 text-sm text-ink-600 md:grid-cols-3">
          <p>O documento herda dados cadastrais do imovel, locador, locatario e lead vinculado.</p>
          <p>O versionamento preserva cada renderizacao, inclusive a responsavel pela revisao posterior.</p>
          <p>O PDF exportado sempre corresponde a uma versao especifica, sem sobrescrever historico.</p>
        </div>
      </SectionCard>

      <ContractGeneratorForm
        mode={mode}
        initialData={contractQuery.data}
        rentLeadOptions={rentLeadOptions}
        propertyOptions={propertyOptions}
        tenantOptions={tenantOptions}
        pending={createMutation.isPending || versionMutation.isPending}
        onSubmit={async (payload) => {
          if (mode === "version" && contractId) {
            await versionMutation.mutateAsync(payload);
            return;
          }

          await createMutation.mutateAsync(payload);
        }}
      />
    </div>
  );
}
