import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  UserRound,
  LockKeyhole,
  Mail,
  MessageSquare,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  CheckCircle2,
  Settings,
} from "lucide-react";

import Sidebar from "../../components/Sidebar";
import { apiRequest } from "../../services/api";
import "../../styles/ProviderDashboard.css";

const defaultSettings = {
  fullName: "",
  email: "",
  phone: "",
  language: "English",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const ProviderSettings = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState(defaultSettings);
  const [savedSettings, setSavedSettings] = useState(defaultSettings);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  // Fetch provider profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiRequest("/users/me");

        if (response.user.role !== "provider") {
          throw new Error("This page is only available to service providers.");
        }

        const profile = {
          fullName: response.user.name || "",
          email: response.user.email || "",
          phone: response.user.phone || "",
          language: "English",
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        };

        setSettings(profile);
        setSavedSettings(profile);
      } catch (error) {
        setIsError(true);
        setMessage(error.message || "Unable to load your settings.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const updateSetting = (field, value) => {
    setSettings((previous) => ({
      ...previous,
      [field]: value,
    }));

    setMessage("");
    setIsError(false);
  };

  // Save general account details or change password
  const handleSave = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setIsError(false);

      if (activeTab === "general") {
        if (!settings.fullName.trim()) {
          throw new Error("Please enter your full name.");
        }

        if (!settings.email.trim()) {
          throw new Error("Please enter your email address.");
        }

        const response = await apiRequest("/users/me", {
          method: "PUT",
          body: JSON.stringify({
            name: settings.fullName.trim(),
            email: settings.email.trim(),
            phone: settings.phone.trim(),
          }),
        });

        const updatedSettings = {
          ...settings,
          fullName: response.user.name || "",
          email: response.user.email || "",
          phone: response.user.phone || "",
        };

        setSettings(updatedSettings);
        setSavedSettings(updatedSettings);

        setMessage(response.message || "Profile updated successfully.");
      }

      if (activeTab === "security") {
        if (
          !settings.currentPassword ||
          !settings.newPassword ||
          !settings.confirmPassword
        ) {
          throw new Error("Please fill in all password fields.");
        }

        if (settings.newPassword.length < 8) {
          throw new Error(
            "Your new password must contain at least 8 characters.",
          );
        }

        if (settings.currentPassword === settings.newPassword) {
          throw new Error(
            "Your new password must be different from your current password.",
          );
        }

        if (settings.newPassword !== settings.confirmPassword) {
          throw new Error("New password and confirm password do not match.");
        }

        const response = await apiRequest("/users/change-password", {
          method: "PUT",
          body: JSON.stringify({
            currentPassword: settings.currentPassword,
            newPassword: settings.newPassword,
          }),
        });

        setSettings((previous) => ({
          ...previous,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));

        setShowPassword(false);

        setMessage(response.message || "Password changed successfully.");
      }
    } catch (error) {
      setIsError(true);
      setMessage(error.message || "Unable to save your settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (activeTab === "general") {
      setSettings((previous) => ({
        ...previous,
        fullName: savedSettings.fullName,
        email: savedSettings.email,
        phone: savedSettings.phone,
        language: savedSettings.language,
      }));
    } else {
      setSettings((previous) => ({
        ...previous,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      setShowPassword(false);
    }

    setMessage("");
    setIsError(false);
  };

  const tabs = [
    {
      id: "general",
      label: "General",
      description: "Account preferences",
      icon: Settings,
    },
    {
      id: "security",
      label: "Security",
      description: "Password and protection",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="provider-settings-layout">
      <Sidebar
        role="provider"
        activeItem="/provider-settings"
        onLogout={() => navigate("/login")}
      />

      <main className="provider-settings-main">
        <header className="provider-settings-header">
          <div>
            <h1>Settings</h1>
            <p>Manage your account preferences and security.</p>
          </div>
        </header>

        <section className="provider-settings-content">
          <div className="provider-settings-intro">
            <div className="provider-settings-intro-icon">
              <Settings size={24} />
            </div>

            <div>
              <h2>Account Settings</h2>
              <p>Customize your ServiceHub experience.</p>
            </div>
          </div>

          <div className="provider-settings-grid">
            <aside className="provider-settings-tabs">
              <h3>Preferences</h3>

              {tabs.map((tab) => {
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`provider-settings-tab ${
                      activeTab === tab.id ? "active" : ""
                    }`}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMessage("");
                      setIsError(false);
                    }}
                  >
                    <span className="provider-settings-tab-icon">
                      <Icon size={19} />
                    </span>

                    <span className="provider-settings-tab-text">
                      <strong>{tab.label}</strong>
                      <small>{tab.description}</small>
                    </span>
                  </button>
                );
              })}

              <div className="provider-settings-help">
                <ShieldCheck size={22} />
                <strong>Your account, your control</strong>
                <p>
                  Review your preferences regularly to keep your account secure.
                </p>
              </div>
            </aside>

            <section className="provider-settings-panel">
              {loading ? (
                <p>Loading your settings...</p>
              ) : (
                <form onSubmit={handleSave}>
                  {activeTab === "general" && (
                    <>
                      <div className="provider-settings-panel-heading">
                        <div className="provider-settings-panel-icon">
                          <UserRound size={20} />
                        </div>

                        <div>
                          <h2>General Preferences</h2>
                          <p>Manage your basic account preferences.</p>
                        </div>
                      </div>

                      <div className="provider-settings-divider" />

                      <div className="provider-settings-fields">
                        <div className="provider-settings-field">
                          <label htmlFor="settings-name">Full Name</label>
                          <div className="provider-settings-input-wrap">
                            <UserRound size={17} />
                            <input
                              id="settings-name"
                              type="text"
                              value={settings.fullName}
                              onChange={(event) =>
                                updateSetting("fullName", event.target.value)
                              }
                              required
                            />
                          </div>
                        </div>

                        <div className="provider-settings-field">
                          <label htmlFor="settings-email">Email Address</label>
                          <div className="provider-settings-input-wrap">
                            <Mail size={17} />
                            <input
                              id="settings-email"
                              type="email"
                              value={settings.email}
                              onChange={(event) =>
                                updateSetting("email", event.target.value)
                              }
                              required
                            />
                          </div>
                        </div>

                        <div className="provider-settings-field">
                          <label htmlFor="settings-phone">Phone Number</label>
                          <div className="provider-settings-input-wrap">
                            <MessageSquare size={17} />
                            <input
                              id="settings-phone"
                              type="tel"
                              value={settings.phone}
                              onChange={(event) =>
                                updateSetting("phone", event.target.value)
                              }
                            />
                          </div>
                        </div>

                        <div className="provider-settings-field">
                          <label htmlFor="settings-language">Language</label>
                          <select
                            id="settings-language"
                            value={settings.language}
                            onChange={(event) =>
                              updateSetting("language", event.target.value)
                            }
                          >
                            <option value="English">English</option>
                            <option value="Hindi">Hindi</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === "security" && (
                    <>
                      <div className="provider-settings-panel-heading">
                        <div className="provider-settings-panel-icon">
                          <ShieldCheck size={20} />
                        </div>

                        <div>
                          <h2>Security Settings</h2>
                          <p>
                            Keep your account and personal information safe.
                          </p>
                        </div>
                      </div>

                      <div className="provider-settings-divider" />

                      <div className="provider-settings-security-note">
                        <ShieldCheck size={20} />
                        <div>
                          <strong>Protect your account</strong>
                        </div>
                      </div>

                      <div className="provider-settings-fields security-fields">
                        <div className="provider-settings-field full-width">
                          <label htmlFor="current-password">
                            Current Password
                          </label>
                          <div className="provider-settings-input-wrap">
                            <LockKeyhole size={17} />
                            <input
                              id="current-password"
                              type={showPassword ? "text" : "password"}
                              autoComplete="current-password"
                              value={settings.currentPassword}
                              onChange={(event) =>
                                updateSetting(
                                  "currentPassword",
                                  event.target.value,
                                )
                              }
                              placeholder="Enter current password"
                            />
                            <button
                              type="button"
                              className="provider-password-toggle"
                              aria-label={
                                showPassword ? "Hide password" : "Show password"
                              }
                              onClick={() =>
                                setShowPassword((previous) => !previous)
                              }
                            >
                              {showPassword ? (
                                <EyeOff size={17} />
                              ) : (
                                <Eye size={17} />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="provider-settings-field full-width">
                          <label htmlFor="new-password">New Password</label>
                          <input
                            id="new-password"
                            type="password"
                            autoComplete="new-password"
                            value={settings.newPassword}
                            onChange={(event) =>
                              updateSetting("newPassword", event.target.value)
                            }
                            placeholder="Enter new password"
                            minLength={8}
                          />
                        </div>

                        <div className="provider-settings-field full-width">
                          <label htmlFor="confirm-password">
                            Confirm New Password
                          </label>
                          <input
                            id="confirm-password"
                            type="password"
                            autoComplete="new-password"
                            value={settings.confirmPassword}
                            onChange={(event) =>
                              updateSetting(
                                "confirmPassword",
                                event.target.value,
                              )
                            }
                            placeholder="Re-enter new password"
                            minLength={8}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {message && (
                    <div
                      className={
                        isError
                          ? "settings-message settings-message-error"
                          : "provider-settings-success"
                      }
                      role={isError ? "alert" : "status"}
                    >
                      {!isError && <CheckCircle2 size={18} />}
                      {message}
                    </div>
                  )}

                  <div className="provider-settings-actions">
                    <button
                      type="button"
                      className="provider-settings-reset-btn"
                      onClick={handleReset}
                      disabled={saving}
                    >
                      <RotateCcw size={16} />
                      Reset
                    </button>

                    <button
                      type="submit"
                      className="provider-settings-save-btn"
                      disabled={saving}
                    >
                      <Save size={17} />
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}
            </section>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ProviderSettings;
