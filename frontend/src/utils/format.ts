import type { Product } from "../types";

export const formatCurrency = (value: string | number | null | undefined) =>
  `INR ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return "Not set";
  }

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return "Not set";
  }

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const productPrice = (product: Product) =>
  Number(product.unitPrice ?? product.unit_price ?? product.price ?? 0);

export const productStock = (product: Product) =>
  Number(product.currentStock ?? product.current_stock ?? product.quantity ?? 0);

export const productMinimumStock = (product: Product) =>
  Number(
    product.minimumStockAlertQuantity ??
      product.minimum_stock_alert_quantity ??
      0,
  );
