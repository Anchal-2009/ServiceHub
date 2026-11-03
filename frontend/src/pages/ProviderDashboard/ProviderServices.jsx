import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  BriefcaseBusiness,
  Pencil,
  Trash2,
  Power,
  X,
  IndianRupee,
  CheckCircle2,
  ImagePlus,
  Upload,
} from "lucide-react";

import Sidebar from "../../components/Sidebar";
import { apiRequest } from "../../services/api";
import "../../styles/UserDashboard.css";

const emptyForm = {
  name: "",
  category: "Select Category",
  description: "",
  price: "",
  location: "",
  image: "",
};

function ProviderServices() {
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const token = localStorage.getItem("token");

  // Release temporary preview URLs when they are replaced or removed.
  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Fetch services belonging to the logged-in provider.
  const fetchServices = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/services/mine", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setServices(data.services || []);
    } catch (error) {
      setError(error.message || "Unable to load your services.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);

      const data = await apiRequest("/services/categories");

      setCategories(data.categories || []);
    } catch (error) {
      setError(error.message || "Unable to load service categories.");
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, []);

  // Calculate service statistics.
  const counts = useMemo(
    () => ({
      total: services.length,
      active: services.filter((s) => s.isActive).length,
      inactive: services.filter((s) => !s.isActive).length,
    }),
    [services],
  );

  // Search and filter services.
  const visibleServices = useMemo(() => {
    const term = search.trim().toLowerCase();

    return services.filter((service) => {
      const matchesSearch =
        `${service.title} ${service.category} ${service.description}`
          .toLowerCase()
          .includes(term);

      const status = service.isActive ? "Active" : "Inactive";

      const matchesFilter = filter === "All" || status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [services, search, filter]);

  // Reset image selection.
  const resetImage = () => {
    setSelectedFile(null);
    setImagePreview("");
  };

  // Open add service modal.
  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    resetImage();
    setError("");
    setModalOpen(true);
  };

  // Open edit service modal.
  const openEditModal = (service) => {
    setEditingId(service._id);

    setForm({
      name: service.title,
      category: service.category,
      description: service.description,
      price: String(service.price),
      location: service.location,
      image: service.image || "",
    });

    setSelectedFile(null);
    setImagePreview(service.image || "");
    setError("");
    setModalOpen(true);
  };

  // Close modal.
  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    resetImage();
    setError("");
  };

  // Handle image selection.
  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, PNG and WEBP images are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must not exceed 5 MB.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // Upload image to Cloudinary through the backend.
  const uploadImage = async () => {
    if (!selectedFile) {
      return form.image;
    }

    const imageFormData = new FormData();
    imageFormData.append("image", selectedFile);

    const data = await apiRequest("/services/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: imageFormData,
    });

    return data.image;
  };

  // Add or update service.
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const price = Number(form.price);

    if (
      !form.name.trim() ||
      !form.description.trim() ||
      !form.location.trim()
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setError("Enter a valid price greater than zero.");
      return;
    }

    try {
      setSaving(true);

      // Upload a newly selected image first.
      const imageUrl = await uploadImage();

      const serviceData = {
        title: form.name.trim(),
        category: form.category,
        description: form.description.trim(),
        price,
        location: form.location.trim(),
        image: imageUrl || "",
      };

      if (editingId) {
        const data = await apiRequest(`/services/${editingId}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(serviceData),
        });

        setServices((current) =>
          current.map((service) =>
            service._id === editingId ? data.service : service,
          ),
        );

        setNotice("Service details updated successfully.");
      } else {
        const data = await apiRequest("/services", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(serviceData),
        });

        setServices((current) => [data.service, ...current]);

        setNotice("New service added successfully.");
      }

      setModalOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      resetImage();
    } catch (error) {
      setError(error.message || "Unable to save service.");
    } finally {
      setSaving(false);
    }
  };

  // Activate or deactivate a service.
  const toggleStatus = async (service) => {
    try {
      const newStatus = !service.isActive;

      const data = await apiRequest(`/services/${service._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isActive: newStatus,
        }),
      });

      setServices((current) =>
        current.map((item) => (item._id === service._id ? data.service : item)),
      );

      setNotice(
        newStatus
          ? "Service activated successfully."
          : "Service deactivated successfully.",
      );
    } catch (error) {
      setNotice(error.message || "Unable to update service status.");
    }
  };

  // Delete service.
  const confirmDelete = async () => {
    try {
      await apiRequest(`/services/${deleteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setServices((current) =>
        current.filter((service) => service._id !== deleteId),
      );

      setDeleteId(null);
      setNotice("Service deleted successfully.");
    } catch (error) {
      setNotice(error.message || "Unable to delete service.");
      setDeleteId(null);
    }
  };

  return (
    <div className="provider-services-layout">
      <Sidebar
        role="provider"
        activeItem="/provider-services"
        onLogout={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        }}
      />

      <main className="provider-services-main">
        <div className="provider-services-content">
          <div className="provider-services-heading">
            <div>
              <h1>Manage Services</h1>
              <p>Manage the services you offer to customers.</p>
            </div>

            <button
              type="button"
              className="provider-services-add-button"
              onClick={openAddModal}
            >
              <Plus size={17} />
              Add New Service
            </button>
          </div>

          {notice && (
            <div className="provider-services-notice" role="status">
              <CheckCircle2 size={17} />
              <span>{notice}</span>
              <button
                type="button"
                onClick={() => setNotice("")}
                aria-label="Dismiss notification"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {error && !modalOpen && (
            <p className="provider-services-form-error" role="alert">
              {error}
              <button type="button" onClick={fetchServices}>
                Retry
              </button>
            </p>
          )}

          <section className="provider-services-stats">
            <article className="provider-services-stat">
              <span className="provider-services-stat-icon blue">
                <BriefcaseBusiness size={21} />
              </span>
              <div>
                <span>Total Services</span>
                <strong>{counts.total}</strong>
              </div>
            </article>

            <article className="provider-services-stat">
              <span className="provider-services-stat-icon green">
                <CheckCircle2 size={21} />
              </span>
              <div>
                <span>Active Services</span>
                <strong>{counts.active}</strong>
              </div>
            </article>

            <article className="provider-services-stat">
              <span className="provider-services-stat-icon orange">
                <Power size={21} />
              </span>
              <div>
                <span>Inactive Services</span>
                <strong>{counts.inactive}</strong>
              </div>
            </article>
          </section>

          <section className="provider-services-panel">
            <div className="provider-services-panel-heading">
              <div>
                <h2>Your Services</h2>
                <p>Update your offerings, prices and availability.</p>
              </div>

              <span className="provider-services-result-count">
                {visibleServices.length} services
              </span>
            </div>

            <div className="provider-services-toolbar">
              <div className="provider-services-filter-tabs">
                {["All", "Active", "Inactive"].map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => setFilter(item)}
                    className={filter === item ? "selected" : ""}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <label className="provider-services-inline-search">
                <Search size={15} />
                <input
                  type="search"
                  placeholder="Find a service"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
            </div>

            {loading ? (
              <div className="provider-services-empty">
                <p>Loading your services...</p>
              </div>
            ) : visibleServices.length === 0 ? (
              <div className="provider-services-empty">
                <BriefcaseBusiness size={34} />
                <h3>No services found</h3>
                <p>Try another search or add a new service.</p>
                <button type="button" onClick={openAddModal}>
                  <Plus size={16} /> Add a service
                </button>
              </div>
            ) : (
              <div className="provider-services-list">
                {visibleServices.map((service) => (
                  <article className="provider-service-card" key={service._id}>
                    <div className="provider-service-card-icon">
                      {service.image ? (
                        <img
                          src={service.image}
                          alt={service.title}
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "inherit",
                          }}
                        />
                      ) : (
                        <BriefcaseBusiness size={23} />
                      )}
                    </div>

                    <div className="provider-service-card-details">
                      <div className="provider-service-name-row">
                        <h3>{service.title}</h3>

                        <span
                          className={`provider-service-status ${
                            service.isActive ? "active" : "inactive"
                          }`}
                        >
                          {service.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <span className="provider-service-category">
                        {service.category}
                      </span>

                      <p>{service.description}</p>

                      <div className="provider-service-meta">
                        <span>{service.location}</span>

                        <span className="provider-service-price">
                          <IndianRupee size={14} />
                          {Number(service.price).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    <div className="provider-service-actions">
                      <button
                        type="button"
                        className="provider-service-edit"
                        onClick={() => openEditModal(service)}
                      >
                        <Pencil size={15} /> Edit
                      </button>

                      <button
                        type="button"
                        className="provider-service-toggle"
                        onClick={() => toggleStatus(service)}
                      >
                        <Power size={15} />
                        {service.isActive ? "Deactivate" : "Activate"}
                      </button>

                      <button
                        type="button"
                        className="provider-service-delete"
                        onClick={() => setDeleteId(service._id)}
                        aria-label={`Delete ${service.title}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Add / Edit Service Modal */}
      {modalOpen && (
        <div
          className="provider-services-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            className="provider-services-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="provider-services-modal-title"
          >
            <div className="provider-services-modal-heading">
              <div>
                <span className="provider-services-eyebrow">
                  SERVICE DETAILS
                </span>

                <h2 id="provider-services-modal-title">
                  {editingId ? "Edit Service" : "Add New Service"}
                </h2>

                <p>Enter the details customers will see.</p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>
                Service name
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="e.g. Home Cleaning"
                  maxLength={100}
                  required
                />
              </label>

              <label>
                Category
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm({ ...form, category: event.target.value })
                  }
                  required
                  disabled={categoriesLoading || categories.length === 0}
                >
                  <option value="">
                    {categoriesLoading
                      ? "Loading categories..."
                      : categories.length === 0
                        ? "No categories available"
                        : "Select a category"}
                  </option>

                  {categories.map((category) => (
                    <option key={category._id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Description
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description: event.target.value,
                    })
                  }
                  placeholder="Describe what's included in this service..."
                  rows={3}
                  maxLength={2000}
                  required
                />
              </label>

              <label>
                Price (₹)
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.price}
                  onChange={(event) =>
                    setForm({ ...form, price: event.target.value })
                  }
                  placeholder="899"
                  required
                />
              </label>

              <label>
                Service location
                <input
                  type="text"
                  value={form.location}
                  onChange={(event) =>
                    setForm({ ...form, location: event.target.value })
                  }
                  placeholder="e.g. Delhi"
                  maxLength={150}
                  required
                />
              </label>

              {/* Cloudinary image upload */}
              <div className="provider-service-image-upload">
                <label htmlFor="service-image">Service image</label>

                <label
                  htmlFor="service-image"
                  className="provider-service-image-picker"
                >
                  <ImagePlus size={22} />

                  <span>
                    {selectedFile ? "Change selected image" : "Choose an image"}
                  </span>

                  <small>JPG, PNG or WEBP · Maximum 5 MB</small>

                  <input
                    id="service-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    disabled={saving}
                  />
                </label>

                {imagePreview && (
                  <div className="provider-service-image-preview">
                    <img src={imagePreview} alt="Service preview" />

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setImagePreview("");
                        setForm({ ...form, image: "" });

                        const input = document.getElementById("service-image");

                        if (input) input.value = "";
                      }}
                      disabled={saving}
                      aria-label="Remove service image"
                    >
                      <X size={16} />
                      Remove image
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <p className="provider-services-form-error" role="alert">
                  {error}
                </p>
              )}

              <div className="provider-services-modal-actions">
                <button
                  type="button"
                  className="provider-services-cancel"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="provider-services-save"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Upload size={15} />
                      {selectedFile ? "Uploading..." : "Saving..."}
                    </>
                  ) : editingId ? (
                    "Save Changes"
                  ) : (
                    "Add Service"
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId !== null && (
        <div
          className="provider-services-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDeleteId(null);
          }}
        >
          <section
            className="provider-services-delete-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="provider-services-delete-title"
          >
            <span className="provider-services-delete-icon">
              <Trash2 size={22} />
            </span>

            <h2 id="provider-services-delete-title">Delete this service?</h2>

            <p>This service will be permanently deleted from your account.</p>

            <div className="provider-services-modal-actions">
              <button
                type="button"
                className="provider-services-cancel"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="provider-services-confirm-delete"
                onClick={confirmDelete}
              >
                Delete Service
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default ProviderServices;
