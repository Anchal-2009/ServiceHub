import { useState } from "react";
import {
  UserRound,
  LockKeyhole,
  Globe,
  Mail,
  Phone,
  Save,
  RotateCcw,
  CheckCircle2,
  Info,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";

import Sidebar from "../../components/Sidebar";
import { apiRequest } from "../../services/api";
import "../../styles/AdminDashboard.css";

const defaultSettings = {
  platformName: "ServiceHub",
  supportEmail: "support@servicehub.com",
  contactNumber: "+91 9876543210",
};

function AdminSettings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [savedSettings, setSavedSettings] = useState(defaultSettings);

  const [activeTab, setActiveTab] = useState("general");
  const [message, setMessage] = useState("");

  // Password states
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordMessageType, setPasswordMessageType] = useState("");

  // Update general settings
  const updateSetting = (name, value) => {
    setSettings((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
  };

  const handleSave = (event) => {
    event.preventDefault();

    setSavedSettings({ ...settings });
    setMessage("Your settings have been saved successfully.");
  };

  const handleReset = () => {
    setSettings({ ...savedSettings });
    setMessage("Unsaved changes have been discarded.");
  };

  // Update password input fields
  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswordData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setPasswordMessage("");
  };

  // Show/hide password
  const togglePasswordVisibility = (name) => {
    setShowPasswords((previous) => ({
      ...previous,
      [name]: !previous[name],
    }));
  };

  // Submit password update
  const handleUpdatePassword = async (event) => {
    event.preventDefault();

    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessageType("error");
      setPasswordMessage("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessageType("error");
      setPasswordMessage("New password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessageType("error");
      setPasswordMessage("New passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordMessageType("error");
      setPasswordMessage(
        "New password must be different from current password.",
      );
      return;
    }

    try {
      setPasswordLoading(true);
      setPasswordMessage("");

      const response = await apiRequest("/auth/change-password", {
        method: "PUT",
        body: JSON.stringify(passwordData),
      });

      setPasswordMessageType("success");
      setPasswordMessage(response.message || "Password updated successfully.");

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setShowPasswords({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false,
      });
    } catch (error) {
      setPasswordMessageType("error");
      setPasswordMessage(
        error.message || "Unable to update password. Please try again.",
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  // General settings input
  const Field = ({ label, name, type = "text", placeholder, icon: Icon }) => (
    <div className="admin-setting-field">
      <label htmlFor={name}>{label}</label>

      <div className={`admin-setting-input-wrap ${Icon ? "has-icon" : ""}`}>
        {Icon && <Icon size={17} aria-hidden="true" />}

        <input
          id={name}
          type={type}
          value={settings[name]}
          onChange={(event) => updateSetting(name, event.target.value)}
          placeholder={placeholder}
        />
      </div>
    </div>
  );

  // Password input
  const PasswordField = ({ label, name, placeholder }) => (
    <div className="admin-setting-field">
      <label htmlFor={name}>{label}</label>

      <div className="admin-setting-input-wrap has-icon admin-password-input-wrap">
        <LockKeyhole size={17} aria-hidden="true" />

        <input
          id={name}
          name={name}
          type={showPasswords[name] ? "text" : "password"}
          value={passwordData[name]}
          onChange={handlePasswordChange}
          placeholder={placeholder}
          autoComplete="off"
        />

        <button
          type="button"
          className="admin-password-visibility"
          onClick={() => togglePasswordVisibility(name)}
          aria-label={showPasswords[name] ? "Hide password" : "Show password"}
        >
          {showPasswords[name] ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </div>
  );

  // Settings navigation
  const tabs = [
    {
      id: "general",
      label: "Personal Information",
      icon: UserRound,
    },
    {
      id: "security",
      label: "Password & Security",
      icon: LockKeyhole,
    },
  ];

  return (
    <div className="admin-settings-layout">
      <Sidebar role="admin" activeItem="/admin-settings" />

      <main className="admin-settings-main">
        <div className="admin-settings-content">
          {/* Page Header */}
          <header className="admin-settings-header">
            <div>
              <h1>Settings</h1>
              <p>Manage your account information and security preferences.</p>
            </div>
          </header>

          {/* Settings Workspace */}
          <div className="admin-settings-workspace">
            {/* Settings Navigation */}
            <nav className="admin-settings-tabs" aria-label="Settings sections">
              <p className="admin-settings-tabs-heading">SETTINGS MENU</p>

              {tabs.map((tab) => {
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={activeTab === tab.id ? "active" : ""}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMessage("");
                      setPasswordMessage("");
                    }}
                  >
                    <Icon size={20} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Personal Information */}
            {activeTab === "general" && (
              <div className="admin-settings-panel">
                <div className="admin-settings-notice">
                  <div className="admin-settings-notice-icon">
                    <Info size={19} />
                  </div>

                  <div>
                    <strong>Personal Information</strong>
                    <p>Manage your ServiceHub platform information.</p>
                  </div>
                </div>

                {message && (
                  <div
                    className={`admin-settings-message ${
                      message.includes("successfully") ? "success" : "info"
                    }`}
                    role="status"
                  >
                    <CheckCircle2 size={18} />
                    <span>{message}</span>
                  </div>
                )}

                <form className="admin-settings-form" onSubmit={handleSave}>
                  <section className="admin-settings-section">
                    <div className="admin-settings-section-heading">
                      <div className="admin-settings-section-icon">
                        <Globe size={20} />
                      </div>

                      <div>
                        <h2>General Settings</h2>
                        <p>
                          Basic information and contact details for your
                          platform.
                        </p>
                      </div>
                    </div>

                    <div className="admin-settings-fields-grid">
                      <Field
                        label="Platform Name"
                        name="platformName"
                        placeholder="Enter platform name"
                      />

                      <Field
                        label="Support Email"
                        name="supportEmail"
                        type="email"
                        icon={Mail}
                        placeholder="support@example.com"
                      />

                      <Field
                        label="Contact Number"
                        name="contactNumber"
                        type="tel"
                        icon={Phone}
                        placeholder="Enter contact number"
                      />
                    </div>
                  </section>

                  <div className="admin-settings-form-footer">
                    <button
                      type="button"
                      className="admin-settings-reset-btn"
                      onClick={handleReset}
                    >
                      <RotateCcw size={16} />
                      Discard Changes
                    </button>

                    <button type="submit" className="admin-settings-save-btn">
                      <Save size={17} />
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Password & Security */}
            {activeTab === "security" && (
              <div className="admin-settings-panel">
                <div className="admin-settings-notice">
                  <div className="admin-settings-notice-icon">
                    <ShieldCheck size={19} />
                  </div>

                  <div>
                    <strong>Password & Security</strong>
                    <p>
                      Keep your administrator account secure by updating your
                      password regularly.
                    </p>
                  </div>
                </div>

                <section className="admin-settings-section admin-password-section">
                  <div className="admin-settings-section-heading">
                    <div className="admin-settings-section-icon">
                      <LockKeyhole size={20} />
                    </div>

                    <div>
                      <h2>Change Password</h2>
                      <p>
                        Enter your current password and choose a new password
                        for your account.
                      </p>
                    </div>
                  </div>

                  {passwordMessage && (
                    <div
                      className={`admin-settings-message ${passwordMessageType}`}
                      role={
                        passwordMessageType === "error" ? "alert" : "status"
                      }
                    >
                      {passwordMessageType === "success" ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <Info size={18} />
                      )}

                      <span>{passwordMessage}</span>
                    </div>
                  )}

                  <form onSubmit={handleUpdatePassword}>
                    <div className="admin-settings-fields-grid admin-password-fields">
                      <PasswordField
                        label="Current Password"
                        name="currentPassword"
                        placeholder="Enter current password"
                      />

                      <PasswordField
                        label="New Password"
                        name="newPassword"
                        placeholder="Enter new password"
                      />

                      <PasswordField
                        label="Confirm New Password"
                        name="confirmPassword"
                        placeholder="Confirm new password"
                      />
                    </div>

                    <div className="admin-settings-form-footer">
                      <button
                        type="submit"
                        className="admin-settings-save-btn"
                        disabled={passwordLoading}
                      >
                        <LockKeyhole size={17} />

                        {passwordLoading ? "Updating..." : "Update Password"}
                      </button>
                    </div>
                  </form>
                </section>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminSettings;
