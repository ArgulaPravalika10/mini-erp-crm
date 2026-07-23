import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { StatusMessage } from "../components/StatusMessage";
import { useAuth } from "../context/useAuth";
import API, { getApiError } from "../services/api";
import type { ApiList, Customer } from "../types";
import { formatDate } from "../utils/format";

function Customers() {
  const { can } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await API.get<ApiList<Customer>>("/api/customers", {
        params: {
          search: search || undefined,
          status: status || undefined,
          limit: 50,
        },
      });
      setCustomers(response.data.data);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    void fetchCustomers();
  }, [fetchCustomers]);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    void fetchCustomers();
  };

  const deleteCustomer = async (id: number) => {
    const confirmed = window.confirm("Delete this customer?");

    if (!confirmed) {
      return;
    }

    setSuccess("");
    setError("");

    try {
      await API.delete(`/api/customers/${id}`);
      setSuccess("Customer deleted successfully");
      await fetchCustomers();
    } catch (requestError) {
      setError(getApiError(requestError));
    }
  };

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">CRM</p>
            <h2>Customer management</h2>
          </div>
          {can(["Admin", "Sales"]) ? (
            <Link className="btn btn-primary" to="/customers/new">
              Add customer
            </Link>
          ) : null}
        </div>

        {error ? <StatusMessage type="error" message={error} /> : null}
        {success ? <StatusMessage type="success" message={success} /> : null}

        <form className="toolbar" onSubmit={handleSearch}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search customers, GST, mobile"
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            <option value="Lead">Lead</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        {loading ? (
          <div className="loading-panel">Loading customers...</div>
        ) : customers.length === 0 ? (
          <EmptyState
            title="No customers found"
            message="Add a customer or adjust the search filters."
          />
        ) : (
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Business</th>
                  <th>Mobile</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Follow-up</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <Link to={`/customers/${customer.id}`}>{customer.name}</Link>
                      <small>{customer.email || "No email"}</small>
                    </td>
                    <td>{customer.business_name || "Individual"}</td>
                    <td>{customer.mobile || customer.phone || "Not set"}</td>
                    <td>{customer.customer_type}</td>
                    <td>
                      <Badge
                        tone={
                          customer.status === "Active"
                            ? "success"
                            : customer.status === "Inactive"
                              ? "neutral"
                              : "warning"
                        }
                      >
                        {customer.status}
                      </Badge>
                    </td>
                    <td>{formatDate(customer.follow_up_date)}</td>
                    <td className="table-actions">
                      <Link className="btn btn-ghost" to={`/customers/${customer.id}`}>
                        View
                      </Link>
                      {can(["Admin", "Sales"]) ? (
                        <Link
                          className="btn btn-secondary"
                          to={`/customers/${customer.id}/edit`}
                        >
                          Edit
                        </Link>
                      ) : null}
                      {can(["Admin"]) ? (
                        <Button
                          type="button"
                          variant="danger"
                          onClick={() => void deleteCustomer(customer.id)}
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

export default Customers;
