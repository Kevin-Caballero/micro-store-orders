export interface PaginatedResult<T> {
  data: T[];
  meta: {
    totalPages: number;
    currentPage: number;
    nextPageUrl: string | null;
    prevPageUrl: string | null;
    firstPageUrl: string | null;
    lastPageUrl: string | null;
  };
}
