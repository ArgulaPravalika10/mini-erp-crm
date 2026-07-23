import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { StatusMessage } from "../components/StatusMessage";
import { useAuth } from "../context/useAuth";
import API, { getApiError } from "../services/api";
import type { Product } from "../types";
import {
  productMinimumStock,
  productPrice,
  productStock,
} from "../utils/format";

interface ProductFormState {
  name: string;
  sku: string;
  category: string;
  unitPrice: string;
  currentStock: string;
  minimumStockAlertQuantity: string;
  location: string;
  description: string;
}

const initialForm: ProductFormState = {
  name: "",
  sku: "",
  category: "",
  unitPrice: "",
  currentStock: "0",
  minimumStockAlertQuantity: "0",
  location: "",
  description: "",
};

function ProductForm() {
  const { can } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState<ProductFormState>(initialForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await API.get<{ data: Product }>(`/api/products/${id}`);
        const product = response.data.data;
        setForm({
          name: product.name || "",
          sku: product.sku || "",
          category: product.category || "",
          unitPrice: String(productPrice(product)),
          currentStock: String(productStock(product)),
          minimumStockAlertQuantity: String(productMinimumStock(product)),
          location: product.location || "",
          description: product.description || "",
        });
      } catch (requestError) {
        setError(getApiError(requestError));
      } finally {
        setLoading(false);
      }
    };

    void fetchProduct();
  }, [id]);

  if (!can(["Admin", "Warehouse"])) {
    return <Navigate to="/products" replace />;
  }

  const updateField = <K extends keyof ProductFormState>(
    field: K,
    value: ProductFormState[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      unitPrice: Number(form.unitPrice),
      currentStock: Number(form.currentStock),
      minimumStockAlertQuantity: Number(form.minimumStockAlertQuantity),
    };

    try {
      if (isEdit) {
        await API.put(`/api/products/${id}`, payload);
        navigate(`/products/${id}`);
      } else {
        const response = await API.post<{ data: Product }>("/api/products", payload);
        navigate(`/products/${response.data.data.id}`);
      }
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-panel">Loading product...</div>;
  }

  return (
    <form className="panel form-panel" onSubmit={handleSubmit}>
      <div className="panel-header">
        <div>
          <p className="eyebrow">Inventory item</p>
          <h2>{isEdit ? "Edit product" : "Add product"}</h2>
        </div>
        <Link className="btn btn-secondary" to="/products">
          Back
        </Link>
      </div>

      {error ? <StatusMessage type="error" message={error} /> : null}

      <div className="form-grid">
        <label>
          Product name
          <input
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            required
          />
        </label>
        <label>
          SKU/code
          <input
            value={form.sku}
            onChange={(event) => updateField("sku", event.target.value)}
            required
          />
        </label>
        <label>
          Category
          <input
            value={form.category}
            onChange={(event) => updateField("category", event.target.value)}
          />
        </label>
        <label>
          Unit price
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.unitPrice}
            onChange={(event) => updateField("unitPrice", event.target.value)}
            required
          />
        </label>
        {!isEdit ? (
          <label>
            Opening stock
            <input
              type="number"
              min="0"
              value={form.currentStock}
              onChange={(event) => updateField("currentStock", event.target.value)}
              required
            />
          </label>
        ) : null}
        <label>
          Minimum stock alert
          <input
            type="number"
            min="0"
            value={form.minimumStockAlertQuantity}
            onChange={(event) =>
              updateField("minimumStockAlertQuantity", event.target.value)
            }
            required
          />
        </label>
        <label>
          Warehouse/location
          <input
            value={form.location}
            onChange={(event) => updateField("location", event.target.value)}
          />
        </label>
        <label className="full-span">
          Description
          <textarea
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
            rows={4}
          />
        </label>
      </div>

      <div className="form-actions">
        <Button disabled={saving}>{saving ? "Saving..." : "Save product"}</Button>
      </div>
    </form>
  );
}

export default ProductForm;
