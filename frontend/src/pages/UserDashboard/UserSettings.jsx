import { useEffect, useState } from "react";
import {
  UserRound,
  LockKeyhole,
  ShieldCheck,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  RotateCcw,
} from "lucide-react";

import Sidebar from "../../components/Sidebar";
import { apiRequest } from "../../services/api";
import "../../styles/UserDashboard.css";

const defaultProfile = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
};

export default function UserSettings() {
  const [profile, setProfile] = useState(defaultProfile);
  const [savedProfile, setSavedProfile] = useState(defaultProfile);

  const [activeSection, setActiveSection] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Fetch the logged-in customer's profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiRequest("/users/me");

        const user = response.user;

        const fetchedProfile = {
          fullName: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          address: user.address || "",
        };

        setProfile(fetchedProfile);
        setSavedProfile(fetchedProfile);
      } catch (error) {
        setProfileError(true);
        setProfileMessage(error.message || "Unable to load your profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  function updateProfile(event) {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));

    setProfileMessage("");
    setProfileError(false);
  }

  function updatePassword(event) {
    const { name, value } = event.target;

    setPasswords((previous) => ({
      ...previous,
      [name]: value,
    }));

    setPasswordError("");
    setPasswordMessage("");
  }

  function togglePasswordVisibility(field) {
    setShowPasswords((previous) => ({
      ...previous,
      [field]: !previous[field],
    }));
  }

  // Save profile details to MongoDB
  async function handleProfileSubmit(event) {
    event.preventDefault();

    if (!profile.fullName.trim()) {
      setProfileError(true);
      setProfileMessage("Please enter your full name.");
      return;
    }

    if (!profile.email.trim()) {
      setProfileError(true);
      setProfileMessage("Please enter your email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) {
      setProfileError(true);
      setProfileMessage("Please enter a valid email address.");
      return;
    }

    try {
      setSavingProfile(true);
      setProfileMessage("");
      setProfileError(false);

      const response = await apiRequest("/users/me", {
        method: "PUT",
        body: JSON.stringify({
          name: profile.fullName.trim(),
          email: profile.email.trim(),
          phone: profile.phone.trim(),
          address: profile.address.trim(),
        }),
      });

      const updatedUser = response.user;

      const updatedProfile = {
        fullName: updatedUser.name || "",
        email: updatedUser.email || "",
        phone: updatedUser.phone || "",
        address: updatedUser.address || "",
      };

      setProfile(updatedProfile);
      setSavedProfile(updatedProfile);

      setProfileError(false);
      setProfileMessage(response.message || "Profile updated successfully.");
    } catch (error) {
      setProfileError(true);
      setProfileMessage(error.message || "Unable to update your profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  // Change password through the backend
  async function handlePasswordSubmit(event) {
    event.preventDefault();

    if (
      !passwords.currentPassword ||
      !passwords.newPassword ||
      !passwords.confirmPassword
    ) {
      setPasswordError("Please fill in all password fields.");
      return;
    }

    if (passwords.newPassword.length < 8) {
      setPasswordError("Your new password must contain at least 8 characters.");
      return;
    }

    if (passwords.currentPassword === passwords.newPassword) {
      setPasswordError(
        "Your new password must be different from your current password.",
      );
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError("The new passwords do not match.");
      return;
    }

    try {
      setSavingPassword(true);
      setPasswordError("");
      setPasswordMessage("");

      const response = await apiRequest("/users/change-password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });

      setPasswordMessage(response.message || "Password changed successfully.");

      setPasswords({
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
      setPasswordError(error.message || "Unable to change your password.");
    } finally {
      setSavingPassword(false);
    }
  }

  function resetProfile() {
    setProfile(savedProfile);
    setProfileMessage("");
    setProfileError(false);
  }

  const sections = [
    { id: "profile", label: "Personal Information", icon: UserRound },
    { id: "security", label: "Password & Security", icon: LockKeyhole },
  ];

  return (
    <div className="settings-layout">
      <Sidebar role="customer" />

      <main className="settings-main">
        <header className="settings-header">
          <div className="settings-heading">
            <div>
              <h1>Settings</h1>
              <p>Manage your account, security, and preferences.</p>
            </div>
          </div>
        </header>

        <section className="settings-intro">
          <div className="settings-intro-icon">
            <ShieldCheck size={25} />
          </div>
          <div>
            <h2>Account Settings</h2>
            <p>
              Keep your information up to date and personalize your ServiceHub
              experience.
            </p>
          </div>
        </section>

        <div className="settings-page-grid">
          <aside className="settings-navigation">
            <h3>Settings Menu</h3>

            {sections.map((section) => {
              const Icon = section.icon;

              return (
                <button
                  type="button"
                  key={section.id}
                  className={`settings-nav-item ${
                    activeSection === section.id ? "active" : ""
                  }`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <Icon size={18} />
                  <span>{section.label}</span>
                </button>
              );
            })}

            <div className="settings-security-note">
              <ShieldCheck size={19} />
              <strong>Your privacy matters</strong>
              <p>
                Keep your account details up to date and never share your
                password.
              </p>
            </div>
          </aside>

          <div className="settings-panels">
            {activeSection === "profile" && (
              <section className="settings-card">
                <div className="settings-card-heading">
                  <div className="settings-card-icon profile-card-icon">
                    <UserRound size={20} />
                  </div>
                  <div>
                    <h2>Personal Information</h2>
                    <p>Update the details associated with your account.</p>
                  </div>
                </div>

                {loading ? (
                  <p>Loading your profile...</p>
                ) : (
                  <>
                    <div className="settings-profile-preview">
                      <div className="settings-large-avatar">
                        {profile.fullName.trim().charAt(0).toUpperCase() || "A"}
                      </div>
                      <div>
                        <strong>{profile.fullName || "Your Name"}</strong>
                        <span>ServiceHub Customer</span>
                      </div>
                    </div>

                    <form onSubmit={handleProfileSubmit}>
                      <div className="settings-form-grid">
                        <div className="settings-field">
                          <label htmlFor="settings-fullName">Full Name</label>
                          <div className="settings-input-wrap">
                            <UserRound size={17} />
                            <input
                              id="settings-fullName"
                              name="fullName"
                              value={profile.fullName}
                              onChange={updateProfile}
                              placeholder="Enter your full name"
                              required
                            />
                          </div>
                        </div>

                        <div className="settings-field">
                          <label htmlFor="settings-email">Email Address</label>
                          <div className="settings-input-wrap">
                            <Mail size={17} />
                            <input
                              id="settings-email"
                              name="email"
                              type="email"
                              value={profile.email}
                              onChange={updateProfile}
                              placeholder="Enter your email"
                              required
                            />
                          </div>
                        </div>

                        <div className="settings-field">
                          <label htmlFor="settings-phone">Phone Number</label>
                          <div className="settings-input-wrap">
                            <Phone size={17} />
                            <input
                              id="settings-phone"
                              name="phone"
                              type="tel"
                              value={profile.phone}
                              onChange={updateProfile}
                              placeholder="Enter your phone number"
                            />
                          </div>
                        </div>

                        <div className="settings-field">
                          <label htmlFor="settings-address">Address</label>
                          <div className="settings-input-wrap">
                            <MapPin size={17} />
                            <input
                              id="settings-address"
                              name="address"
                              value={profile.address}
                              onChange={updateProfile}
                              placeholder="Enter your address"
                            />
                          </div>
                        </div>
                      </div>

                      {profileMessage && (
                        <p
                          className={`settings-message ${
                            profileError
                              ? "settings-message-error"
                              : "settings-message-info"
                          }`}
                          role="status"
                        >
                          {profileMessage}
                        </p>
                      )}

                      <div className="settings-form-actions">
                        <button
                          type="button"
                          className="settings-reset-btn"
                          onClick={resetProfile}
                          disabled={savingProfile}
                        >
                          <RotateCcw size={15} />
                          Reset
                        </button>

                        <button
                          type="submit"
                          className="settings-save-btn"
                          disabled={savingProfile}
                        >
                          <Save size={16} />
                          {savingProfile ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </section>
            )}

            {activeSection === "security" && (
              <section className="settings-card">
                <div className="settings-card-heading">
                  <div className="settings-card-icon security-card-icon">
                    <LockKeyhole size={20} />
                  </div>
                  <div>
                    <h2>Password & Security</h2>
                    <p>Use a strong password to protect your account.</p>
                  </div>
                </div>

                <div className="settings-security-banner">
                  <ShieldCheck size={20} />
                  <div>
                    <strong>Keep your account secure</strong>
                    <p>
                      Choose a password with at least 8 characters. Avoid
                      reusing passwords from other websites.
                    </p>
                  </div>
                </div>

                <form onSubmit={handlePasswordSubmit}>
                  {[
                    {
                      name: "currentPassword",
                      label: "Current Password",
                      placeholder: "Enter current password",
                    },
                    {
                      name: "newPassword",
                      label: "New Password",
                      placeholder: "Enter new password",
                    },
                    {
                      name: "confirmPassword",
                      label: "Confirm New Password",
                      placeholder: "Re-enter new password",
                    },
                  ].map((field) => (
                    <div
                      className="settings-field settings-password-field"
                      key={field.name}
                    >
                      <label htmlFor={`settings-${field.name}`}>
                        {field.label}
                      </label>

                      <div className="settings-input-wrap">
                        <LockKeyhole size={17} />
                        <input
                          id={`settings-${field.name}`}
                          name={field.name}
                          type={showPasswords[field.name] ? "text" : "password"}
                          value={passwords[field.name]}
                          onChange={updatePassword}
                          placeholder={field.placeholder}
                          autoComplete="new-password"
                          required
                        />
                        <button
                          type="button"
                          className="settings-password-toggle"
                          onClick={() => togglePasswordVisibility(field.name)}
                          aria-label={
                            showPasswords[field.name]
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {showPasswords[field.name] ? (
                            <EyeOff size={17} />
                          ) : (
                            <Eye size={17} />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}

                  {passwordError && (
                    <p
                      className="settings-message settings-message-error"
                      role="alert"
                    >
                      {passwordError}
                    </p>
                  )}

                  {passwordMessage && (
                    <p
                      className="settings-message settings-message-info"
                      role="status"
                    >
                      {passwordMessage}
                    </p>
                  )}

                  <div className="settings-form-actions">
                    <button
                      type="submit"
                      className="settings-save-btn"
                      disabled={savingPassword}
                    >
                      <LockKeyhole size={16} />
                      {savingPassword ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </form>
              </section>
            )}

            <div className="settings-privacy-footer">
              <CheckCircle2 size={16} />
              <span>
                Your account preferences are managed securely through
                ServiceHub.
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
