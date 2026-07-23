import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { StatusMessage } from "../components/StatusMessage";
import { useAuth } from "../context/useAuth";
import API, { getApiError } from "../services/api";
import type { Customer } from "../types";
import { formatDate, formatDateTime } from "../utils/format";

function CustomerDetail() {
  const { can } = useAuth();
  const { id } = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [note, setNote] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchCustomer = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await API.get<{ data: Customer }>(`/api/customers/${id}`);
      setCustomer(response.data.data);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchCustomer();
  }, [fetchCustomer]);

  const submitFollowUp = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setSuccess("");
    setError("");

    try {
      await API.post(`/api/customers/${id}/follow-ups`, {
        note,
        followUpDate: followUpDate || null,
      });
      setNote("");
      setFollowUpDate("");
      setSuccess("Follow-up note added");
      await fetchCustomer();
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-panel">Loading customer...</div>;
  }

  if (!customer) {
    return (
      <EmptyState
        title="Customer not found"
        message="The selected customer record is unavailable."
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
            <p className="eyebrow">Customer detail</p>
            <h2>{customer.name}</h2>
          </div>
          <div className="table-actions">
            <Link className="btn btn-secondary" to="/customers">
              Back
            </Link>
            {can(["Admin", "Sales"]) ? (
              <Link className="btn btn-primary" to={`/customers/${customer.id}/edit`}>
                Edit
              </Link>
            ) : null}
          </div>
        </div>

        <div className="detail-grid">
          <div>
            <span>Business</span>
            <strong>{customer.business_name || "Individual"}</strong>
          </div>
          <div>
            <span>Mobile</span>
            <strong>{customer.mobile || customer.phone || "Not set"}</strong>
          </div>
          <div>
            <span>Email</span>
            <strong>{customer.email || "Not set"}</strong>
          </div>
          <div>
            <span>GST</span>
            <strong>{customer.gst_number || "Not set"}</strong>
          </div>
          <div>
            <span>Type</span>
            <strong>{customer.customer_type}</strong>
          </div>
          <div>
            <span>Status</span>
            <Badge tone={customer.status === "Active" ? "success" : "warning"}>
              {customer.status}
            </Badge>
          </div>
          <div>
            <span>Follow-up</span>
            <strong>{formatDate(customer.follow_up_date)}</strong>
          </div>
          <div className="full-span">
            <span>Address</span>
            <strong>{customer.address || "Not set"}</strong>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">CRM timeline</p>
              <h2>Follow-up history</h2>
            </div>
          </div>
          {!customer.followUps || customer.followUps.length === 0 ? (
            <EmptyState
              title="No follow-ups"
              message="Notes added by the sales team will appear here."
            />
          ) : (
            <div className="activity-list">
              {customer.followUps.map((followUp) => (
                <div className="activity-item" key={followUp.id}>
                  <Badge tone="info">{formatDate(followUp.follow_up_date)}</Badge>
                  <div>
                    <strong>{followUp.note}</strong>
                    <span>
                      {followUp.created_by_name || "Team"} on{" "}
                      {formatDateTime(followUp.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {can(["Admin", "Sales"]) ? (
          <form className="panel form-panel" onSubmit={submitFollowUp}>
            <div>
              <p className="eyebrow">Next action</p>
              <h2>Add follow-up</h2>
            </div>
            <label>
              Follow-up date
              <input
                type="date"
                value={followUpDate}
                onChange={(event) => setFollowUpDate(event.target.value)}
              />
            </label>
            <label>
              Note
              <textarea
                rows={5}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                required
              />
            </label>
            <Button disabled={saving}>{saving ? "Saving..." : "Add note"}</Button>
          </form>
        ) : null}
      </section>
    </div>
  );
}

export default CustomerDetail;
