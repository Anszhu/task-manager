import type { PaginationMeta } from "../types/domain.js";

export const buildPaginationMeta = (
  page: number,
  pageSize: number,
  totalItems: number
): PaginationMeta => ({
  page,
  pageSize,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / pageSize))
});
