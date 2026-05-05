import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface UseDeleteEntityOptions {
  onSuccess?: () => void;
  onError?: (error: any) => void;
  successMessage?: string;
  errorMessage?: string;
}

/**
 * Generic hook for deleting any entity (User, Product, Order, etc.)
 * 
 * @example
 * // For Users
 * const { deleteItem } = useDeleteEntity(deleteUser, USERS_QUERY_KEY, 'User');
 * 
 * @example
 * // For Products
 * const { deleteItem } = useDeleteEntity(deleteProduct, PRODUCTS_QUERY_KEY, 'Product');
 * 
 * @example
 * // For Orders with custom callback
 * const { deleteItem } = useDeleteEntity(
 *   deleteOrder, 
 *   ORDERS_QUERY_KEY, 
 *   'Order',
 *   { onSuccess: () => navigate('/orders') }
 * );
 * 
 * @param deleteFn - The delete function from the service
 * @param queryKey - The query key to invalidate after deletion
 * @param entityName - Name of the entity for toast messages (e.g., 'User', 'Product')
 * @param options - Optional callbacks and custom messages
 */
export const useDeleteEntity = <T = string>(
  deleteFn: (id: T) => Promise<void>,
  queryKey: readonly string[],
  entityName: string = 'Item',
  options?: UseDeleteEntityOptions
) => {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: T) => deleteFn(id),
    onSuccess: () => {
      toast.success(options?.successMessage || `${entityName} deleted successfully`);
      queryClient.invalidateQueries({ queryKey });
      options?.onSuccess?.();
    },
    onError: (err) => {
      console.error(`Error deleting ${entityName.toLowerCase()}:`, err);
      toast.error(options?.errorMessage || `Failed to delete ${entityName.toLowerCase()}`);
      options?.onError?.(err);
    },
  });

  return {
    deleteItem: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    deleteMutation,
  };
};
