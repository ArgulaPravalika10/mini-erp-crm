import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../components/Badge";
import { EmptyState } from "../components/EmptyState";
import { StatusMessage } from "../components/StatusMessage";
import API, { getApiError } from "../services/api";
import type { DashboardStats } from "../types";
import { formatCurrency, formatDateTime, productStock } from "../utils/format";

const emptyStats: DashboardStats = {
  totalCustomers: 0,
  totalProducts: 0,
  totalOrders: 0,
  revenue: 0,
  lowStockProducts: [],
  recentOrders: [],
  salesTrend: [],
  recentActivities: [],
};

function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await API.get<DashboardStats>("/api/dashboard");
        setStats(response.data);
      } catch (requestError) {
        setError(getApiError(requestError));
      } finally {
        setLoading(false);
      }
    };

    void fetchStats();
  }, []);

  const maxTrendValue = useMemo(
    () => Math.max(...stats.salesTrend.map((point) => point.total), 1),
    [stats.salesTrend],
  );

  if (loading) {
    return <div className="loading-panel">Loading dashboard...</div>;
  }

  return (
    <div className="page-stack">
      {error ? <StatusMessage type="error" message={error} /> : null}

      <section className="summary-grid">
        <article className="summary-card">
          <span>Total customers</span>
          <strong>{stats.totalCustomers}</strong>
          <small>CRM accounts</small>
        </article>
        <article className="summary-card">
          <span>Total products</span>
          <strong>{stats.totalProducts}</strong>
          <small>Inventory SKUs</small>
        </article>
        <article className="summary-card">
          <span>Total challans</span>
          <strong>{stats.totalOrders}</strong>
          <small>Draft and confirmed</small>
        </article>
        <article className="summary-card">
          <span>Revenue</span>
          <strong>{formatCurrency(stats.revenue)}</strong>
          <small>Confirmed challans</small>
        </article>
      </section>

      <section className="dashboard-grid">
        <div className="panel wide-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Revenue trend</p>
              <h2>Confirmed sales</h2>
            </div>
          </div>
          <div className="bar-chart">
            {stats.salesTrend.map((point) => (
              <div className="bar-item" key={point.label}>
                <div className="bar-track">
                  <span
                    style={{
                      height: `${Math.max((point.total / maxTrendValue) * 100, 4)}%`,
                    }}
                  />
                </div>
                <small>{point.label}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Inventory alerts</p>
              <h2>Low stock</h2>
            </div>
            <Link className="text-link" to="/products">
              View all
            </Link>
          </div>

          {stats.lowStockProducts.length === 0 ? (
            <EmptyState
              title="No low stock alerts"
              message="Products above minimum stock will appear clear here."
            />
          ) : (
            <div className="compact-list">
              {stats.lowStockProducts.map((product) => (
                <Link to={`/products/${product.id}`} key={product.id}>
                  <strong>{product.name}</strong>
                  <span>
                    {product.sku} - {productStock(product)} left
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Sales desk</p>
              <h2>Recent challans</h2>
            </div>
            <Link className="text-link" to="/orders">
              View all
            </Link>
          </div>

          {stats.recentOrders.length === 0 ? (
            <EmptyState
              title="No challans yet"
              message="New sales challans will be listed here."
            />
          ) : (
            <div className="responsive-table">
              <table>
                <thead>
                  <tr>
                    <th>Challan</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <Link to={`/orders/${order.id}`}>
                          {order.challan_number}
                        </Link>
                      </td>
                      <td>{order.customer_name}</td>
                      <td>
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
                      </td>
                      <td>{formatCurrency(order.total_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Activity</p>
              <h2>Recent updates</h2>
            </div>
          </div>

          {stats.recentActivities.length === 0 ? (
            <EmptyState
              title="No activity yet"
              message="Follow-ups, stock changes, and challans will appear here."
            />
          ) : (
            <div className="activity-list">
              {stats.recentActivities.map((activity) => (
                <div
                  className="activity-item"
                  key={`${activity.type}-${activity.created_at}-${activity.title}`}
                >
                  <Badge tone="info">{activity.type}</Badge>
                  <div>
                    <strong>{activity.title}</strong>
                    <span>{formatDateTime(activity.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
