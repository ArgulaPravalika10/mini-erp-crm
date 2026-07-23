import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { StatusMessage } from "../components/StatusMessage";
import { useAuth } from "../context/useAuth";
import API, { getApiError } from "../services/api";
import type { Product } from "../types";
import {
  formatCurrency,
  formatDateTime,
  productMinimumStock,
  productPrice,
  productStock,
} from "../utils/format";

function ProductDetail() {
  const { can } = useAuth();
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [movementType, setMovementType] = useState<"IN" | "OUT">("IN");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await API.get<{ data: Product }>(`/api/products/${id}`);
      setProduct(response.data.data);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchProduct();
  }, [fetchProduct]);

  const adjustStock = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setSuccess("");
    setError("");

    try {
      await API.post(`/api/products/${id}/stock`, {
        movementType,
        quantity: Number(quantity),
        reason,
      });
      setQuantity("1");
      setReason("");
      setSuccess("Stock updated successfully");
      await fetchProduct();
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-panel">Loading product...</div>;
  }

  if (!product) {
    return (
      <EmptyState
        title="Product not found"
        message="The selected product record is unavailable."
      />
    );
  }

  const stock = productStock(product);
  const minimum = productMinimumStock(product);

  return (
    <div className="page-stack">
      {error ? <StatusMessage type="error" message={error} /> : null}
      {success ? <StatusMessage type="success" message={success} /> : null}

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Product detail</p>
            <h2>{product.name}</h2>
          </div>
          <div className="table-actions">
            <Link className="btn btn-secondary" to="/products">
              Back
            </Link>
            {can(["Admin", "Warehouse"]) ? (
              <Link className="btn btn-primary" to={`/products/${product.id}/edit`}>
                Edit
              </Link>
            ) : null}
          </div>
        </div>

        <div className="detail-grid">
          <div>
            <span>SKU</span>
            <strong>{product.sku}</strong>
          </div>
          <div>
            <span>Category</span>
            <strong>{product.category || "Uncategorized"}</strong>
          </div>
          <div>
            <span>Unit price</span>
            <strong>{formatCurrency(productPrice(product))}</strong>
          </div>
          <div>
            <span>Current stock</span>
            <Badge tone={stock <= minimum ? "danger" : "success"}>{stock}</Badge>
          </div>
          <div>
            <span>Minimum alert</span>
            <strong>{minimum}</strong>
          </div>
          <div>
            <span>Location</span>
            <strong>{product.location || "Not set"}</strong>
          </div>
          <div className="full-span">
            <span>Description</span>
            <strong>{product.description || "Not set"}</strong>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Inventory ledger</p>
              <h2>Stock movement history</h2>
            </div>
          </div>

          {!product.movements || product.movements.length === 0 ? (
            <EmptyState
              title="No stock movements"
              message="Opening stock, manual adjustments, and challans appear here."
            />
          ) : (
            <div className="responsive-table">
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Reason</th>
                    <th>By</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {product.movements.map((movement) => (
                    <tr key={movement.id}>
                      <td>
                        <Badge
                          tone={movement.movement_type === "IN" ? "success" : "warning"}
                        >
                          {movement.movement_type}
                        </Badge>
                      </td>
                      <td>{movement.quantity_changed}</td>
                      <td>{movement.reason}</td>
                      <td>{movement.created_by_name || "System"}</td>
                      <td>{formatDateTime(movement.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {can(["Admin", "Warehouse"]) ? (
          <form className="panel form-panel" onSubmit={adjustStock}>
            <div>
              <p className="eyebrow">Warehouse action</p>
              <h2>Update stock</h2>
            </div>
            <label>
              Movement type
              <select
                value={movementType}
                onChange={(event) =>
                  setMovementType(event.target.value as "IN" | "OUT")
                }
              >
                <option value="IN">IN</option>
                <option value="OUT">OUT</option>
              </select>
            </label>
            <label>
              Quantity
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                required
              />
            </label>
            <label>
              Reason
              <textarea
                rows={4}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                required
              />
            </label>
            <Button disabled={saving}>{saving ? "Saving..." : "Update stock"}</Button>
          </form>
        ) : null}
      </section>
    </div>
  );
}

export default ProductDetail;
