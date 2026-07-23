import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { StatusMessage } from "../components/StatusMessage";
import { useAuth } from "../context/useAuth";
import API, { getApiError } from "../services/api";
import type { ApiList, Challan, ChallanStatus } from "../types";
import { formatCurrency, formatDateTime } from "../utils/format";

const statusTone = (status: ChallanStatus) => {
  if (status === "Confirmed") {
    return "success";
  }

  if (status === "Cancelled") {
    return "danger";
  }

  return "warning";
};

function Orders() {
  const { can } = useAuth();
  const [orders, setOrders] = useState<Challan[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await API.get<ApiList<Challan>>("/api/orders", {
        params: {
          search: search || undefined,
          status: status || undefined,
          limit: 50,
        },
      });
      setOrders(response.data.data);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    void fetchOrders();
  };

  const updateStatus = async (id: number, nextStatus: ChallanStatus) => {
    setSuccess("");
    setError("");

    try {
      await API.put(`/api/orders/${id}/status`, { status: nextStatus });
      setSuccess("Challan status updated");
      await fetchOrders();
    } catch (requestError) {
      setError(getApiError(requestError));
    }
  };

  const deleteOrder = async (id: number) => {
    if (!window.confirm("Delete this draft challan?")) {
      return;
    }

    setSuccess("");
    setError("");

    try {
      await API.delete(`/api/orders/${id}`);
      setSuccess("Challan deleted successfully");
      await fetchOrders();
    } catch (requestError) {
      setError(getApiError(requestError));
    }
  };

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Sales</p>
            <h2>Sales challans</h2>
          </div>
          {can(["Admin", "Sales"]) ? (
            <Link className="btn btn-primary" to="/orders/new">
              Create challan
            </Link>
          ) : null}
        </div>

        {error ? <StatusMessage type="error" message={error} /> : null}
        {success ? <StatusMessage type="success" message={success} /> : null}

        <form className="toolbar" onSubmit={handleSearch}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search challan or customer"
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            <option value="Draft">Draft</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        {loading ? (
          <div className="loading-panel">Loading challans...</div>
        ) : orders.length === 0 ? (
          <EmptyState
            title="No challans found"
            message="Create a challan or adjust the search filters."
          />
        ) : (
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Challan</th>
                  <th>Customer</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link to={`/orders/${order.id}`}>{order.challan_number}</Link>
                      <small>{order.created_by_name || "System"}</small>
                    </td>
                    <td>{order.customer_name}</td>
                    <td>{order.total_quantity}</td>
                    <td>{formatCurrency(order.total_amount)}</td>
                    <td>
                      <Badge tone={statusTone(order.status)}>{order.status}</Badge>
                    </td>
                    <td>{formatDateTime(order.created_at)}</td>
                    <td className="table-actions">
                      <Link className="btn btn-ghost" to={`/orders/${order.id}`}>
                        View
                      </Link>
                      {can(["Admin", "Sales"]) && order.status === "Draft" ? (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => void updateStatus(order.id, "Confirmed")}
                        >
                          Confirm
                        </Button>
                      ) : null}
                      {can(["Admin", "Sales"]) && order.status === "Confirmed" ? (
                        <Button
                          type="button"
                          variant="danger"
                          onClick={() => void updateStatus(order.id, "Cancelled")}
                        >
                          Cancel
                        </Button>
                      ) : null}
                      {can(["Admin"]) && order.status === "Draft" ? (
                        <Button
                          type="button"
                          variant="danger"
                          onClick={() => void deleteOrder(order.id)}
                        >
                          Delete
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default Orders;
