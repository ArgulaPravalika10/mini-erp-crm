import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { StatusMessage } from "../components/StatusMessage";
import { useAuth } from "../context/useAuth";
import API, { getApiError } from "../services/api";
import type { Customer } from "../types";

interface CustomerFormState {
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber: string;
  customerType: "Retail" | "Wholesale" | "Distributor";
  address: string;
  status: "Lead" | "Active" | "Inactive";
  followUpDate: string;
  notes: string;
}

const initialForm: CustomerFormState = {
  name: "",
  mobile: "",
  email: "",
  businessName: "",
  gstNumber: "",
  customerType: "Retail",
  address: "",
  status: "Lead",
  followUpDate: "",
  notes: "",
};

function CustomerForm() {
  const { can } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState<CustomerFormState>(initialForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!id) {
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await API.get<{ data: Customer }>(`/api/customers/${id}`);
        const customer = response.data.data;
        setForm({
          name: customer.name || "",
          mobile: customer.mobile || customer.phone || "",
          email: customer.email || "",
          businessName: customer.business_name || "",
          gstNumber: customer.gst_number || "",
          customerType: customer.customer_type,
          address: customer.address || "",
          status: customer.status,
          followUpDate: customer.follow_up_date?.slice(0, 10) || "",
          notes: customer.notes || "",
        });
      } catch (requestError) {
        setError(getApiError(requestError));
      } finally {
        setLoading(false);
      }
    };

    void fetchCustomer();
  }, [id]);

  if (!can(["Admin", "Sales"])) {
    return <Navigate to="/customers" replace />;
  }

  const updateField = <K extends keyof CustomerFormState>(
    field: K,
    value: CustomerFormState[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (isEdit) {
        await API.put(`/api/customers/${id}`, form);
        navigate(`/customers/${id}`);
      } else {
        const response = await API.post<{ data: Customer }>("/api/customers", form);
        navigate(`/customers/${response.data.data.id}`);
      }
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-panel">Loading customer...</div>;
  }

  return (
    <form className="panel form-panel" onSubmit={handleSubmit}>
      <div className="panel-header">
        <div>
          <p className="eyebrow">CRM record</p>
          <h2>{isEdit ? "Edit customer" : "Add customer"}</h2>
        </div>
        <Link className="btn btn-secondary" to="/customers">
          Back
        </Link>
      </div>

      {error ? <StatusMessage type="error" message={error} /> : null}

      <div className="form-grid">
        <label>
          Customer name
          <input
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            required
          />
        </label>
        <label>
          Mobile number
          <input
            value={form.mobile}
            onChange={(event) => updateField("mobile", event.target.value)}
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
          />
        </label>
        <label>
          Business name
          <input
            value={form.businessName}
            onChange={(event) => updateField("businessName", event.target.value)}
          />
        </label>
        <label>
          GST number
          <input
            value={form.gstNumber}
            onChange={(event) => updateField("gstNumber", event.target.value)}
          />
        </label>
        <label>
          Customer type
          <select
            value={form.customerType}
            onChange={(event) =>
              updateField(
                "customerType",
                event.target.value as CustomerFormState["customerType"],
              )
            }
          >
            <option value="Retail">Retail</option>
            <option value="Wholesale">Wholesale</option>
            <option value="Distributor">Distributor</option>
          </select>
        </label>
        <label>
          Status
          <select
            value={form.status}
            onChange={(event) =>
              updateField("status", event.target.value as CustomerFormState["status"])
            }
          >
            <option value="Lead">Lead</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </label>
        <label>
          Follow-up date
          <input
            type="date"
            value={form.followUpDate}
            onChange={(event) => updateField("followUpDate", event.target.value)}
          />
        </label>
        <label className="full-span">
          Address
          <textarea
            value={form.address}
            onChange={(event) => updateField("address", event.target.value)}
            rows={3}
          />
        </label>
        <label className="full-span">
          Notes
          <textarea
            value={form.notes}
            onChange={(event) => updateField("notes", event.target.value)}
            rows={4}
          />
        </label>
      </div>

      <div className="form-actions">
        <Button disabled={saving}>{saving ? "Saving..." : "Save customer"}</Button>
      </div>
    </form>
  );
}

export default CustomerForm;
