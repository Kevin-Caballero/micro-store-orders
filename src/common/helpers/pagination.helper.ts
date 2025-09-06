/**
 * Class for pagination metadata
 */
export class PaginationHelper {
  /**
   * Builds metadata for pagination
   * @param limit Number of items per page
   * @param page Current page
   * @param totalItems Total number of items in the collection
   * @param baseUrl Base URL for building pagination links
   * @returns Object with pagination metadata
   */
  static async buildMeta(
    limit: number,
    page: number,
    totalItems: number,
    baseUrl: string,
  ) {
    const currentPage = page;
    const totalPages = Math.ceil(totalItems / limit);

    const nextPageUrl =
      page < totalPages ? `${baseUrl}?page=${page + 1}&limit=${limit}` : null;
    const prevPageUrl =
      page > 1 ? `${baseUrl}?page=${page - 1}&limit=${limit}` : null;
    const firstPageUrl = totalPages ? `${baseUrl}?page=1&limit=${limit}` : null;
    const lastPageUrl = totalPages
      ? `${baseUrl}?page=${totalPages}&limit=${limit}`
      : null;

    return {
      totalItems,
      currentPage,
      totalPages,
      nextPageUrl,
      prevPageUrl,
      firstPageUrl,
      lastPageUrl,
    };
  }
}
