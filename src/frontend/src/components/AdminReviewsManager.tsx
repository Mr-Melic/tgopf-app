import { useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useFileUpload, useFileUrl } from "../blob-storage/FileStorage";
import { BOOK_TITLES } from "../constants/books";
import {
  type ReviewWithExtras,
  useAddReview,
  useDeleteReview,
  useGetReviews,
  useUpdateReview,
} from "../hooks/useQueries";
import AnimatedPlaceholder from "./AnimatedPlaceholder";

// Extended Review type with optional fields
type ExtendedReview = ReviewWithExtras;

export default function AdminReviewsManager() {
  const { data: reviews, isLoading } = useGetReviews();
  const addReview = useAddReview();
  const updateReview = useUpdateReview();
  const deleteReview = useDeleteReview();
  const { uploadFile, isUploading } = useFileUpload();
  const queryClient = useQueryClient();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingReview, setEditingReview] = useState<ExtendedReview | null>(
    null,
  );
  const [formData, setFormData] = useState({
    reviewerName: "",
    companyBlogSite: "",
    bookTitle: BOOK_TITLES[0],
    poemTitle: "",
    poemSubTitle: "",
    pageNumbers: "",
    snippet: "",
    fullText: "",
    sourceLink: "",
    videoUrl: "",
    starRating: null as 1 | 2 | 3 | 4 | 5 | null,
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.reviewerName.trim() ||
      !formData.bookTitle.trim() ||
      !formData.pageNumbers.trim() ||
      !formData.snippet.trim() ||
      !formData.fullText.trim()
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.snippet.length > 200) {
      toast.error("Snippet must be 200 characters or less");
      return;
    }

    toast.loading("Adding review...", { id: "add-review" });

    try {
      let photoPath: string | undefined = undefined;

      // Upload photo if provided
      if (photoFile) {
        const timestamp = Date.now();
        const extension = photoFile.name.split(".").pop();
        photoPath = `reviews/photo_${timestamp}.${extension}`;

        await uploadFile(photoPath, photoFile, (progress) => {
          setUploadProgress(progress);
        });

        await queryClient.invalidateQueries({ queryKey: ["fileList"] });
      }

      const newReview: ReviewWithExtras = {
        id: Date.now().toString(),
        reviewerName: formData.reviewerName.trim(),
        companyBlogSite: formData.companyBlogSite.trim() || undefined,
        bookTitle: formData.bookTitle.trim(),
        poemTitle: formData.poemTitle.trim() || "",
        poemSubTitle: formData.poemSubTitle.trim(),
        pageNumbers: formData.pageNumbers.trim(),
        photoPath,
        snippet: formData.snippet.trim(),
        fullText: formData.fullText.trim(),
        sourceLink: formData.sourceLink.trim() || undefined,
        videoUrl: formData.videoUrl.trim() || undefined,
        starRating:
          formData.starRating === null
            ? undefined
            : (BigInt(formData.starRating) as bigint),
      };

      await addReview.mutateAsync(newReview);

      setShowAddForm(false);
      setFormData({
        reviewerName: "",
        companyBlogSite: "",
        bookTitle: BOOK_TITLES[0],
        poemTitle: "",
        poemSubTitle: "",
        pageNumbers: "",
        snippet: "",
        fullText: "",
        sourceLink: "",
        videoUrl: "",
        starRating: null,
      });
      setPhotoFile(null);
      setUploadProgress(0);

      toast.success("Review added successfully", { id: "add-review" });
    } catch (error) {
      console.error("Failed to add review:", error);
      toast.error("Failed to add review", { id: "add-review" });
    }
  };

  const handleUpdateReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingReview) return;

    if (
      !formData.reviewerName.trim() ||
      !formData.bookTitle.trim() ||
      !formData.pageNumbers.trim() ||
      !formData.snippet.trim() ||
      !formData.fullText.trim()
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.snippet.length > 200) {
      toast.error("Snippet must be 200 characters or less");
      return;
    }

    toast.loading("Updating review...", { id: "update-review" });

    try {
      let photoPath = editingReview.photoPath;

      // Upload new photo if provided
      if (photoFile) {
        const timestamp = Date.now();
        const extension = photoFile.name.split(".").pop();
        photoPath = `reviews/photo_${timestamp}.${extension}`;

        await uploadFile(photoPath, photoFile, (progress) => {
          setUploadProgress(progress);
        });

        await queryClient.invalidateQueries({ queryKey: ["fileList"] });
      }

      const updatedReview: ReviewWithExtras = {
        ...editingReview,
        reviewerName: formData.reviewerName.trim(),
        companyBlogSite: formData.companyBlogSite.trim() || undefined,
        bookTitle: formData.bookTitle.trim(),
        poemTitle: formData.poemTitle.trim() || "",
        poemSubTitle: formData.poemSubTitle.trim(),
        pageNumbers: formData.pageNumbers.trim(),
        photoPath,
        snippet: formData.snippet.trim(),
        fullText: formData.fullText.trim(),
        sourceLink: formData.sourceLink.trim() || undefined,
        videoUrl: formData.videoUrl.trim() || undefined,
        starRating:
          formData.starRating === null
            ? undefined
            : (BigInt(formData.starRating) as bigint),
      };

      await updateReview.mutateAsync(updatedReview);

      setEditingReview(null);
      setFormData({
        reviewerName: "",
        companyBlogSite: "",
        bookTitle: BOOK_TITLES[0],
        poemTitle: "",
        poemSubTitle: "",
        pageNumbers: "",
        snippet: "",
        fullText: "",
        sourceLink: "",
        videoUrl: "",
        starRating: null,
      });
      setPhotoFile(null);
      setUploadProgress(0);

      toast.success("Review updated successfully", { id: "update-review" });
    } catch (error) {
      console.error("Failed to update review:", error);
      toast.error("Failed to update review", { id: "update-review" });
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) {
      return;
    }

    toast.loading("Deleting review...", { id: "delete-review" });

    try {
      await deleteReview.mutateAsync(reviewId);
      toast.success("Review deleted successfully", { id: "delete-review" });
    } catch (error) {
      console.error("Failed to delete review:", error);
      toast.error("Failed to delete review", { id: "delete-review" });
    }
  };

  const handleEditClick = (
    review: ReviewWithExtras & { videoUrl?: string },
  ) => {
    setEditingReview(review);
    setFormData({
      reviewerName: review.reviewerName,
      companyBlogSite: review.companyBlogSite || "",
      bookTitle: review.bookTitle,
      poemTitle: review.poemTitle || "",
      poemSubTitle: review.poemSubTitle,
      pageNumbers: review.pageNumbers,
      snippet: review.snippet,
      fullText: review.fullText,
      sourceLink: review.sourceLink || "",
      videoUrl: review.videoUrl ?? "",
      starRating:
        review.starRating === null || review.starRating === undefined
          ? null
          : (Number(review.starRating) as 1 | 2 | 3 | 4 | 5),
    });
    setPhotoFile(null);
  };

  const handleCancelEdit = () => {
    setEditingReview(null);
    setFormData({
      reviewerName: "",
      companyBlogSite: "",
      bookTitle: BOOK_TITLES[0],
      poemTitle: "",
      poemSubTitle: "",
      pageNumbers: "",
      snippet: "",
      fullText: "",
      sourceLink: "",
      videoUrl: "",
      starRating: null,
    });
    setPhotoFile(null);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-black" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mr-4">
            <span className="text-white text-xl">⭐</span>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Reviews Management
            </h2>
            <p className="text-gray-600">
              Manage customer reviews and testimonials
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          Add New Review
        </button>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews && reviews.length > 0 ? (
          reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review as ExtendedReview}
              onEdit={() => handleEditClick(review as ExtendedReview)}
              onDelete={() => handleDeleteReview(review.id)}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Reviews Yet
            </h3>
            <p className="text-gray-500">
              Add your first review to get started
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {(showAddForm || editingReview) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingReview ? "Edit Review" : "Add New Review"}
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  handleCancelEdit();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form
              onSubmit={editingReview ? handleUpdateReview : handleAddReview}
              className="space-y-6"
            >
              <div>
                <label
                  htmlFor="reviewer-name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Reviewer Name *
                </label>
                <input
                  type="text"
                  id="reviewer-name"
                  value={formData.reviewerName}
                  onChange={(e) =>
                    setFormData({ ...formData, reviewerName: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="company-blog-site"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Company/Blog/Site (Optional)
                </label>
                <input
                  type="text"
                  id="company-blog-site"
                  value={formData.companyBlogSite}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      companyBlogSite: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Poetry Magazine, Book Review Blog, etc."
                />
              </div>

              <div>
                <label
                  htmlFor="star-rating"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Star Rating (Optional)
                </label>
                <div
                  id="star-rating"
                  role="radiogroup"
                  aria-label="Star rating"
                  className="flex items-center gap-1"
                >
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isActive =
                      formData.starRating !== null &&
                      formData.starRating >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        // biome-ignore lint/a11y/useSemanticElements: custom star-rating control preserves interactive UX
                        role="radio"
                        aria-checked={
                          formData.starRating === star ? "true" : "false"
                        }
                        aria-label={`${star} star${star > 1 ? "s" : ""}`}
                        data-ocid={`review.star_rating.${star}`}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            starRating:
                              formData.starRating === star
                                ? null
                                : (star as 1 | 2 | 3 | 4 | 5),
                          })
                        }
                        className="p-1 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1"
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            isActive
                              ? "fill-yellow-400 text-yellow-400"
                              : "fill-transparent text-gray-300 hover:text-gray-400"
                          }`}
                        />
                      </button>
                    );
                  })}
                  {formData.starRating !== null && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, starRating: null })
                      }
                      data-ocid="review.star_rating.clear"
                      className="ml-3 text-sm text-gray-500 hover:text-gray-700 underline focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1 rounded"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Click a star to set the rating (1-5). Click the same star
                  again or "Clear" to leave it unset.
                </p>
              </div>

              <div>
                <label
                  htmlFor="book-title"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Book Title *
                </label>
                <select
                  id="book-title"
                  value={formData.bookTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, bookTitle: e.target.value })
                  }
                  data-ocid="review.book_title.select"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white"
                  required
                >
                  {BOOK_TITLES.map((title) => (
                    <option key={title} value={title}>
                      {title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="poem-title"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Poem Title (Optional)
                </label>
                <input
                  type="text"
                  id="poem-title"
                  value={formData.poemTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, poemTitle: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Where Blossoms Fall All at Once"
                />
              </div>

              <div>
                <label
                  htmlFor="poem-subtitle"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Poem Subtitle (Optional)
                </label>
                <input
                  type="text"
                  id="poem-subtitle"
                  value={formData.poemSubTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, poemSubTitle: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="A reflection on nature"
                />
              </div>

              <div>
                <label
                  htmlFor="page-numbers"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Page Number(s) *
                </label>
                <input
                  type="text"
                  id="page-numbers"
                  value={formData.pageNumbers}
                  onChange={(e) =>
                    setFormData({ ...formData, pageNumbers: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="42 or 42-45"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="photo"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Reviewer Photo (Optional)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="photo"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error("File size must be less than 5MB");
                        return;
                      }
                      setPhotoFile(file);
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: JPEG, PNG, WebP (max 5MB)
                </p>
              </div>

              {isUploading && (
                <div className="mb-4">
                  <div className="bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-black h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}

              <div>
                <label
                  htmlFor="snippet"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Review Snippet * (200 characters max)
                </label>
                <textarea
                  id="snippet"
                  value={formData.snippet}
                  onChange={(e) =>
                    setFormData({ ...formData, snippet: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  rows={3}
                  maxLength={200}
                  placeholder="A brief excerpt from the review..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.snippet.length}/200 characters
                </p>
              </div>

              <div>
                <label
                  htmlFor="full-text"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Full Review Text *
                </label>
                <textarea
                  id="full-text"
                  value={formData.fullText}
                  onChange={(e) =>
                    setFormData({ ...formData, fullText: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  rows={8}
                  placeholder="The complete review text..."
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="source-link"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Source Link (Optional)
                </label>
                <input
                  type="url"
                  id="source-link"
                  value={formData.sourceLink}
                  onChange={(e) =>
                    setFormData({ ...formData, sourceLink: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="https://example.com/review"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Link to the full review on an external site
                </p>
              </div>

              <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50">
                <label
                  htmlFor="video-url"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  🎥 Video Review URL (Optional)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Add a YouTube, Vimeo, or direct video URL. When set, this
                  review will display as a glass video card — only name &amp;
                  book title show by default; click expands the full review.
                </p>
                <input
                  type="url"
                  id="video-url"
                  value={formData.videoUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, videoUrl: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white"
                  placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    handleCancelEdit();
                  }}
                  className="flex-1 bg-gray-100 text-gray-800 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 bg-black text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:hover:-translate-y-0"
                >
                  {isUploading
                    ? "Uploading..."
                    : editingReview
                      ? "Update Review"
                      : "Add Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface ReviewCardProps {
  review: ExtendedReview;
  onEdit: () => void;
  onDelete: () => void;
}

function ReviewCard({ review, onEdit, onDelete }: ReviewCardProps) {
  const { data: photoUrl } = useFileUrl(review.photoPath || "");

  return (
    <div className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start space-x-4">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-100 flex-shrink-0">
          {review.photoPath && photoUrl ? (
            <img
              src={photoUrl}
              alt={review.reviewerName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full">
              <AnimatedPlaceholder
                className="w-full h-full rounded-full"
                width={64}
                height={64}
              />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {review.reviewerName}
              </h3>
              {review.companyBlogSite && (
                <p className="text-sm text-gray-600 truncate">
                  {review.companyBlogSite}
                </p>
              )}
              {review.starRating !== null &&
                review.starRating !== undefined && (
                  <div
                    className="flex items-center gap-0.5 mt-1"
                    aria-label={`${Number(
                      review.starRating,
                    )} star${Number(review.starRating) > 1 ? "s" : ""} rating`}
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          Number(review.starRating) >= star
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-transparent text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                )}
            </div>
            <div className="flex space-x-2 ml-4">
              <button
                onClick={onEdit}
                className="text-gray-600 hover:text-black transition-colors p-2"
                title="Edit"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                onClick={onDelete}
                className="text-gray-600 hover:text-red-600 transition-colors p-2"
                title="Delete"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="space-y-1 text-sm">
            <p className="text-gray-600">
              <span className="font-medium">Book:</span> {review.bookTitle}
            </p>
            {review.poemTitle && (
              <p className="text-gray-600">
                <span className="font-medium">Poem:</span> {review.poemTitle}
              </p>
            )}
            <p className="text-gray-600">
              <span className="font-medium">Page(s):</span> {review.pageNumbers}
            </p>
            {review.sourceLink && (
              <p className="text-gray-600">
                <span className="font-medium">Source:</span>{" "}
                <a
                  href={review.sourceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {review.sourceLink}
                </a>
              </p>
            )}
          </div>

          <p className="text-gray-700 mt-3 line-clamp-2">{review.snippet}</p>
        </div>
      </div>
    </div>
  );
}
