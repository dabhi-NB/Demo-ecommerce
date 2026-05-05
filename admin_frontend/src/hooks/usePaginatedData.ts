import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface PaginationParams {
  page?: number;
  per_page?: number;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  current_page: number;
  last_page: number;
}



export function usePaginatedData<T>(fetchFn: (params: PaginationParams) => Promise<PaginatedResponse<T>>, queryKey: string[], initialPageSize = 10): {
  data: T[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  pagination: PaginationParams;
  totalPages: number;
  refetchPage: (page: number, perPage?: number) => void;
  setPagination: React.Dispatch<React.SetStateAction<PaginationParams>>;
} {
  const [pagination, setPagination] = useState<PaginationParams>({ page: 1, per_page: initialPageSize });

  const query = useQuery({
    queryKey: [...queryKey, pagination],
    queryFn: () => fetchFn(pagination),
  });

  const data = query.data;

  const totalPages = data?.last_page || 1;

  const refetchPage = (page: number, perPage?: number) => {
    setPagination({ page, per_page: perPage || pagination.per_page });
  };

  return {
    ...query,
    data: data?.data ?? [],
    pagination,
    totalPages,
    refetchPage,
    setPagination,
  };
}
