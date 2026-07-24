import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Loader2, Save } from "lucide-react";
import React, { useState } from "react";
import ReactQuill from "react-quill-new";
import { toast } from "sonner";
import { PolicyType } from "../backend";
import {
  useGetCurrentReviewNumber,
  useGetPolicyContent,
  useGetPromotionalTermsContent,
  useUpdateCurrentReviewNumber,
  useUpdatePolicyContent,
  useUpdatePromotionalTermsContent,
} from "../hooks/useQueries";
import "react-quill-new/dist/quill.snow.css";

const POLICY_TYPES = [
  {
    type: PolicyType.intellectualProperty,
    key: "intellectual-property",
    title: "Intellectual Property Policy",
    description: "Manage intellectual property rights and usage terms",
  },
  {
    type: PolicyType.termsAndConditions,
    key: "terms-conditions",
    title: "Terms & Conditions",
    description: "Define terms of service and user agreements",
  },
  {
    type: PolicyType.privacyPolicy,
    key: "privacy-policy",
    title: "Privacy Policy",
    description: "Outline data collection and privacy practices",
  },
  {
    type: PolicyType.refundAndReturn,
    key: "refund-return",
    title: "Refund & Return Policy",
    description: "Set refund and return procedures and conditions",
  },
  {
    type: PolicyType.shippingAndDelivery,
    key: "shipping-delivery",
    title: "Shipping & Delivery Policy",
    description: "Define shipping methods and delivery terms",
  },
  {
    type: PolicyType.cookiePolicy,
    key: "cookie-policy",
    title: "Cookie Policy",
    description: "Manage cookie usage and privacy settings",
  },
  {
    type: PolicyType.disclaimerLiability,
    key: "disclaimer-liability",
    title: "Disclaimer Liability",
    description: "Define liability disclaimers and legal limitations",
  },
  {
    type: null,
    key: "promotional-terms",
    title: "Promotional Terms",
    description: "Manage promotional terms and conditions for the roadmap",
  },
];

export default function AdminPolicyManager() {
  const [activeTab, setActiveTab] = useState("intellectual-property");
  const [editingContent, setEditingContent] = useState<Record<string, string>>(
    {},
  );
  const [saveStatus, setSaveStatus] = useState<
    Record<string, "idle" | "saving" | "saved" | "error">
  >({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updatePolicyContent = useUpdatePolicyContent();
  const updatePromotionalTerms = useUpdatePromotionalTermsContent();

  const handleContentChange = (policyKey: string, content: string) => {
    setEditingContent((prev) => ({
      ...prev,
      [policyKey]: content,
    }));

    // Clear any existing errors when user starts typing
    if (errors[policyKey]) {
      setErrors((prev) => ({
        ...prev,
        [policyKey]: "",
      }));
    }
  };

  const handleSave = async (
    policyType: PolicyType | null,
    policyKey: string,
  ) => {
    const content = editingContent[policyKey];

    if (!content || content.trim() === "") {
      setErrors((prev) => ({
        ...prev,
        [policyKey]: "Policy content cannot be empty",
      }));
      return;
    }

    setSaveStatus((prev) => ({ ...prev, [policyKey]: "saving" }));
    setErrors((prev) => ({ ...prev, [policyKey]: "" }));

    try {
      if (policyKey === "promotional-terms") {
        await updatePromotionalTerms.mutateAsync(content.trim());
      } else if (policyType) {
        await updatePolicyContent.mutateAsync({
          policyType,
          content: content.trim(),
        });
      }

      setSaveStatus((prev) => ({ ...prev, [policyKey]: "saved" }));
      toast.success("Policy saved successfully");

      // Reset save status after 3 seconds
      setTimeout(() => {
        setSaveStatus((prev) => ({ ...prev, [policyKey]: "idle" }));
      }, 3000);
    } catch (error) {
      console.error("Failed to save policy:", error);
      setSaveStatus((prev) => ({ ...prev, [policyKey]: "error" }));
      setErrors((prev) => ({
        ...prev,
        [policyKey]:
          error instanceof Error ? error.message : "Failed to save policy",
      }));
      toast.error("Failed to save policy");

      // Reset error status after 5 seconds
      setTimeout(() => {
        setSaveStatus((prev) => ({ ...prev, [policyKey]: "idle" }));
      }, 5000);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
      <div className="flex items-center mb-8">
        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mr-4">
          <FileText className="w-6 h-6 text-gray-900" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Policy Management
          </h2>
          <p className="text-gray-600">
            Edit and manage all policy documents for your webshop
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-8 mb-8">
          {POLICY_TYPES.map((policy) => (
            <TabsTrigger
              key={policy.key}
              value={policy.key}
              className="text-xs lg:text-sm"
            >
              {policy.title.split(" ")[0]}
            </TabsTrigger>
          ))}
        </TabsList>

        {POLICY_TYPES.map((policy) => (
          <TabsContent key={policy.key} value={policy.key}>
            {policy.key === "promotional-terms" ? (
              <PromotionalTermsEditor
                policyKey={policy.key}
                title={policy.title}
                description={policy.description}
                content={editingContent[policy.key]}
                onContentChange={(content) =>
                  handleContentChange(policy.key, content)
                }
                onSave={() => handleSave(null, policy.key)}
                saveStatus={saveStatus[policy.key] || "idle"}
                error={errors[policy.key]}
                isSaving={updatePromotionalTerms.isPending}
              />
            ) : (
              <PolicyEditor
                policyType={policy.type!}
                policyKey={policy.key}
                title={policy.title}
                description={policy.description}
                content={editingContent[policy.key]}
                onContentChange={(content) =>
                  handleContentChange(policy.key, content)
                }
                onSave={() => handleSave(policy.type!, policy.key)}
                saveStatus={saveStatus[policy.key] || "idle"}
                error={errors[policy.key]}
                isSaving={updatePolicyContent.isPending}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Review Progress Manager */}
      <div className="mt-8 border-t border-gray-200 pt-8">
        <ReviewProgressManager />
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-xl">
        <h4 className="font-semibold text-gray-800 mb-2">
          Policy Management Guidelines:
        </h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>
            • All policy changes are immediately saved and reflected on the
            policy pages
          </li>
          <li>
            • Use the rich text editor for Promotional Terms to format content
            with bold, italics, line breaks, etc.
          </li>
          <li>
            • Use clear, professional language appropriate for legal documents
          </li>
          <li>• Include all necessary legal information and contact details</li>
          <li>
            • Review policies regularly to ensure compliance with current
            regulations
          </li>
          <li>
            • Default placeholder text "0101010001001" will be shown until you
            add content
          </li>
          <li>
            • Update the review progress number to control the roadmap progress
            bar
          </li>
        </ul>
      </div>
    </div>
  );
}

interface PolicyEditorProps {
  policyType: PolicyType;
  policyKey: string;
  title: string;
  description: string;
  content?: string;
  onContentChange: (content: string) => void;
  onSave: () => void;
  saveStatus: "idle" | "saving" | "saved" | "error";
  error?: string;
  isSaving: boolean;
}

function PolicyEditor({
  policyType,
  policyKey,
  title,
  description,
  content,
  onContentChange,
  onSave,
  saveStatus,
  error,
  isSaving,
}: PolicyEditorProps) {
  const { data: policyData, isLoading } = useGetPolicyContent(policyType);

  // Initialize content from backend data if not already set
  React.useEffect(() => {
    if (policyData && content === undefined) {
      onContentChange(policyData.content);
    }
  }, [policyData, content, onContentChange]);

  const currentContent =
    content !== undefined ? content : policyData?.content || "";
  const hasChanges = currentContent !== (policyData?.content || "");
  const isPlaceholder = policyData?.content === "0101010001001";

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading policy content...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">{title}</h3>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {saveStatus === "saved" && (
              <span className="text-sm text-green-600 font-medium">Saved</span>
            )}
            {saveStatus === "error" && (
              <span className="text-sm text-red-600 font-medium">Error</span>
            )}
            <Button
              onClick={onSave}
              disabled={!hasChanges || isSaving || saveStatus === "saving"}
              size="sm"
              className="min-w-[80px]"
            >
              {saveStatus === "saving" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPlaceholder && (
          <Alert>
            <AlertDescription>
              This policy currently shows placeholder content. Add your policy
              text below and save to update it.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div>
          <label
            htmlFor={`policy-${policyKey}`}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Policy Content
          </label>
          <Textarea
            id={`policy-${policyKey}`}
            value={currentContent}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder={`Enter your ${title.toLowerCase()} content here...`}
            className="min-h-[400px] font-mono text-sm"
            style={{ fontSize: "12px" }}
          />
          <p className="text-xs text-gray-500 mt-2">
            Content will be displayed with 12px font size on the policy page.
            Use line breaks to separate paragraphs.
          </p>
        </div>

        {hasChanges && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              You have unsaved changes. Click "Save" to update the policy.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PromotionalTermsEditorProps {
  policyKey: string;
  title: string;
  description: string;
  content?: string;
  onContentChange: (content: string) => void;
  onSave: () => void;
  saveStatus: "idle" | "saving" | "saved" | "error";
  error?: string;
  isSaving: boolean;
}

function PromotionalTermsEditor({
  policyKey,
  title,
  description,
  content,
  onContentChange,
  onSave,
  saveStatus,
  error,
  isSaving,
}: PromotionalTermsEditorProps) {
  const { data: htmlContent, isLoading } = useGetPromotionalTermsContent();

  // Initialize content from backend data if not already set
  React.useEffect(() => {
    if (htmlContent && content === undefined) {
      onContentChange(htmlContent);
    }
  }, [htmlContent, content, onContentChange]);

  const currentContent = content !== undefined ? content : htmlContent || "";
  const hasChanges = currentContent !== (htmlContent || "");
  const isPlaceholder = htmlContent === "0101010001001";

  // Quill editor modules configuration
  const modules = React.useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ indent: "-1" }, { indent: "+1" }],
        ["link"],
        ["clean"],
      ],
    }),
    [],
  );

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "list",
    "bullet",
    "indent",
    "link",
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading promotional terms content...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">{title}</h3>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {saveStatus === "saved" && (
              <span className="text-sm text-green-600 font-medium">Saved</span>
            )}
            {saveStatus === "error" && (
              <span className="text-sm text-red-600 font-medium">Error</span>
            )}
            <Button
              onClick={onSave}
              disabled={!hasChanges || isSaving || saveStatus === "saving"}
              size="sm"
              className="min-w-[80px]"
            >
              {saveStatus === "saving" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPlaceholder && (
          <Alert>
            <AlertDescription>
              This policy currently shows placeholder content. Add your
              promotional terms text below and save to update it.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div>
          <label
            htmlFor={`policy-${policyKey}`}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Promotional Terms Content (Rich Text Editor)
          </label>
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <ReactQuill
              theme="snow"
              value={currentContent}
              onChange={onContentChange}
              modules={modules}
              formats={formats}
              placeholder="Enter your promotional terms content here. Use the toolbar to format text with bold, italics, headers, lists, etc."
              className="min-h-[400px]"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Use the rich text editor toolbar to format your content. Bold text,
            line breaks, and spacing will be preserved in the final display.
          </p>
        </div>

        {hasChanges && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              You have unsaved changes. Click "Save" to update the promotional
              terms.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReviewProgressManager() {
  const { data: currentReviews, isLoading } = useGetCurrentReviewNumber();
  const updateReviewNumber = useUpdateCurrentReviewNumber();
  const [reviewInput, setReviewInput] = useState("");

  React.useEffect(() => {
    if (currentReviews !== undefined) {
      setReviewInput(currentReviews.toString());
    }
  }, [currentReviews]);

  const handleSave = async () => {
    const reviewNumber = Number.parseInt(reviewInput, 10);

    if (Number.isNaN(reviewNumber) || reviewNumber < 0) {
      toast.error("Please enter a valid review number");
      return;
    }

    if (reviewNumber > 250) {
      toast.error("Review number cannot exceed 250");
      return;
    }

    try {
      await updateReviewNumber.mutateAsync(BigInt(reviewNumber));
      toast.success("Review progress updated successfully");
    } catch (error) {
      console.error("Failed to update review number:", error);
      toast.error("Failed to update review progress");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading review progress...</span>
      </div>
    );
  }

  const hasChanges = reviewInput !== (currentReviews?.toString() || "0");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Progress Manager</CardTitle>
        <CardDescription>
          Set the current review number to control the roadmap progress bar (1
          to 250)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label
              htmlFor="review-number"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Current Review Number
            </label>
            <Input
              id="review-number"
              type="number"
              min="0"
              max="250"
              value={reviewInput}
              onChange={(e) => setReviewInput(e.target.value)}
              placeholder="Enter current review number"
              className="w-full"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateReviewNumber.isPending}
            className="min-w-[100px]"
          >
            {updateReviewNumber.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </div>

        {hasChanges && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              You have unsaved changes. Click "Save" to update the review
              progress.
            </p>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            <strong>Current Progress:</strong>{" "}
            {currentReviews?.toString() || "0"} / 250 reviews
          </p>
          <p className="text-xs text-gray-500 mt-1">
            The progress bar on the homepage will automatically update to
            reflect this value.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
