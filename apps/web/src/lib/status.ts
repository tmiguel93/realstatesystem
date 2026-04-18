export function resolveStatusTone(status: string) {
  const normalizedStatus = status.toUpperCase();

  if (
    [
      "ACTIVE",
      "APPROVED",
      "AVAILABLE",
      "AVAILABLE_FOR_BOTH",
      "AVAILABLE_FOR_SALE",
      "AVAILABLE_FOR_RENT",
      "FINALIZED",
      "RENEWED",
    ].includes(
      normalizedStatus,
    )
  ) {
    return "success" as const;
  }

  if (
    [
      "RESERVED",
      "UNDER_REVIEW",
      "NEGOTIATION",
      "RESTRICTED",
      "UNDER_MAINTENANCE",
      "DRAFT",
      "PENDING_SIGNATURE",
      "TRIAGE",
      "WAITING_APPROVAL",
      "WAITING_PROVIDER",
      "WAITING_MATERIAL",
      "REVIEWED",
    ].includes(
      normalizedStatus,
    )
  ) {
    return "warning" as const;
  }

  if (
    [
      "INACTIVE",
      "LOCKED",
      "REJECTED",
      "SOLD",
      "RENTED",
      "LOST",
      "CANCELLED",
      "TERMINATED",
      "EXPIRED",
    ].includes(
      normalizedStatus,
    )
  ) {
    return "danger" as const;
  }

  if (
    ["OPEN", "IN_PROGRESS", "RESOLVED"].includes(normalizedStatus)
  ) {
    return "brand" as const;
  }

  return "neutral" as const;
}
