import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { StatusMessage } from "../components/StatusMessage";
import { useAuth } from "../context/useAuth";
import API, { getApiError } from "../services/api";
import type { ApiList, Challan, ChallanStatus, Customer, Product } from "../types";
import {
  formatCurrency,
  productPrice,
  productStock,
} from "../utils/format";

interface LineItem {
  productId: string;
  quantity: string;
}

const blankLine: LineItem = {
  productId: "",
  quantity: "1",
};

function OrderCreate() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [status, setStatus] = useState<ChallanStatus>("Draft");
  const [items, setItems] = useState<LineItem[]>([blankLine]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLookups = async () => {
      setLoading(true);
      setError("");

      try {
        const [customerResponse, productResponse] = await Promise.all([
          API.get<ApiList<Customer>>("/api/customers", { params: { limit: 100 } }),
          API.get<ApiList<Product>>("/api/products", { params: { limit: 100 } }),
        ]);
        setCustomers(customerResponse.data.data);
        setProducts(productResponse.data.data);
      } catch (requestError) {
        setError(getApiError(requestError));
      } finally {
        setLoading(false);
      }
    };

    void fetchLookups();
  }, []);

  const productMap = useMemo(
    () => new Map(products.map((product) => [String(product.id), product])),
    [products],
  );

  const totalAmount = items.reduce((total, item) => {
    const product = productMap.get(item.productId);
    return total + productPrice(product || ({} as Product)) * Number(item.quantity || 0);
  }, 0);

  if (!can(["Admin", "Sales"])) {
    return <Navigate to="/orders" replace />;
  }

  const updateItem = (
    index: number,
    field: keyof LineItem,
    value: string,
  ) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const addLine = () => {
    setItems((current) => [...current, { ...blankLine }]);
  };

  const removeLine = (index: number) => {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await API.post<{ data: Challan }>("/api/orders", {
        customerId: Number(customerId),
        status,
        items: items.map((item) => ({
          productId: Number(item.productId),
          quantity: Number(item.quantity),
        })),
      });
      navigate(`/orders/${response.data.data.id}`);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-panel">Loading challan form...</div>;
  }

  if (customers.length === 0 || products.length === 0) {
    return (
      <EmptyState
        title="Customers and products required"
        message="Create at least one customer and one product before challan entry."
      />
    );
  }

  return (
    <form className="panel form-panel" onSubmit={handleSubmit}>
      <div className="panel-header">
        <div>
          <p className="eyebrow">Sales challan</p>
          <h2>Create challan</h2>
        </div>
        <Link className="btn btn-secondary" to="/orders">
          Back
        </Link>
      </div>

      {error ? <StatusMessage type="error" message={error} /> : null}

      <div className="form-grid">
        <label>
          Customer
          <select
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
            required
          >
            <option value="">Select customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as ChallanStatus)}
          >
            <option value="Draft">Draft</option>
            <option value="Confirmed">Confirmed</option>
          </select>
        </label>
      </div>

      <div className="line-items">
        <div className="panel-header compact-header">
          <div>
            <p className="eyebrow">Products</p>
            <h2>Line items</h2>
          </div>
          <Button type="button" variant="secondary" onClick={addLine}>
            Add line
          </Button>
        </div>

        {items.map((item, index) => {
          const selectedProduct = productMap.get(item.productId);
          const lineTotal =
            productPrice(selectedProduct || ({} as Product)) *
            Number(item.quantity || 0);

          return (
            <div className="line-item-row" key={`${index}-${item.productId}`}>
              <label>
                Product
                <select
                  value={item.productId}
                  onChange={(event) =>
                    updateItem(index, "productId", event.target.value)
                  }
                  required
                >
                  <option value="">Select product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.sku}) - Stock {productStock(product)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Quantity
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(event) =>
                    updateItem(index, "quantity", event.target.value)
                  }
                  required
                />
              </label>
              <div className="line-total">
                <span>Line total</span>
                <strong>{formatCurrency(lineTotal)}</strong>
              </div>
              {items.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => removeLine(index)}
                >
                  Remove
                </Button>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="total-strip">
        <span>Total amount</span>
        <strong>{formatCurrency(totalAmount)}</strong>
      </div>

      <div className="form-actions">
        <Button disabled={saving}>{saving ? "Saving..." : "Save challan"}</Button>
      </div>
    </form>
  );
}

export default OrderCreate;
