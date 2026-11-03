import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Tags,
  CheckCircle2,
  Eye,
  EyeOff,
  Wrench,
  Zap,
  Sparkles,
  Wind,
  Paintbrush,
  Hammer,
  Sofa,
  Flower2,
} from "lucide-react";

import Sidebar from "../../components/Sidebar";
import { apiRequest } from "../../services/api";
import "../../styles/AdminDashboard.css";

const iconOptions = [
  { value: "Wrench", label: "Plumbing / Tools" },
  { value: "Zap", label: "Electrical" },
  { value: "Sparkles", label: "Cleaning" },
  { value: "Wind", label: "AC Repair" },
  { value: "Paintbrush", label: "Painting" },
  { value: "Hammer", label: "Carpentry" },
  { value: "Sofa", label: "Home Moving" },
  { value: "Flower2", label: "Gardening" },
  { value: "Tags", label: "General Services" },
];

const getCategoryIcon = (iconName) => {
  const iconProps = { size: 24, strokeWidth: 1.8 };

  switch (iconName) {
    case "Wrench":
      return <Wrench {...iconProps} />;
    case "Zap":
      return <Zap {...iconProps} />;
    case "Sparkles":
      return <Sparkles {...iconProps} />;
    case "Wind":
      return <Wind {...iconProps} />;
    case "Paintbrush":
      return <Paintbrush {...iconProps} />;
    case "Hammer":
      return <Hammer {...iconProps} />;
    case "Sofa":
      return <Sofa {...iconProps} />;
    case "Flower2":
      return <Flower2 {...iconProps} />;
    default:
      return <Tags {...iconProps} />;
  }
};

const emptyForm = {
  name: "",
  description: "",
  icon: "Tags",
  status: "Active",
};

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  // Fetch categories from the backend.
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setActionError("");

      const response = await apiRequest("/admin/categories");

      setCategories(response.categories || []);
    } catch (error) {
      setActionError(error.message || "Unable to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const stats = useMemo(
    () => ({
      total: categories.length,
      active: categories.filter((category) => category.status === "Active")
        .length,
      inactive: categories.filter((category) => category.status === "Inactive")
        .length,
      services: categories.reduce(
        (total, category) => total + Number(category.services || 0),
        0,
      ),
    }),
    [categories],
  );

  const filteredCategories = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return categories.filter((category) => {
      const matchesSearch =
        !query ||
        category.name.toLowerCase().includes(query) ||
        (category.description || "").toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || category.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [categories, searchTerm, statusFilter]);

  const openAddModal = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingId(category.id);

    setFormData({
      name: category.name,
      description: category.description || "",
      icon: category.icon || "Tags",
      status: category.status,
    });

    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingId(null);
    setFormData(emptyForm);
    setFormError("");
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setFormError("");
  };

  // Add or update a category.
  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = formData.name.trim();
    const description = formData.description.trim();

    if (!name) {
      setFormError("Please enter a category name.");
      return;
    }

    const duplicate = categories.some(
      (category) =>
        category.name.toLowerCase() === name.toLowerCase() &&
        category.id !== editingId,
    );

    if (duplicate) {
      setFormError("A category with this name already exists.");
      return;
    }

    const payload = {
      name,
      description,
      icon: formData.icon,
      status: formData.status,
    };

    try {
      setSaving(true);
      setFormError("");

      if (editingId) {
        await apiRequest(`/admin/categories/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest("/admin/categories", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setModalOpen(false);
      setEditingId(null);
      setFormData(emptyForm);

      await fetchCategories();
    } catch (error) {
      setFormError(error.message || "Unable to save category.");
    } finally {
      setSaving(false);
    }
  };

  // Activate or deactivate a category.
  const toggleStatus = async (category) => {
    try {
      setActionError("");

      await apiRequest(`/admin/categories/${category.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          isActive: category.status !== "Active",
        }),
      });

      await fetchCategories();
    } catch (error) {
      setActionError(error.message || "Unable to update category status.");
    }
  };

  // Delete a category.
  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setActionError("");

      await apiRequest(`/admin/categories/${deleteTarget.id}`, {
        method: "DELETE",
      });

      setDeleteTarget(null);
      await fetchCategories();
    } catch (error) {
      setActionError(error.message || "Unable to delete category.");
    }
  };

  return (
    <div className="admin-categories-layout">
      <Sidebar role="admin" activeItem="/admin-categories" />

      <main className="admin-categories-main">
        <header className="admin-categories-header">
          <div className="admin-categories-header-copy">
            <h1>Category Management</h1>
            <p>Organize and manage the services available on ServiceHub.</p>
          </div>

          <button
            type="button"
            className="admin-categories-add-button"
            onClick={openAddModal}
          >
            <Plus size={18} />
            Add Category
          </button>
        </header>

        <div className="admin-categories-content">
          <section className="admin-categories-stats">
            <article className="admin-categories-stat-card">
              <div className="admin-categories-stat-top">
                <span className="admin-categories-stat-icon categories-blue">
                  <Tags size={21} />
                </span>
                <span className="admin-categories-stat-caption">All types</span>
              </div>
              <p>Total Categories</p>
              <h2>{stats.total}</h2>
              <span className="admin-categories-stat-note">
                Categories in your catalog
              </span>
            </article>

            <article className="admin-categories-stat-card">
              <div className="admin-categories-stat-top">
                <span className="admin-categories-stat-icon categories-green">
                  <CheckCircle2 size={21} />
                </span>
                <span className="admin-categories-stat-caption">Available</span>
              </div>
              <p>Active Categories</p>
              <h2>{stats.active}</h2>
              <span className="admin-categories-stat-note">
                Available for customers
              </span>
            </article>

            <article className="admin-categories-stat-card">
              <div className="admin-categories-stat-top">
                <span className="admin-categories-stat-icon categories-orange">
                  <EyeOff size={21} />
                </span>
                <span className="admin-categories-stat-caption">Hidden</span>
              </div>
              <p>Inactive Categories</p>
              <h2>{stats.inactive}</h2>
              <span className="admin-categories-stat-note">
                Not currently available
              </span>
            </article>

            <article className="admin-categories-stat-card">
              <div className="admin-categories-stat-top">
                <span className="admin-categories-stat-icon categories-purple">
                  <Wrench size={21} />
                </span>
                <span className="admin-categories-stat-caption">Catalog</span>
              </div>
              <p>Listed Services</p>
              <h2>{stats.services}</h2>
              <span className="admin-categories-stat-note">
                Services across categories
              </span>
            </article>
          </section>

          {actionError && (
            <p className="admin-categories-form-error">{actionError}</p>
          )}

          <section className="admin-categories-list-card">
            <div className="admin-categories-section-heading">
              <div>
                <h2>All Categories</h2>
                <p>Manage category names, descriptions, and availability.</p>
              </div>

              <span className="admin-categories-count">
                {filteredCategories.length} categories
              </span>
            </div>

            <div className="admin-categories-toolbar">
              <div className="admin-categories-search">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  aria-label="Search categories"
                />

                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter categories by status"
              >
                <option value="All">All statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {loading ? (
              <div className="admin-categories-empty">
                <p>Loading categories...</p>
              </div>
            ) : (
              <>
                <div className="admin-categories-grid">
                  {filteredCategories.map((category) => (
                    <article className="admin-category-card" key={category.id}>
                      <div className="admin-category-card-top">
                        <span className="admin-category-icon">
                          {getCategoryIcon(category.icon)}
                        </span>

                        <span
                          className={`admin-category-status ${
                            category.status === "Active"
                              ? "category-status-active"
                              : "category-status-inactive"
                          }`}
                        >
                          <span />
                          {category.status}
                        </span>
                      </div>

                      <h3>{category.name}</h3>

                      <p className="admin-category-description">
                        {category.description || "No description provided."}
                      </p>

                      <div className="admin-category-services">
                        <span>Listed services</span>
                        <strong>{category.services}</strong>
                      </div>

                      <div className="admin-category-card-actions">
                        <button
                          type="button"
                          className="admin-category-edit-button"
                          onClick={() => openEditModal(category)}
                        >
                          <Pencil size={14} />
                          Edit
                        </button>

                        <button
                          type="button"
                          className="admin-category-toggle-button"
                          onClick={() => toggleStatus(category)}
                          title={
                            category.status === "Active"
                              ? "Deactivate category"
                              : "Activate category"
                          }
                        >
                          {category.status === "Active" ? (
                            <EyeOff size={15} />
                          ) : (
                            <Eye size={15} />
                          )}

                          {category.status === "Active"
                            ? "Deactivate"
                            : "Activate"}
                        </button>

                        <button
                          type="button"
                          className="admin-category-delete-button"
                          onClick={() => setDeleteTarget(category)}
                          aria-label={`Delete ${category.name}`}
                          title="Delete category"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                {filteredCategories.length === 0 && (
                  <div className="admin-categories-empty">
                    <Tags size={30} />
                    <h3>No categories found</h3>
                    <p>Try a different search or status filter.</p>

                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("All");
                      }}
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </>
            )}

            <div className="admin-categories-list-footer">
              <span>
                Showing {filteredCategories.length} of {categories.length}{" "}
                categories
              </span>
            </div>
          </section>
        </div>
      </main>

      {modalOpen && (
        <div className="admin-categories-modal-overlay" onClick={closeModal}>
          <section
            className="admin-categories-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-categories-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-categories-modal-heading">
              <div>
                <p>CATEGORY SETTINGS</p>
                <h2 id="admin-categories-modal-title">
                  {editingId ? "Edit Category" : "Add New Category"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                aria-label="Close category form"
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            <form className="admin-categories-form" onSubmit={handleSubmit}>
              <label htmlFor="admin-category-name">Category name *</label>
              <input
                id="admin-category-name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="e.g. Plumbing"
                maxLength={60}
                required
              />

              <label htmlFor="admin-category-description">Description</label>
              <textarea
                id="admin-category-description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Briefly describe the services in this category"
                rows={3}
                maxLength={250}
              />

              <label htmlFor="admin-category-icon">Category icon</label>
              <select
                id="admin-category-icon"
                name="icon"
                value={formData.icon}
                onChange={handleFormChange}
              >
                {iconOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <div className="admin-categories-icon-preview">
                <span>{getCategoryIcon(formData.icon)}</span>
                <div>
                  <strong>{formData.name.trim() || "Category preview"}</strong>
                  <p>
                    {formData.description.trim() ||
                      "Your category description will appear here."}
                  </p>
                </div>
              </div>

              <label htmlFor="admin-category-status">Status</label>
              <select
                id="admin-category-status"
                name="status"
                value={formData.status}
                onChange={handleFormChange}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              {formError && (
                <p className="admin-categories-form-error">{formError}</p>
              )}

              <div className="admin-categories-form-actions">
                <button
                  type="button"
                  className="admin-categories-cancel-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-categories-save-button"
                  disabled={saving}
                >
                  <Plus size={16} />
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Add Category"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div
          className="admin-categories-modal-overlay"
          onClick={() => setDeleteTarget(null)}
        >
          <section
            className="admin-categories-delete-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="admin-categories-delete-title"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="admin-categories-delete-icon">
              <Trash2 size={23} />
            </span>

            <h2 id="admin-categories-delete-title">Delete category?</h2>

            <p>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget.name}</strong>? This action cannot be
              undone.
            </p>

            <div className="admin-categories-form-actions">
              <button
                type="button"
                className="admin-categories-cancel-button"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-categories-confirm-delete"
                onClick={confirmDelete}
              >
                <Trash2 size={15} />
                Delete Category
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default AdminCategories;
