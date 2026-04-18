import {
  CommercialSituation,
  PropertyPurpose,
  PropertyStatus,
  PropertyType,
} from "@prisma/client";
import { z } from "zod";

const optionalString = z.string().trim().optional().nullable();

export const propertiesListQuerySchema = z.object({
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
  search: z.string().trim().optional(),
  ownerId: z.string().uuid().optional(),
  purpose: z.nativeEnum(PropertyPurpose).optional(),
  status: z.nativeEnum(PropertyStatus).optional(),
  city: z.string().trim().optional(),
});

export const propertyPayloadSchema = z.object({
  code: optionalString,
  title: z.string().trim().min(3, "Informe o titulo comercial do imovel."),
  type: z.nativeEnum(PropertyType),
  purpose: z.nativeEnum(PropertyPurpose),
  status: z.nativeEnum(PropertyStatus),
  commercialSituation: z.nativeEnum(CommercialSituation),
  ownerId: z.string().uuid("Selecione um proprietario valido."),
  zipCode: z.string().trim().min(8, "Informe o CEP."),
  state: z.string().trim().length(2, "Informe a UF."),
  city: z.string().trim().min(2, "Informe a cidade."),
  district: z.string().trim().min(2, "Informe o bairro."),
  street: z.string().trim().min(3, "Informe o logradouro."),
  streetNumber: z.string().trim().min(1, "Informe o numero."),
  complement: optionalString,
  description: optionalString,
  internalNotes: optionalString,
  salePrice: z.coerce.number().nonnegative().nullable().optional(),
  rentPrice: z.coerce.number().nonnegative().nullable().optional(),
  condoFee: z.coerce.number().nonnegative().nullable().optional(),
  iptu: z.coerce.number().nonnegative().nullable().optional(),
  areaTotal: z.coerce.number().nonnegative().nullable().optional(),
  areaBuilt: z.coerce.number().nonnegative().nullable().optional(),
  bedrooms: z.coerce.number().int().nonnegative().nullable().optional(),
  bathrooms: z.coerce.number().int().nonnegative().nullable().optional(),
  suites: z.coerce.number().int().nonnegative().nullable().optional(),
  parkingSpots: z.coerce.number().int().nonnegative().nullable().optional(),
  floor: z.coerce.number().int().nullable().optional(),
  furnished: z.boolean().default(false),
  acceptsPet: z.boolean().nullable().optional(),
  isPublished: z.boolean().default(false),
});

export const propertyIdParamSchema = z.object({
  id: z.string().uuid("Identificador invalido."),
});

