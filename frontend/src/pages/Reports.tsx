import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Badge } from "../components/Badge";
import { EmptyState } from "../components/EmptyState";
import { StatusMessage } from "../components/StatusMessage";
import { useAuth } from "../context/useAuth";
import API, { getApiError } from "../services/api";
import type { Challan } from "../types";
import { formatCurrency, formatDateTime } from "../utils/format";

function Reports() {
  const { can } = useAuth();
  const [rows, setRows] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await API.get<{ data: Challan[] }>("/api/dashboard/sales");
        setRows(response.data.data);
      } catch (requestError) {
        setError(getApiError(requestError));
      } finally {
        setLoading(false);
      }
    };

    void fetchReport();
  }, []);

  if (!can(["Admin", "Accounts"])) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Accounts</p>
            <h2>Sales report</h2>
          </div>
        </div>

        {error ? <StatusMessage type="error" message={error} /> : null}

        {loading ? (
          <div className="loading-panel">Loading report...</div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="No sales report rows"
            message="Confirmed and draft challans will appear here."
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
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.challan_number}</td>
                    <td>{row.customer_name}</td>
                    <td>{row.total_quantity}</td>
                    <td>{formatCurrency(row.total_amount)}</td>
                    <td>
                      <Badge tone={row.status === "Confirmed" ? "success" : "warning"}>
                        {row.status}
                      </Badge>
                    </td>
                    <td>{formatDateTime(row.created_at)}</td>
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

export default Reports;
