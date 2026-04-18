import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  commercialSituationOptions,
  propertyPurposeOptions,
  propertyStatusOptions,
  propertyTypeOptions,
} from "@imobiliaria/shared";
import { Drawer } from "@/components/layout/drawer";
import { FormInput } from "@/components/form/form-input";
import { FormSelect } from "@/components/form/form-select";
import { FormTextarea } from "@/components/form/form-textarea";
import { FormSwitch } from "@/components/form/form-switch";
import type { PropertyDetail, PropertyListItem } from "@/types/domain";

const propertySchema = z.object({
  code: z.string().trim().optional(),
  title: z.string().trim().min(3, "Informe o titulo comercial."),
  type: z.string().trim().min(1, "Selecione o tipo."),
  purpose: z.string().trim().min(1, "Selecione a finalidade."),
  status: z.string().trim().min(1, "Selecione o status."),
  commercialSituation: z
    .string()
    .trim()
    .min(1, "Selecione a situacao comercial."),
  ownerId: z.string().trim().min(1, "Selecione o proprietario."),
  zipCode: z.string().trim().min(8, "Informe o CEP."),
  state: z.string().trim().length(2, "Informe a UF."),
  city: z.string().trim().min(2, "Informe a cidade."),
  district: z.string().trim().min(2, "Informe o bairro."),
  street: z.string().trim().min(3, "Informe o logradouro."),
  streetNumber: z.string().trim().min(1, "Informe o numero."),
  complement: z.string().trim().optional(),
  description: z.string().trim().optional(),
  internalNotes: z.string().trim().optional(),
  salePrice: z.string().trim().optional(),
  rentPrice: z.string().trim().optional(),
  condoFee: z.string().trim().optional(),
  iptu: z.string().trim().optional(),
  areaTotal: z.string().trim().optional(),
  areaBuilt: z.string().trim().optional(),
  bedrooms: z.string().trim().optional(),
  bathrooms: z.string().trim().optional(),
  suites: z.string().trim().optional(),
  parkingSpots: z.string().trim().optional(),
  floor: z.string().trim().optional(),
  furnished: z.boolean(),
  acceptsPet: z.boolean(),
  isPublished: z.boolean(),
});

type PropertyFormValues = z.infer<typeof propertySchema>;

type PropertyFormDrawerProps = {
  open: boolean;
  initialData?: PropertyDetail | PropertyListItem | null;
  ownerOptions: Array<{ value: string; label: string }>;
  pending?: boolean;
  onClose: () => void;
  onSubmit: (values: {
    code?: string | null;
    title: string;
    type: string;
    purpose: string;
    status: string;
    commercialSituation: string;
    ownerId: string;
    zipCode: string;
    state: string;
    city: string;
    district: string;
    street: string;
    streetNumber: string;
    complement?: string | null;
    description?: string | null;
    internalNotes?: string | null;
    salePrice?: number | null;
    rentPrice?: number | null;
    condoFee?: number | null;
    iptu?: number | null;
    areaTotal?: number | null;
    areaBuilt?: number | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    suites?: number | null;
    parkingSpots?: number | null;
    floor?: number | null;
    furnished: boolean;
    acceptsPet?: boolean | null;
    isPublished: boolean;
  }) => Promise<void>;
};

function toNullable(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function toNullableNumber(value?: string) {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  const numberValue = Number(normalized.replace(",", "."));
  return Number.isNaN(numberValue) ? null : numberValue;
}

function buildDefaults(
  initialData?: PropertyDetail | PropertyListItem | null,
): PropertyFormValues {
  const detailData = initialData as PropertyDetail | null | undefined;

  return {
    code: initialData?.code ?? "",
    title: initialData?.title ?? "",
    type: initialData?.type ?? "APARTMENT",
    purpose: initialData?.purpose ?? "BOTH",
    status: initialData?.status ?? "AVAILABLE",
    commercialSituation:
      initialData?.commercialSituation ?? "AVAILABLE_FOR_BOTH",
    ownerId: initialData?.owner.id ?? "",
    zipCode: detailData?.zipCode ?? "",
    state: detailData?.state ?? "",
    city: initialData?.city ?? "",
    district: initialData?.district ?? "",
    street: detailData?.street ?? "",
    streetNumber: detailData?.streetNumber ?? "",
    complement: detailData?.complement ?? "",
    description: detailData?.description ?? "",
    internalNotes: detailData?.internalNotes ?? "",
    salePrice: initialData?.salePrice !== null ? String(initialData?.salePrice ?? "") : "",
    rentPrice: initialData?.rentPrice !== null ? String(initialData?.rentPrice ?? "") : "",
    condoFee: detailData?.condoFee !== null ? String(detailData?.condoFee ?? "") : "",
    iptu: detailData?.iptu !== null ? String(detailData?.iptu ?? "") : "",
    areaTotal: detailData?.areaTotal !== null ? String(detailData?.areaTotal ?? "") : "",
    areaBuilt: detailData?.areaBuilt !== null ? String(detailData?.areaBuilt ?? "") : "",
    bedrooms: detailData?.bedrooms !== null ? String(detailData?.bedrooms ?? "") : "",
    bathrooms: detailData?.bathrooms !== null ? String(detailData?.bathrooms ?? "") : "",
    suites: detailData?.suites !== null ? String(detailData?.suites ?? "") : "",
    parkingSpots:
      detailData?.parkingSpots !== null ? String(detailData?.parkingSpots ?? "") : "",
    floor: detailData?.floor !== null ? String(detailData?.floor ?? "") : "",
    furnished: detailData?.furnished ?? false,
    acceptsPet: detailData?.acceptsPet ?? false,
    isPublished: detailData?.isPublished ?? false,
  };
}

export function PropertyFormDrawer({
  open,
  initialData,
  ownerOptions,
  pending,
  onClose,
  onSubmit,
}: PropertyFormDrawerProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: buildDefaults(initialData),
  });

  useEffect(() => {
    reset(buildDefaults(initialData));
  }, [initialData, reset]);

  const furnished = watch("furnished");
  const acceptsPet = watch("acceptsPet");
  const isPublished = watch("isPublished");

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      code: toNullable(values.code),
      title: values.title,
      type: values.type,
      purpose: values.purpose,
      status: values.status,
      commercialSituation: values.commercialSituation,
      ownerId: values.ownerId,
      zipCode: values.zipCode,
      state: values.state,
      city: values.city,
      district: values.district,
      street: values.street,
      streetNumber: values.streetNumber,
      complement: toNullable(values.complement),
      description: toNullable(values.description),
      internalNotes: toNullable(values.internalNotes),
      salePrice: toNullableNumber(values.salePrice),
      rentPrice: toNullableNumber(values.rentPrice),
      condoFee: toNullableNumber(values.condoFee),
      iptu: toNullableNumber(values.iptu),
      areaTotal: toNullableNumber(values.areaTotal),
      areaBuilt: toNullableNumber(values.areaBuilt),
      bedrooms: toNullableNumber(values.bedrooms),
      bathrooms: toNullableNumber(values.bathrooms),
      suites: toNullableNumber(values.suites),
      parkingSpots: toNullableNumber(values.parkingSpots),
      floor: toNullableNumber(values.floor),
      furnished: values.furnished,
      acceptsPet: values.acceptsPet,
      isPublished: values.isPublished,
    });
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={initialData ? "Editar imovel" : "Novo imovel"}
      description="Cadastro comercial com finalidade, endereco, proprietario e caracteristicas do ativo."
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm font-semibold text-ink-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="property-form"
            disabled={pending}
            className="rounded-2xl bg-ink-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {pending ? "Salvando..." : "Salvar imovel"}
          </button>
        </div>
      }
    >
      <form id="property-form" className="space-y-6" onSubmit={submit}>
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput label="Codigo" {...register("code")} />
          <FormSelect
            label="Proprietario"
            options={ownerOptions}
            placeholder="Selecione um proprietario"
            error={errors.ownerId?.message}
            {...register("ownerId")}
          />
          <div className="md:col-span-2">
            <FormInput
              label="Titulo comercial"
              error={errors.title?.message}
              {...register("title")}
            />
          </div>
          <FormSelect
            label="Tipo"
            options={propertyTypeOptions.map((item) => ({
              value: item.value,
              label: item.label,
            }))}
            error={errors.type?.message}
            {...register("type")}
          />
          <FormSelect
            label="Finalidade"
            options={propertyPurposeOptions.map((item) => ({
              value: item.value,
              label: item.label,
            }))}
            error={errors.purpose?.message}
            {...register("purpose")}
          />
          <FormSelect
            label="Status do ativo"
            options={propertyStatusOptions.map((item) => ({
              value: item.value,
              label: item.label,
            }))}
            error={errors.status?.message}
            {...register("status")}
          />
          <FormSelect
            label="Situacao comercial"
            options={commercialSituationOptions.map((item) => ({
              value: item.value,
              label: item.label,
            }))}
            error={errors.commercialSituation?.message}
            {...register("commercialSituation")}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormInput label="CEP" error={errors.zipCode?.message} {...register("zipCode")} />
          <FormInput label="UF" maxLength={2} error={errors.state?.message} {...register("state")} />
          <FormInput label="Cidade" error={errors.city?.message} {...register("city")} />
          <FormInput label="Bairro" error={errors.district?.message} {...register("district")} />
          <div className="md:col-span-2">
            <FormInput label="Logradouro" error={errors.street?.message} {...register("street")} />
          </div>
          <FormInput label="Numero" error={errors.streetNumber?.message} {...register("streetNumber")} />
          <FormInput label="Complemento" {...register("complement")} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <FormInput label="Valor de venda" {...register("salePrice")} />
          <FormInput label="Valor de locacao" {...register("rentPrice")} />
          <FormInput label="Condominio" {...register("condoFee")} />
          <FormInput label="IPTU" {...register("iptu")} />
          <FormInput label="Area total (m²)" {...register("areaTotal")} />
          <FormInput label="Area construida (m²)" {...register("areaBuilt")} />
          <FormInput label="Dormitorios" {...register("bedrooms")} />
          <FormInput label="Banheiros" {...register("bathrooms")} />
          <FormInput label="Suites" {...register("suites")} />
          <FormInput label="Vagas" {...register("parkingSpots")} />
          <FormInput label="Andar" {...register("floor")} />
        </div>

        <FormTextarea label="Descricao comercial" {...register("description")} />
        <FormTextarea label="Observacoes internas" {...register("internalNotes")} />

        <div className="grid gap-4">
          <FormSwitch
            label="Imovel mobiliado"
            checked={furnished}
            onChange={(checked) => setValue("furnished", checked)}
          />
          <FormSwitch
            label="Aceita pets"
            checked={acceptsPet}
            onChange={(checked) => setValue("acceptsPet", checked)}
          />
          <FormSwitch
            label="Publicado para operacao comercial"
            checked={isPublished}
            onChange={(checked) => setValue("isPublished", checked)}
          />
        </div>
      </form>
    </Drawer>
  );
}
