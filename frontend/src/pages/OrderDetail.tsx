import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { StatusMessage } from "../components/StatusMessage";
import { useAuth } from "../context/useAuth";
import API, { getApiError } from "../services/api";
import type { Challan, ChallanStatus } from "../types";
import { formatCurrency, formatDateTime } from "../utils/format";

const steps: ChallanStatus[] = ["Draft", "Confirmed", "Cancelled"];

function OrderDetail() {
  const { can } = useAuth();
  const { id } = useParams();
  const [order, setOrder] = useState<Challan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await API.get<{ data: Challan }>(`/api/orders/${id}`);
      setOrder(response.data.data);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchOrder();
  }, [fetchOrder]);

  const updateStatus = async (status: ChallanStatus) => {
    setSaving(true);
    setSuccess("");
    setError("");

    try {
      await API.put(`/api/orders/${id}/status`, { status });
      setSuccess("Challan status updated");
      await fetchOrder();
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-panel">Loading challan...</div>;
  }

  if (!order) {
    return (
      <EmptyState
        title="Challan not found"
        message="The selected challan record is unavailable."
      />
    );
  }

  return (
    <div className="page-stack">
      {error ? <StatusMessage type="error" message={error} /> : null}
      {success ? <StatusMessage type="success" message={success} /> : null}

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Challan detail</p>
            <h2>{order.challan_number}</h2>
          </div>
          <div className="table-actions">
            <Link className="btn btn-secondary" to="/orders">
              Back
            </Link>
            {can(["Admin", "Sales"]) && order.status === "Draft" ? (
              <Button
                type="button"
                disabled={saving}
                onClick={() => void updateStatus("Confirmed")}
              >
                Confirm
              </Button>
            ) : null}
            {can(["Admin", "Sales"]) && order.status === "Confirmed" ? (
              <Button
                type="button"
                variant="danger"
                disabled={saving}
                onClick={() => void updateStatus("Cancelled")}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </div>

        <div className="status-track">
          {steps.map((step) => (
            <div
              className={step === order.status ? "current" : ""}
              key={step}
            >
              <span>{step}</span>
            </div>
          ))}
        </div>

        <div className="detail-grid">
          <div>
            <span>Customer</span>
            <strong>{order.customer_name}</strong>
          </div>
          <div>
            <span>Business</span>
            <strong>{order.business_name || "Individual"}</strong>
          </div>
          <div>
            <span>Mobile</span>
            <strong>{order.mobile || order.phone || "Not set"}</strong>
          </div>
          <div>
            <span>Email</span>
            <strong>{order.email || "Not set"}</strong>
          </div>
          <div>
            <span>Status</span>
            <Badge
              tone={
                order.status === "Confirmed"
                  ? "success"
                  : order.status === "Cancelled"
                    ? "danger"
                    : "warning"
              }
            >
              {order.status}
            </Badge>
          </div>
          <div>
            <span>Created</span>
            <strong>{formatDateTime(order.created_at)}</strong>
          </div>
          <div>
            <span>Total quantity</span>
            <strong>{order.total_quantity}</strong>
          </div>
          <div>
            <span>Total amount</span>
            <strong>{formatCurrency(order.total_amount)}</strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Snapshot</p>
            <h2>Products sold</h2>
          </div>
        </div>
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Unit price</th>
                <th>Quantity</th>
                <th>Line total</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item) => (
                <tr key={item.id}>
                  <td>{item.product_name_snapshot}</td>
                  <td>{item.product_sku_snapshot}</td>
                  <td>{formatCurrency(item.unit_price_snapshot)}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default OrderDetail;
