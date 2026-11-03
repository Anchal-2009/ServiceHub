import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Star,
  Search,
  MessageSquareText,
  TrendingUp,
  ThumbsUp,
  CalendarDays,
  Filter,
} from "lucide-react";

import Sidebar from "../../components/Sidebar";
import { apiRequest } from "../../services/api";
import "../../styles/Providerdashboard.css";

const ratingFilters = [
  "All Ratings",
  "5 Stars",
  "4 Stars",
  "3 Stars",
  "2 Stars",
  "1 Star",
];

function StarRating({ rating = 0, size = 16 }) {
  return (
    <div
      className="provider-review-stars"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          fill={star <= rating ? "currentColor" : "none"}
          strokeWidth={1.8}
          className={star <= rating ? "star-filled" : "star-empty"}
        />
      ))}
    </div>
  );
}

function formatReviewDate(dateString) {
  if (!dateString) return "Date unavailable";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ProviderReviews() {
  const navigate = useNavigate();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("All Ratings");
  const [sortOrder, setSortOrder] = useState("newest");

  const [replyReviewId, setReplyReviewId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [notice, setNotice] = useState("");

  // Fetch reviews belonging to the logged-in provider.
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        setFetchError("");

        const data = await apiRequest("/reviews/provider");

        const savedReviews = Array.isArray(data.reviews) ? data.reviews : [];

        const formattedReviews = savedReviews.map((review) => ({
          ...review,
          id: review._id,
          customer: review.customer?.name || "Customer",
          service: review.service?.title || "Service",
          bookingId: review.booking
            ? String(review.booking._id || review.booking)
            : "Not available",
          rating: Number(review.rating) || 0,
          date: review.createdAt,
          comment: review.comment || "",
          reply: "",
        }));

        setReviews(formattedReviews);
      } catch (error) {
        setFetchError(error.message || "Unable to load customer reviews.");
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  // Calculate average rating.
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;

    return (
      reviews.reduce((total, review) => total + review.rating, 0) /
      reviews.length
    );
  }, [reviews]);

  // Calculate rating breakdown.
  const ratingCounts = useMemo(() => {
    return [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: reviews.filter((review) => review.rating === rating).length,
    }));
  }, [reviews]);

  // Calculate positive feedback percentage.
  const positivePercentage = reviews.length
    ? Math.round(
        (reviews.filter((review) => review.rating >= 4).length /
          reviews.length) *
          100,
      )
    : 0;

  // Search, filter, and sort reviews.
  const filteredReviews = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    let result = reviews.filter((review) => {
      const matchesSearch =
        !term ||
        review.customer.toLowerCase().includes(term) ||
        review.service.toLowerCase().includes(term) ||
        review.bookingId.toLowerCase().includes(term) ||
        review.comment.toLowerCase().includes(term);

      const selectedRating = ratingFilter.match(/^(\d)/);

      const matchesRating =
        ratingFilter === "All Ratings" ||
        (selectedRating && review.rating === Number(selectedRating[1]));

      return matchesSearch && matchesRating;
    });

    result = [...result].sort((a, b) => {
      if (sortOrder === "oldest") {
        return new Date(a.date) - new Date(b.date);
      }

      if (sortOrder === "highest") {
        return b.rating - a.rating || new Date(b.date) - new Date(a.date);
      }

      if (sortOrder === "lowest") {
        return a.rating - b.rating || new Date(b.date) - new Date(a.date);
      }

      return new Date(b.date) - new Date(a.date);
    });

    return result;
  }, [reviews, searchTerm, ratingFilter, sortOrder]);

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  }

  // Temporary reply functionality.
  // Replies are not saved in the database yet.
  function submitReply(reviewId) {
    const cleanReply = replyText.trim();

    if (!cleanReply) {
      showNotice("Please enter a reply before submitting.");
      return;
    }

    setReviews((current) =>
      current.map((review) =>
        review.id === reviewId ? { ...review, reply: cleanReply } : review,
      ),
    );

    setReplyReviewId(null);
    setReplyText("");

    showNotice("Your response has been added temporarily.");
  }

  return (
    <div className="provider-reviews-layout">
      <Sidebar
        role="provider"
        activeItem="/provider-reviews"
        onLogout={() => navigate("/login")}
      />

      <main className="provider-reviews-main">
        <header className="provider-reviews-header">
          <div>
            <h1>Customer Reviews</h1>
            <p className="provider-reviews-subtitle">
              See what customers say and learn how to improve your services.
            </p>
          </div>

          <div className="provider-reviews-date">
            <CalendarDays size={18} />
            {new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </div>
        </header>

        {notice && (
          <div className="provider-reviews-notice" role="status">
            <MessageSquareText size={18} />
            {notice}
          </div>
        )}

        <section className="provider-review-overview">
          <div className="provider-review-average-card">
            <p className="review-card-label">Overall Rating</p>

            <div className="provider-review-average">
              <strong>{averageRating.toFixed(1)}</strong>
              <span>/ 5.0</span>
            </div>

            <StarRating rating={Math.round(averageRating)} size={21} />

            <p className="provider-review-total">
              Based on {reviews.length} customer reviews
            </p>
          </div>

          <div className="provider-review-breakdown-card">
            <h2>Rating Breakdown</h2>

            {ratingCounts.map(({ rating, count }) => (
              <div className="provider-rating-row" key={rating}>
                <span className="provider-rating-label">{rating} stars</span>

                <div className="provider-rating-track">
                  <div
                    className="provider-rating-fill"
                    style={{
                      width: `${
                        reviews.length ? (count / reviews.length) * 100 : 0
                      }%`,
                    }}
                  />
                </div>

                <span className="provider-rating-count">{count}</span>
              </div>
            ))}
          </div>

          <div className="provider-review-highlight-card">
            <div className="provider-review-highlight-icon">
              <ThumbsUp size={23} />
            </div>

            <p className="review-card-label">Positive Feedback</p>

            <h2>{positivePercentage}%</h2>

            <p className="provider-review-highlight-description">
              Reviews with 4 or 5 stars
            </p>

            <div className="provider-review-highlight-note">
              <TrendingUp size={16} />
              Keep up the great work!
            </div>
          </div>
        </section>

        <section className="provider-reviews-list-panel">
          <div className="provider-reviews-list-heading">
            <div>
              <h2>All Reviews</h2>
              <p>Read feedback from customers who booked your services.</p>
            </div>

            <span className="provider-review-count-badge">
              {filteredReviews.length} reviews
            </span>
          </div>

          <div className="provider-reviews-controls">
            <label className="provider-reviews-search">
              <Search size={18} />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search reviews, customers, services..."
              />
            </label>

            <label className="provider-review-select-wrap">
              <Filter size={16} />

              <select
                value={ratingFilter}
                onChange={(event) => setRatingFilter(event.target.value)}
                aria-label="Filter by rating"
              >
                {ratingFilters.map((filter) => (
                  <option key={filter} value={filter}>
                    {filter}
                  </option>
                ))}
              </select>
            </label>

            <select
              className="provider-review-sort"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              aria-label="Sort reviews"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="highest">Highest rating</option>
              <option value="lowest">Lowest rating</option>
            </select>
          </div>

          <div className="provider-review-list">
            {loading ? (
              <div className="provider-reviews-empty">
                <MessageSquareText size={30} />
                <h3>Loading reviews...</h3>
              </div>
            ) : fetchError ? (
              <div className="provider-reviews-empty">
                <MessageSquareText size={30} />
                <h3>Unable to load reviews</h3>
                <p>{fetchError}</p>

                <button type="button" onClick={() => window.location.reload()}>
                  Try Again
                </button>
              </div>
            ) : (
              <>
                {filteredReviews.map((review) => (
                  <article className="provider-review-item" key={review.id}>
                    <div className="provider-review-avatar">
                      {review.customer.charAt(0).toUpperCase()}
                    </div>

                    <div className="provider-review-content">
                      <div className="provider-review-item-top">
                        <div>
                          <h3>{review.customer}</h3>
                          <p>
                            {review.service}
                            <span> · </span>
                            {review.bookingId}
                          </p>
                        </div>

                        <time dateTime={review.date}>
                          {formatReviewDate(review.date)}
                        </time>
                      </div>

                      <div className="provider-review-rating-line">
                        <StarRating rating={review.rating} />

                        <span className="provider-review-rating-number">
                          {review.rating}.0
                        </span>
                      </div>

                      <p className="provider-review-comment">
                        {review.comment}
                      </p>

                      {review.reply && (
                        <div className="provider-review-existing-reply">
                          <strong>Your response</strong>
                          <p>{review.reply}</p>
                        </div>
                      )}

                      {replyReviewId === review.id ? (
                        <div className="provider-review-reply-form">
                          <textarea
                            rows="3"
                            value={replyText}
                            onChange={(event) =>
                              setReplyText(event.target.value)
                            }
                            placeholder="Write a polite response to your customer..."
                          />

                          <div className="provider-review-reply-actions">
                            <button
                              type="button"
                              className="review-reply-cancel"
                              onClick={() => {
                                setReplyReviewId(null);
                                setReplyText("");
                              }}
                            >
                              Cancel
                            </button>

                            <button
                              type="button"
                              className="review-reply-submit"
                              onClick={() => submitReply(review.id)}
                            >
                              Post Response
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="provider-review-reply-button"
                          onClick={() => {
                            setReplyReviewId(review.id);
                            setReplyText(review.reply || "");
                          }}
                        >
                          <MessageSquareText size={15} />
                          {review.reply ? "Edit Response" : "Reply to Review"}
                        </button>
                      )}
                    </div>
                  </article>
                ))}

                {filteredReviews.length === 0 && (
                  <div className="provider-reviews-empty">
                    <MessageSquareText size={30} />

                    <h3>
                      {reviews.length === 0
                        ? "No customer reviews yet"
                        : "No reviews found"}
                    </h3>

                    <p>
                      {reviews.length === 0
                        ? "Reviews submitted by your customers will appear here."
                        : "Try changing your search or rating filter."}
                    </p>

                    {reviews.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTerm("");
                          setRatingFilter("All Ratings");
                          setSortOrder("newest");
                        }}
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
