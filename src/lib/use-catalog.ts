import { useQuery } from "@tanstack/react-query";
import {
  getCategories,
  getProductBySlug,
  getProductReviews,
  getProducts,
} from "@/lib/catalog-api";

export function useProducts() {
  return useQuery({
    queryKey: ["catalog", "products"],
    queryFn: getProducts,
    staleTime: 60_000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["catalog", "categories"],
    queryFn: getCategories,
    staleTime: 60_000,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["catalog", "product", slug],
    queryFn: () => getProductBySlug(slug),
    enabled: Boolean(slug),
    staleTime: 60_000,
  });
}

export function useProductReviews(productId?: string) {
  return useQuery({
    queryKey: ["catalog", "reviews", productId],
    queryFn: () => getProductReviews(productId!),
    enabled: Boolean(productId),
    staleTime: 60_000,
  });
}
