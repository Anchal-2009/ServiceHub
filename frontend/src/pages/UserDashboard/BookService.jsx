import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  UserRound,
  Phone,
  FileText,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

import { apiRequest } from "../../services/api";
import "../../styles/UserServices.css";

function BookService() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [instructions, setInstructions] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch the selected service using its MongoDB ID
  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true);
        setFetchError("");

        const data = await apiRequest("/services");

        const services = Array.isArray(data) ? data : data.services || [];

        const selectedService = services.find((item) => item._id === id);

        if (!selectedService) {
          setFetchError("The selected service could not be found.");
          return;
        }

        setService(selectedService);
      } catch (err) {
        setFetchError(err.message || "Unable to load service details.");
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [id]);

  const today = new Date();

  const minDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const provider = service?.provider;

  const providerName = provider?.name || "Service Provider";
  const providerImage = service?.image || "";
  const providerLocation = service?.location || "Location not available";
  const category = service?.category || "Service";

  // Submit booking to backend
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (submitting) return;

    if (!customerName.trim() || !phone.trim() || !address.trim()) {
      setError("Please complete your name, phone number, and address.");
      return;
    }

    if (!/^[0-9]{10}$/.test(phone.trim())) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    if (!date || date < minDate || !time) {
      setError("Please select a valid date and time.");
      return;
    }

    try {
      setSubmitting(true);

      const data = await apiRequest("/bookings", {
        method: "POST",
        body: JSON.stringify({
          serviceId: service._id,
          date,
          time,
          customerName: customerName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          instructions: instructions.trim(),
        }),
      });

      if (!data.success || !data.booking) {
        throw new Error(data.message || "Unable to complete your booking.");
      }

      // Preserve provider name for the confirmation page.
      const booking = {
        ...data.booking,
        bookingId: data.booking._id,
        providerName,
      };

      navigate("/booking-confirmation", {
        state: { booking },
      });
    } catch (err) {
      setError(err.message || "Unable to submit booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="book-service-layout">
        <main className="book-service-main">
          <div className="profile-not-found">Loading service details...</div>
        </main>
      </div>
    );
  }

  if (fetchError || !service) {
    return (
      <div className="book-service-layout">
        <main className="book-service-main">
          <div className="profile-not-found">
            <h2>Service Not Found</h2>
            <p>{fetchError || "This service is no longer available."}</p>

            <Link to="/user-services" className="profile-primary-btn">
              Browse Services
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="book-service-layout">
      <main className="book-service-main">
        <header className="book-service-header">
          <div>
            <Link
              to={`/provider/${provider?._id}`}
              className="book-service-back-link"
            >
              <ArrowLeft size={17} />
              Back to Provider
            </Link>

            <h1>Book a Service</h1>
            <p>Choose your preferred schedule and provide your details.</p>
          </div>
        </header>

        <div className="book-service-content">
          <form className="book-service-form" onSubmit={handleSubmit}>
            {/* Selected Service */}
            <section className="book-form-section">
              <div className="book-form-section-heading">
                <span className="book-form-step">1</span>

                <div>
                  <h2>Selected Service</h2>
                  <p>Confirm which service you want to book.</p>
                </div>
              </div>

              <div className="book-form-field">
                <label>Service</label>

                <input
                  type="text"
                  value={`${service.title} — ₹${service.price}`}
                  readOnly
                />
              </div>
            </section>

            {/* Date and Time */}
            <section className="book-form-section">
              <div className="book-form-section-heading">
                <span className="book-form-step">2</span>

                <div>
                  <h2>Choose Date & Time</h2>
                  <p>When would you like the professional to visit?</p>
                </div>
              </div>

              <div className="book-form-grid">
                <div className="book-form-field">
                  <label htmlFor="bookingDate">
                    <CalendarDays size={16} />
                    Preferred Date
                  </label>

                  <input
                    id="bookingDate"
                    type="date"
                    min={minDate}
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    required
                  />
                </div>

                <div className="book-form-field">
                  <label htmlFor="bookingTime">
                    <Clock size={16} />
                    Preferred Time
                  </label>

                  <select
                    id="bookingTime"
                    value={time}
                    onChange={(event) => setTime(event.target.value)}
                    required
                  >
                    <option value="">Choose a time</option>
                    <option value="09:00">9:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">1:00 PM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="16:00">4:00 PM</option>
                    <option value="17:00">5:00 PM</option>
                    <option value="18:00">6:00 PM</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Customer Details */}
            <section className="book-form-section">
              <div className="book-form-section-heading">
                <span className="book-form-step">3</span>

                <div>
                  <h2>Your Details</h2>
                  <p>Share your contact information for the appointment.</p>
                </div>
              </div>

              <div className="book-form-field">
                <label htmlFor="customerName">
                  <UserRound size={16} />
                  Full Name
                </label>

                <input
                  id="customerName"
                  type="text"
                  placeholder="Enter your full name"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  required
                />
              </div>

              <div className="book-form-field">
                <label htmlFor="customerPhone">
                  <Phone size={16} />
                  Mobile Number
                </label>

                <input
                  id="customerPhone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  required
                />
              </div>

              <div className="book-form-field">
                <label htmlFor="customerAddress">
                  <MapPin size={16} />
                  Service Address
                </label>

                <textarea
                  id="customerAddress"
                  rows={3}
                  placeholder="House number, street, locality, city, PIN code"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  required
                />
              </div>

              <div className="book-form-field">
                <label htmlFor="instructions">
                  <FileText size={16} />
                  Additional Instructions (Optional)
                </label>

                <textarea
                  id="instructions"
                  rows={3}
                  placeholder="Describe the issue or any special requirements"
                  value={instructions}
                  onChange={(event) => setInstructions(event.target.value)}
                />
              </div>
            </section>

            {error && (
              <p className="book-service-error" role="alert">
                {error}
              </p>
            )}

            <button
              className="book-service-submit"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Submitting Booking..." : "Confirm Booking"}
              {!submitting && <CheckCircle2 size={18} />}
            </button>
          </form>

          {/* Booking Summary */}
          <aside className="book-service-summary">
            <h2>Booking Summary</h2>

            <div className="book-summary-provider">
              <div className="book-summary-photo">
                {providerImage ? (
                  <img
                    src={providerImage}
                    alt={providerName}
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <UserRound size={28} />
                )}
              </div>

              <div>
                <h3>{providerName}</h3>
                <p>{category} Professional</p>

                <span>
                  <MapPin size={14} />
                  {providerLocation}
                </span>
              </div>
            </div>

            <div className="book-summary-divider" />

            <div className="book-summary-row">
              <span>Selected Service</span>
              <strong>{service.title}</strong>
            </div>

            <div className="book-summary-row">
              <span>Date</span>
              <strong>{date || "Not selected"}</strong>
            </div>

            <div className="book-summary-row">
              <span>Time</span>
              <strong>{time || "Not selected"}</strong>
            </div>

            <div className="book-summary-divider" />

            <div className="book-summary-total">
              <span>Estimated Service Price</span>
              <strong>₹{service.price}</strong>
            </div>

            <p className="book-summary-disclaimer">
              This is an indicative price. Additional work or materials may
              affect the final amount.
            </p>

            <div className="book-summary-trust">
              <ShieldCheck size={20} />

              <div>
                <strong>Book with confidence</strong>
                <p>
                  Review the booking details before submitting your request.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default BookService;
