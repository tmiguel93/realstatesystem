import type { Request, Response } from "express";
import { getRequestContext } from "../../shared/http/request-context";
import {
  contactIdParamSchema,
  contactPayloadSchema,
  contactsListQuerySchema,
} from "./contacts.schemas";
import { ContactsService } from "./contacts.service";

const contactsService = new ContactsService();

export class ContactsController {
  async list(request: Request, response: Response) {
    const query = contactsListQuerySchema.parse(request.query);
    const result = await contactsService.list(query);
    return response.status(200).json(result);
  }

  async create(request: Request, response: Response) {
    const payload = contactPayloadSchema.parse(request.body);
    const result = await contactsService.create(payload, getRequestContext(request));
    return response.status(201).json(result);
  }

  async update(request: Request, response: Response) {
    const params = contactIdParamSchema.parse(request.params);
    const payload = contactPayloadSchema.parse(request.body);
    const result = await contactsService.update(
      params.id,
      payload,
      getRequestContext(request),
    );
    return response.status(200).json(result);
  }
}
