import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { StatusMessage } from "../components/StatusMessage";
import { useAuth } from "../context/useAuth";
import API, { getApiError } from "../services/api";
import type { ApiList, Product } from "../types";
import {
  formatCurrency,
  productMinimumStock,
  productPrice,
  productStock,
} from "../utils/format";

function Products() {
  const { can } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await API.get<ApiList<Product>>("/api/products", {
        params: {
          search: search || undefined,
          lowStock: lowStockOnly || undefined,
          limit: 50,
        },
      });
      setProducts(response.data.data);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, [lowStockOnly, search]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    void fetchProducts();
  };

  const deleteProduct = async (id: number) => {
    if (!window.confirm("Delete this product?")) {
      return;
    }

    setSuccess("");
    setError("");

    try {
      await API.delete(`/api/products/${id}`);
      setSuccess("Product deleted successfully");
      await fetchProducts();
    } catch (requestError) {
      setError(getApiError(requestError));
    }
  };

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Inventory</p>
            <h2>Product catalog</h2>
          </div>
          {can(["Admin", "Warehouse"]) ? (
            <Link className="btn btn-primary" to="/products/new">
              Add product
            </Link>
          ) : null}
        </div>

        {error ? <StatusMessage type="error" message={error} /> : null}
        {success ? <StatusMessage type="success" message={success} /> : null}

        <form className="toolbar" onSubmit={handleSearch}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products, SKU, category"
          />
          <label className="checkbox-control">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(event) => setLowStockOnly(event.target.checked)}
            />
            Low stock only
          </label>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        {loading ? (
          <div className="loading-panel">Loading products...</div>
        ) : products.length === 0 ? (
          <EmptyState
            title="No products found"
            message="Add stock items or adjust the search filters."
          />
        ) : (
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Minimum</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const stock = productStock(product);
                  const minimum = productMinimumStock(product);

                  return (
                    <tr key={product.id}>
                      <td>
                        <Link to={`/products/${product.id}`}>{product.name}</Link>
                        <small>{product.description || "No description"}</small>
                      </td>
                      <td>{product.sku}</td>
                      <td>{product.category || "Uncategorized"}</td>
                      <td>{formatCurrency(productPrice(product))}</td>
                      <td>
                        <Badge tone={stock <= minimum ? "danger" : "success"}>
                          {stock}
                        </Badge>
                      </td>
                      <td>{minimum}</td>
                      <td>{product.location || "Not set"}</td>
                      <td className="table-actions">
                        <Link className="btn btn-ghost" to={`/products/${product.id}`}>
                          View
                        </Link>
                        {can(["Admin", "Warehouse"]) ? (
                          <Link
                            className="btn btn-secondary"
                            to={`/products/${product.id}/edit`}
                          >
                            Edit
                          </Link>
                        ) : null}
                        {can(["Admin"]) ? (
                          <Button
                            type="button"
                            variant="danger"
                            onClick={() => void deleteProduct(product.id)}
                          >
                            Delete
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default Products;
