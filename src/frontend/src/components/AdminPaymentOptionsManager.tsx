import {
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { memo, useCallback, useState } from "react";
import type { PaymentCountry, PaymentOption } from "../backend";
import { useFileUpload } from "../blob-storage/FileStorage";
import {
  type SharedPaymentLogo,
  useAddPaymentCountry,
  useAddPaymentOption,
  useAddSharedPaymentLogo,
  useBitcoinPaymentConfig,
  useDeletePaymentCountry,
  useDeletePaymentOption,
  useEthereumPaymentConfig,
  useIcpPaymentConfig,
  usePaymentCountries,
  usePaymentOptionsByCountry,
  useSetBtcWalletAddress,
  useSetEthWalletAddress,
  useSetIcpWalletAddress,
  useSharedPaymentLogos,
  useUpdatePaymentCountry,
  useUpdatePaymentOption,
} from "../hooks/useQueries";

// ─── Constants ────────────────────────────────────────────────────────────────

const CONTINENTS = [
  "Africa",
  "Americas",
  "Asia",
  "Europe",
  "Middle East",
  "Oceania",
  "Other",
] as const;
type Continent = (typeof CONTINENTS)[number];

// PaymentCountry from backend.d.ts doesn't yet include continent (DID not rebuilt),
// so we extend it here for use in the frontend only.
type PaymentCountryWithContinent = PaymentCountry & { continent?: string };

function makeId(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

const SECTION_STYLE: React.CSSProperties = {
  background: "#fff",
  color: "#111",
};
const LABEL_CLS =
  "block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide";
const INPUT_CLS =
  "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-black";

// ─── Logo picker ──────────────────────────────────────────────────────────────

function LogoPicker({
  value,
  storageKeyValue,
  onChange,
  onStorageKeyChange,
  idSuffix,
}: {
  value: string;
  storageKeyValue: string;
  onChange: (url: string) => void;
  onStorageKeyChange: (key: string) => void;
  idSuffix: string;
}) {
  const { data: sharedLogos = [] } = useSharedPaymentLogos();
  const addLogo = useAddSharedPaymentLogo();
  const { uploadFile, isUploading } = useFileUpload();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploadProgress(0);
    try {
      const path = `payment-logos/${makeId()}-${file.name}`;
      const result = await uploadFile(path, file, (pct) =>
        setUploadProgress(pct),
      );
      onChange(result.url);
      onStorageKeyChange(result.path);
      // Register in shared registry
      const newLogo: SharedPaymentLogo = {
        id: makeId(),
        name: file.name.replace(/\.[^.]+$/, ""),
        logoUrl: result.url,
        logoStorageKey: result.path,
      };
      addLogo.mutate(newLogo);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  return (
    <div className="space-y-2">
      <label className={LABEL_CLS}>Logo</label>

      {/* Currently selected preview */}
      {value && (
        <div className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 bg-gray-50">
          <img
            src={value}
            alt="Selected logo"
            className="w-10 h-10 object-contain rounded"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <span className="text-xs text-gray-600 truncate flex-1">
            {storageKeyValue || value}
          </span>
          <button
            type="button"
            onClick={() => {
              onChange("");
              onStorageKeyChange("");
            }}
            className="text-gray-400 hover:text-red-500 transition-colors"
            aria-label="Clear logo"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Shared logos grid */}
      {sharedLogos.length > 0 && (
        <div>
          <p className="text-[10px] text-gray-500 mb-1 font-medium uppercase tracking-wide">
            Select from shared logos:
          </p>
          <div className="grid grid-cols-5 gap-1.5 max-h-32 overflow-y-auto p-1 border border-gray-200 rounded-lg bg-gray-50">
            {sharedLogos.map((logo) => (
              <button
                key={logo.id}
                type="button"
                onClick={() => {
                  onChange(logo.logoUrl);
                  onStorageKeyChange(logo.logoStorageKey);
                }}
                title={logo.name}
                className={`flex flex-col items-center gap-0.5 p-1 rounded-md transition-all border ${
                  value === logo.logoUrl
                    ? "border-black bg-black/5 shadow-sm"
                    : "border-transparent hover:border-gray-300 hover:bg-white"
                }`}
                data-ocid={`logo-picker-thumb-${logo.id}-${idSuffix}`}
              >
                <img
                  src={logo.logoUrl}
                  alt={logo.name}
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.opacity = "0.3";
                  }}
                />
                <span className="text-[8px] text-gray-500 truncate w-full text-center leading-tight">
                  {logo.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Upload new logo */}
      <div className="flex items-center gap-2">
        <label
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg cursor-pointer transition-colors"
          data-ocid={`logo-upload-btn-${idSuffix}`}
        >
          <ImagePlus className="w-3.5 h-3.5" />
          {isUploading ? `Uploading ${uploadProgress}%…` : "Upload logo"}
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </label>
      </div>

      {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}

      {/* Custom URL fallback */}
      <div>
        <p className="text-[10px] text-gray-500 mb-1">Or paste a custom URL:</p>
        <input
          type="url"
          className={INPUT_CLS}
          value={value}
          placeholder="https://..."
          onChange={(e) => onChange(e.target.value)}
          data-ocid={`option-logo-input-${idSuffix}`}
        />
      </div>
    </div>
  );
}

// ─── OptionFormState ──────────────────────────────────────────────────────────

interface OptionFormState {
  id: string;
  countryId: string;
  methodName: string;
  link: string;
  logoUrl: string;
  buttonColor: string;
  fontColor: string;
  buzzingEnabled: boolean;
  priceEuro: string;
  shippingEuro: string;
  sortOrder: bigint | number;
  enabled: boolean;
  logoStorageKey: string;
}

// ─── Option edit/add form ─────────────────────────────────────────────────────

function OptionEditForm({
  form,
  countries,
  onChange,
  onSave,
  onCancel,
  isPending,
  idSuffix,
}: {
  form: OptionFormState;
  countries: PaymentCountry[];
  onChange: (f: OptionFormState) => void;
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
  idSuffix: string;
}) {
  const set = (field: keyof OptionFormState, value: unknown) =>
    onChange({ ...form, [field]: value });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL_CLS}>Country</label>
          <select
            className={INPUT_CLS}
            value={form.countryId}
            onChange={(e) => set("countryId", e.target.value)}
            data-ocid={`option-country-select-${idSuffix}`}
          >
            <option value="">— Select country —</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL_CLS}>Method Name</label>
          <input
            type="text"
            className={INPUT_CLS}
            value={form.methodName}
            placeholder="e.g. iDEAL / Wero"
            onChange={(e) => set("methodName", e.target.value)}
            data-ocid={`option-method-input-${idSuffix}`}
          />
        </div>
      </div>

      <div>
        <label className={LABEL_CLS}>
          Payment Link{" "}
          <span className="font-normal normal-case text-gray-400">
            (leave empty = UNAVAILABLE)
          </span>
        </label>
        <input
          type="url"
          className={INPUT_CLS}
          value={form.link}
          placeholder="https://..."
          onChange={(e) => set("link", e.target.value)}
          data-ocid={`option-link-input-${idSuffix}`}
        />
      </div>

      <LogoPicker
        value={form.logoUrl}
        storageKeyValue={form.logoStorageKey}
        onChange={(url) => set("logoUrl", url)}
        onStorageKeyChange={(key) => set("logoStorageKey", key)}
        idSuffix={idSuffix}
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL_CLS}>Button Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="h-9 w-12 rounded border border-gray-300 cursor-pointer"
              value={form.buttonColor || "#1a1a1a"}
              onChange={(e) => set("buttonColor", e.target.value)}
              data-ocid={`option-bg-color-${idSuffix}`}
            />
            <input
              type="text"
              className={`${INPUT_CLS} flex-1`}
              value={form.buttonColor || "#1a1a1a"}
              onChange={(e) => set("buttonColor", e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className={LABEL_CLS}>Font Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="h-9 w-12 rounded border border-gray-300 cursor-pointer"
              value={form.fontColor || "#ffffff"}
              onChange={(e) => set("fontColor", e.target.value)}
              data-ocid={`option-font-color-${idSuffix}`}
            />
            <input
              type="text"
              className={`${INPUT_CLS} flex-1`}
              value={form.fontColor || "#ffffff"}
              onChange={(e) => set("fontColor", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL_CLS}>Price</label>
          <input
            type="text"
            className={INPUT_CLS}
            value={form.priceEuro}
            placeholder="€39.39"
            onChange={(e) => set("priceEuro", e.target.value)}
            data-ocid={`option-price-input-${idSuffix}`}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>Shipping</label>
          <input
            type="text"
            className={INPUT_CLS}
            value={form.shippingEuro}
            placeholder="€4.95 shipping"
            onChange={(e) => set("shippingEuro", e.target.value)}
            data-ocid={`option-shipping-input-${idSuffix}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL_CLS}>Sort Order</label>
          <input
            type="number"
            className={INPUT_CLS}
            value={Number(form.sortOrder)}
            onChange={(e) => set("sortOrder", BigInt(e.target.value || "0"))}
            data-ocid={`option-sort-input-${idSuffix}`}
          />
        </div>
        <div className="flex flex-col justify-end gap-2 pb-0.5">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`buzz-${idSuffix}`}
              checked={form.buzzingEnabled}
              onChange={(e) => set("buzzingEnabled", e.target.checked)}
              className="rounded border-gray-300"
              data-ocid={`option-buzzing-toggle-${idSuffix}`}
            />
            <label
              htmlFor={`buzz-${idSuffix}`}
              className="text-sm text-gray-700"
            >
              Buzzing animation
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`enabled-opt-${idSuffix}`}
              checked={form.enabled}
              onChange={(e) => set("enabled", e.target.checked)}
              className="rounded border-gray-300"
              data-ocid={`option-enabled-toggle-${idSuffix}`}
            />
            <label
              htmlFor={`enabled-opt-${idSuffix}`}
              className="text-sm text-gray-700"
            >
              Enabled
            </label>
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onSave}
          disabled={isPending}
          className="px-4 py-1.5 bg-black text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          data-ocid={`option-save-btn-${idSuffix}`}
        >
          {isPending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Payment option row ────────────────────────────────────────────────────────

function OptionRow({
  option,
  countries,
}: { option: PaymentOption; countries: PaymentCountry[] }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<OptionFormState>({
    id: option.id,
    countryId: option.countryId,
    methodName: option.methodName,
    link: option.link,
    logoUrl: option.logoUrl,
    buttonColor: option.buttonColor,
    fontColor: option.fontColor,
    buzzingEnabled: option.buzzingEnabled,
    priceEuro: option.priceEuro,
    shippingEuro: option.shippingEuro,
    sortOrder: option.sortOrder,
    enabled: option.enabled,
    logoStorageKey: option.logoStorageKey,
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const update = useUpdatePaymentOption();
  const remove = useDeletePaymentOption();

  const handleSave = () => {
    update.mutate(
      { ...form, sortOrder: BigInt(Number(form.sortOrder)) } as PaymentOption,
      { onSuccess: () => setEditing(false) },
    );
  };

  return (
    <div
      className="rounded-lg border border-gray-200 p-3 bg-white"
      data-ocid={`payment-option-row-${option.id}`}
    >
      {!editing ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
              style={{ background: option.buttonColor || "#1a1a1a" }}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {option.methodName}
              </p>
              <p className="text-[10px] text-gray-400 truncate max-w-[160px]">
                {option.link ? option.link : <em>UNAVAILABLE</em>}
              </p>
            </div>
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${option.enabled ? "bg-green-500" : "bg-gray-300"}`}
            />
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              data-ocid={`payment-option-edit-btn-${option.id}`}
            >
              Edit
            </button>
            {confirmDelete ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    remove.mutate(option.id, {
                      onSuccess: () => setConfirmDelete(false),
                    })
                  }
                  disabled={remove.isPending}
                  className="px-3 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  data-ocid={`payment-option-confirm-delete-${option.id}`}
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-md"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="p-1 text-red-400 hover:text-red-600 transition-colors"
                aria-label="Delete option"
                data-ocid={`payment-option-delete-btn-${option.id}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <OptionEditForm
          form={form}
          countries={countries}
          onChange={setForm}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
          isPending={update.isPending}
          idSuffix={option.id}
        />
      )}
    </div>
  );
}

// ─── Add option form ──────────────────────────────────────────────────────────

function AddOptionForm({
  countries,
  defaultCountryId,
  onDone,
}: {
  countries: PaymentCountry[];
  defaultCountryId?: string;
  onDone: () => void;
}) {
  const defaultForm: OptionFormState = {
    id: "",
    countryId: defaultCountryId ?? countries[0]?.id ?? "",
    methodName: "",
    link: "",
    logoUrl: "",
    buttonColor: "#1a1a1a",
    fontColor: "#ffffff",
    buzzingEnabled: true,
    priceEuro: "€39.39",
    shippingEuro: "",
    sortOrder: 0,
    enabled: true,
    logoStorageKey: "",
  };
  const [form, setForm] = useState<OptionFormState>(defaultForm);
  const add = useAddPaymentOption();

  const handleAdd = () => {
    if (!form.methodName.trim() || !form.countryId) return;
    const option: PaymentOption = {
      id: makeId(),
      countryId: form.countryId,
      methodName: form.methodName.trim(),
      link: form.link.trim(),
      logoUrl: form.logoUrl.trim(),
      logoStorageKey: form.logoStorageKey,
      buttonColor: form.buttonColor,
      fontColor: form.fontColor,
      buzzingEnabled: form.buzzingEnabled,
      priceEuro: form.priceEuro,
      shippingEuro: form.shippingEuro,
      sortOrder: BigInt(Number(form.sortOrder)),
      enabled: form.enabled,
    };
    add.mutate(option, {
      onSuccess: () => {
        setForm({
          ...defaultForm,
          id: "",
          countryId: defaultCountryId ?? countries[0]?.id ?? "",
        });
        onDone();
      },
    });
  };

  return (
    <div className="rounded-lg border border-dashed border-gray-300 p-4 bg-gray-50 space-y-1">
      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">
        Add Payment Method
      </h4>
      <OptionEditForm
        form={form}
        countries={countries}
        onChange={setForm}
        onSave={handleAdd}
        onCancel={onDone}
        isPending={add.isPending}
        idSuffix="new"
      />
    </div>
  );
}

// ─── Add country form ─────────────────────────────────────────────────────────

function AddCountryForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState<{
    name: string;
    sortOrder: number;
    enabled: boolean;
    continent: Continent;
  }>({
    name: "",
    sortOrder: 0,
    enabled: true,
    continent: "Europe",
  });
  const add = useAddPaymentCountry();

  const handleAdd = () => {
    if (!form.name.trim()) return;
    const country = {
      id: makeId(),
      name: form.name.trim(),
      sortOrder: BigInt(form.sortOrder),
      enabled: form.enabled,
      continent: form.continent,
    } as unknown as PaymentCountry;
    add.mutate(country, {
      onSuccess: () => {
        setForm({ name: "", sortOrder: 0, enabled: true, continent: "Europe" });
        onDone();
      },
    });
  };

  return (
    <div className="rounded-lg border border-dashed border-gray-300 p-4 bg-gray-50 space-y-3">
      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
        Add Country
      </h4>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL_CLS}>Country Name</label>
          <input
            type="text"
            className={INPUT_CLS}
            value={form.name}
            placeholder="e.g. Netherlands"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            data-ocid="add-payment-country-name-input"
          />
        </div>
        <div>
          <label className={LABEL_CLS}>Sort Order</label>
          <input
            type="number"
            className={INPUT_CLS}
            value={form.sortOrder}
            onChange={(e) =>
              setForm({ ...form, sortOrder: Number(e.target.value || "0") })
            }
            data-ocid="add-payment-country-order-input"
          />
        </div>
      </div>
      <div>
        <label className={LABEL_CLS}>Continent</label>
        <select
          className={INPUT_CLS}
          value={form.continent}
          onChange={(e) =>
            setForm({ ...form, continent: e.target.value as Continent })
          }
          data-ocid="add-payment-country-continent-select"
        >
          {CONTINENTS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="add-country-enabled"
          checked={form.enabled}
          onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
          className="rounded border-gray-300"
          data-ocid="add-payment-country-enabled-toggle"
        />
        <label htmlFor="add-country-enabled" className="text-sm text-gray-700">
          Enabled
        </label>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleAdd}
          disabled={add.isPending || !form.name.trim()}
          className="px-4 py-1.5 bg-black text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          data-ocid="add-payment-country-submit-btn"
        >
          {add.isPending ? "Adding…" : "Add Country"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="px-4 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Country details — lazy loaded when expanded ──────────────────────────────

const CountryDetailsSection = memo(function CountryDetailsSection({
  country,
  allCountries,
}: { country: PaymentCountry; allCountries: PaymentCountry[] }) {
  const { data: options = [], isLoading } = usePaymentOptionsByCountry(
    country.id,
  );
  const [showAddOption, setShowAddOption] = useState(false);
  const handleDone = useCallback(() => setShowAddOption(false), []);

  if (isLoading) {
    return (
      <div className="px-4 py-3 flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin flex-shrink-0" />
        <span className="text-xs text-gray-500">
          Loading payment options for {country.name}…
        </span>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-100 px-4 pb-4 pt-3 bg-white space-y-3">
      {options.length === 0 && !showAddOption && (
        <p className="text-xs text-gray-400 italic">
          No payment methods configured yet for {country.name}.
        </p>
      )}
      <div className="space-y-2">
        {options.map((opt) => (
          <OptionRow key={opt.id} option={opt} countries={allCountries} />
        ))}
      </div>
      {showAddOption ? (
        <AddOptionForm
          countries={allCountries}
          defaultCountryId={country.id}
          onDone={handleDone}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowAddOption(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-white text-xs font-medium rounded-lg hover:bg-gray-700 transition-colors"
          data-ocid={`add-payment-option-country-btn-${country.id}`}
        >
          <Plus className="w-3.5 h-3.5" /> Add Payment Method
        </button>
      )}
    </div>
  );
});

// ─── Expandable country list item ─────────────────────────────────────────────

function CountryListItem({
  country,
  allCountries,
  isExpanded,
  onToggle,
}: {
  country: PaymentCountryWithContinent;
  allCountries: PaymentCountry[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<PaymentCountryWithContinent>({ ...country });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const update = useUpdatePaymentCountry();
  const remove = useDeletePaymentCountry();

  const handleSave = () => {
    update.mutate(form as PaymentCountry, {
      onSuccess: () => setEditMode(false),
    });
  };

  return (
    <div
      className="rounded-lg border border-gray-200 overflow-hidden"
      data-ocid={`payment-country-list-item-${country.id}`}
    >
      {/* Header row — always visible */}
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 bg-white hover:bg-gray-50 transition-colors">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
          data-ocid={`payment-country-expand-btn-${country.id}`}
        >
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${country.enabled ? "bg-green-500" : "bg-gray-300"}`}
          />
          <span className="text-sm font-medium text-gray-900 truncate">
            {country.name}
          </span>
          <span className="text-[10px] text-gray-400 flex-shrink-0">
            #{Number(country.sortOrder)}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-gray-400 ml-auto flex-shrink-0" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-auto flex-shrink-0" />
          )}
        </button>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setEditMode((v) => !v);
            }}
            className="px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            data-ocid={`payment-country-edit-btn-${country.id}`}
          >
            Edit
          </button>
          {confirmDelete ? (
            <>
              <button
                type="button"
                onClick={() =>
                  remove.mutate(country.id, {
                    onSuccess: () => setConfirmDelete(false),
                  })
                }
                disabled={remove.isPending}
                className="px-2.5 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                data-ocid={`payment-country-confirm-delete-${country.id}`}
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-2.5 py-1 text-xs bg-gray-200 text-gray-700 rounded-md"
                data-ocid={`payment-country-cancel-delete-${country.id}`}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDelete(true);
              }}
              className="p-1 text-red-400 hover:text-red-600 transition-colors"
              aria-label="Delete country"
              data-ocid={`payment-country-delete-btn-${country.id}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Inline edit form */}
      {editMode && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLS}>Country Name</label>
              <input
                type="text"
                className={INPUT_CLS}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                data-ocid={`payment-country-name-input-${country.id}`}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Sort Order</label>
              <input
                type="number"
                className={INPUT_CLS}
                value={Number(form.sortOrder)}
                onChange={(e) =>
                  setForm({ ...form, sortOrder: BigInt(e.target.value || "0") })
                }
                data-ocid={`payment-country-order-input-${country.id}`}
              />
            </div>
          </div>
          <div>
            <label className={LABEL_CLS}>Continent</label>
            <select
              className={INPUT_CLS}
              value={form.continent ?? "Other"}
              onChange={(e) => setForm({ ...form, continent: e.target.value })}
              data-ocid={`payment-country-continent-select-${country.id}`}
            >
              {CONTINENTS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`enabled-${country.id}`}
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              className="rounded border-gray-300"
              data-ocid={`payment-country-enabled-toggle-${country.id}`}
            />
            <label
              htmlFor={`enabled-${country.id}`}
              className="text-sm text-gray-700"
            >
              Enabled (visible in selector)
            </label>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={update.isPending}
              className="px-4 py-1.5 bg-black text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              data-ocid={`payment-country-save-btn-${country.id}`}
            >
              {update.isPending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="px-4 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 transition-colors"
              data-ocid={`payment-country-cancel-edit-${country.id}`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Lazy-loaded payment options */}
      {isExpanded && !editMode && (
        <CountryDetailsSection country={country} allCountries={allCountries} />
      )}
    </div>
  );
}

// ─── Continent group section ──────────────────────────────────────────────────

const CONTINENT_COLORS: Record<string, string> = {
  Europe: "#3b82f6",
  Americas: "#10b981",
  Asia: "#f59e0b",
  Africa: "#ef4444",
  "Middle East": "#8b5cf6",
  Oceania: "#06b6d4",
  Other: "#6b7280",
};

function ContinentGroup({
  continent,
  countries,
  allCountries,
  expandedCountryId,
  onToggleCountry,
}: {
  continent: string;
  countries: PaymentCountryWithContinent[];
  allCountries: PaymentCountry[];
  expandedCountryId: string | null;
  onToggleCountry: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const color = CONTINENT_COLORS[continent] ?? "#6b7280";

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden mb-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-2.5 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
        data-ocid={`continent-group-toggle-${continent.toLowerCase().replace(/\s/g, "-")}`}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: color }}
          />
          <span className="text-sm font-semibold text-gray-800">
            {continent}
          </span>
          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-gray-200 text-gray-600">
            {countries.length}
          </span>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {open && (
        <div className="px-3 pb-3 pt-2 bg-white space-y-2">
          {countries.map((c) => (
            <CountryListItem
              key={c.id}
              country={c}
              allCountries={allCountries}
              isExpanded={expandedCountryId === c.id}
              onToggle={() => onToggleCountry(c.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Crypto address field ─────────────────────────────────────────────────────

function CryptoAddressField({
  label,
  description,
  placeholder,
  accentColor,
  currentAddress,
  onChange,
  onSave,
  isPending,
  saved,
  error,
  ocidPrefix,
}: {
  label: string;
  description: string;
  placeholder: string;
  accentColor: string;
  currentAddress: string;
  onChange: (v: string) => void;
  onSave: () => void;
  isPending: boolean;
  saved: boolean;
  error: string | null;
  ocidPrefix: string;
}) {
  return (
    <div
      className="rounded-xl border p-4 mb-4 space-y-3"
      style={{
        borderColor: `${accentColor}44`,
        background: `${accentColor}08`,
      }}
      data-ocid={`${ocidPrefix}.section`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className="inline-block w-3 h-3 rounded-full flex-shrink-0"
          style={{ background: accentColor }}
        />
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
          {label}
        </h3>
      </div>
      <p className="text-xs text-gray-500">{description}</p>
      <div>
        <label className={LABEL_CLS}>Wallet Address</label>
        <input
          type="text"
          className={INPUT_CLS}
          value={currentAddress}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          data-ocid={`${ocidPrefix}.wallet_address_input`}
        />
      </div>
      {error && (
        <p
          className="text-xs text-red-600"
          data-ocid={`${ocidPrefix}.error_state`}
        >
          {error}
        </p>
      )}
      {saved && (
        <p
          className="text-xs text-green-700 font-medium"
          data-ocid={`${ocidPrefix}.success_state`}
        >
          ✓ Address saved successfully.
        </p>
      )}
      <button
        type="button"
        onClick={onSave}
        disabled={isPending}
        className="px-4 py-1.5 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
        style={{ background: accentColor }}
        data-ocid={`${ocidPrefix}.save_button`}
      >
        {isPending ? "Saving…" : `Save ${label.split(" ")[0]} Address`}
      </button>
    </div>
  );
}

function BitcoinSettings() {
  const { data: btcConfig } = useBitcoinPaymentConfig();
  const [address, setAddress] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveMutation = useSetBtcWalletAddress();
  const currentAddress =
    address !== "" ? address : (btcConfig?.walletAddress ?? "");

  return (
    <CryptoAddressField
      label="Bitcoin (BTC)"
      description="Set the BTC wallet address shown in the Bitcoin payment pop-up and QR code."
      placeholder="bc1q..."
      accentColor="#F7931A"
      currentAddress={currentAddress}
      onChange={setAddress}
      onSave={() => {
        const t = currentAddress.trim();
        if (!t) {
          setError("BTC wallet address cannot be empty.");
          return;
        }
        setError(null);
        saveMutation.mutate(t, {
          onSuccess: () => {
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
          },
          onError: (e) =>
            setError(e instanceof Error ? e.message : "Save failed."),
        });
      }}
      isPending={saveMutation.isPending}
      saved={saved}
      error={error}
      ocidPrefix="btc-settings"
    />
  );
}

function EthereumSettings() {
  const { data: ethConfig } = useEthereumPaymentConfig();
  const [address, setAddress] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveMutation = useSetEthWalletAddress();
  const currentAddress =
    address !== ""
      ? address
      : (ethConfig?.walletAddress ??
        "0x29420495cF2FFBa1EeD56319F5c6EDf620C44858");

  return (
    <CryptoAddressField
      label="Ethereum (ETH)"
      description="Set the ETH wallet address shown in the Ethereum payment pop-up and QR code."
      placeholder="0x..."
      accentColor="#627EEA"
      currentAddress={currentAddress}
      onChange={setAddress}
      onSave={() => {
        const t = currentAddress.trim();
        if (!t) {
          setError("ETH wallet address cannot be empty.");
          return;
        }
        setError(null);
        saveMutation.mutate(t, {
          onSuccess: () => {
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
          },
          onError: (e) =>
            setError(e instanceof Error ? e.message : "Save failed."),
        });
      }}
      isPending={saveMutation.isPending}
      saved={saved}
      error={error}
      ocidPrefix="eth-settings"
    />
  );
}

function IcpSettings() {
  const { data: icpConfig } = useIcpPaymentConfig();
  const [address, setAddress] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveMutation = useSetIcpWalletAddress();
  const currentAddress =
    address !== ""
      ? address
      : (icpConfig?.walletAddress ??
        "20519ec2411bdf08e185b57d4ac10a717b30add1f7165e258198f21855e21b27");

  return (
    <CryptoAddressField
      label="Internet Computer (ICP)"
      description="Set the ICP account address shown in the ICP payment pop-up and QR code."
      placeholder="20519ec2..."
      accentColor="#3B00B9"
      currentAddress={currentAddress}
      onChange={setAddress}
      onSave={() => {
        const t = currentAddress.trim();
        if (!t) {
          setError("ICP account address cannot be empty.");
          return;
        }
        setError(null);
        saveMutation.mutate(t, {
          onSuccess: () => {
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
          },
          onError: (e) =>
            setError(e instanceof Error ? e.message : "Save failed."),
        });
      }}
      isPending={saveMutation.isPending}
      saved={saved}
      error={error}
      ocidPrefix="icp-settings"
    />
  );
}

function CryptoSettings() {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
        data-ocid="crypto-settings.toggle"
      >
        <span className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <span>₿</span> Crypto Settings (BTC · ETH · ICP)
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-3 bg-white" style={SECTION_STYLE}>
          <p className="text-xs text-gray-500 mb-4">
            Edit the wallet addresses used in the crypto payment pop-ups. These
            are shown alongside the QR codes so customers can send the exact
            amount.
          </p>
          <BitcoinSettings />
          <EthereumSettings />
          <IcpSettings />
        </div>
      )}
    </div>
  );
}

// ─── Sub-section wrapper ──────────────────────────────────────────────────────

function SubSection({
  title,
  children,
}: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-800">{title}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-3 bg-white" style={SECTION_STYLE}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function AdminPaymentOptionsManager() {
  const { data: countries = [], isLoading: countriesLoading } =
    usePaymentCountries();
  const [showAddCountry, setShowAddCountry] = useState(false);
  const [expandedCountryId, setExpandedCountryId] = useState<string | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");

  const sortedCountries = [...countries].sort(
    (a, b) => Number(a.sortOrder) - Number(b.sortOrder),
  ) as PaymentCountryWithContinent[];

  // ── Search filtering ──────────────────────────────────────────────────────
  const trimmedSearch = searchTerm.trim().toLowerCase();
  const isSearching = trimmedSearch.length > 0;

  const matchingCountries = isSearching
    ? sortedCountries.filter((c) =>
        c.name.toLowerCase().includes(trimmedSearch),
      )
    : [];

  // Group by continent (only used when NOT searching)
  const grouped: Record<string, PaymentCountryWithContinent[]> = {};
  for (const c of sortedCountries) {
    const key: string = c.continent ?? "Other";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(c);
  }

  // Render continents in canonical order, only those that have countries
  const continentsWithCountries = CONTINENTS.filter(
    (cont) => grouped[cont]?.length,
  );
  // Also show "Other" if there are countries without a continent set
  const otherCountries = grouped.Other ?? [];

  return (
    <div className="space-y-1 text-gray-900" style={SECTION_STYLE}>
      <CryptoSettings />

      <p className="text-sm text-gray-500 mb-4">
        Configure the two-step payment selector shown under SC Signed 1st
        Edition. Countries are grouped by continent — click a continent to
        expand it, then click a country to manage its payment methods.
      </p>

      <SubSection title={`Countries (${sortedCountries.length})`}>
        <p className="text-xs text-gray-500 mb-3">
          Countries are grouped by continent. Click a continent header to expand
          it, then click any country to configure its payment methods.
        </p>

        {/* ── Search bar ────────────────────────────────────────────────── */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-black placeholder:text-gray-400"
            placeholder="Search country…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-ocid="payment-country-search-input"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
              aria-label="Clear search"
              data-ocid="payment-country-search-clear"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {countriesLoading ? (
          <div className="flex items-center gap-2 py-3">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            <span className="text-xs text-gray-500">Loading countries…</span>
          </div>
        ) : sortedCountries.length === 0 ? (
          <p
            className="text-sm text-gray-400 italic py-2"
            data-ocid="payment-countries-empty-state"
          >
            No countries yet. Add one below.
          </p>
        ) : isSearching ? (
          /* ── Search results — flat list, details expanded ───────────── */
          <div className="mb-3 space-y-2">
            {matchingCountries.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-2">
                No countries match &ldquo;{searchTerm}&rdquo;.
              </p>
            ) : (
              matchingCountries.map((c) => (
                <CountryListItem
                  key={c.id}
                  country={c}
                  allCountries={sortedCountries as PaymentCountry[]}
                  isExpanded={true}
                  onToggle={() =>
                    setExpandedCountryId((prev) =>
                      prev === c.id ? null : c.id,
                    )
                  }
                />
              ))
            )}
          </div>
        ) : (
          /* ── Normal grouped continent view ──────────────────────────── */
          <div className="mb-3">
            {continentsWithCountries.map((continent) => (
              <ContinentGroup
                key={continent}
                continent={continent}
                countries={grouped[continent]}
                allCountries={sortedCountries as PaymentCountry[]}
                expandedCountryId={expandedCountryId}
                onToggleCountry={(id) =>
                  setExpandedCountryId((prev) => (prev === id ? null : id))
                }
              />
            ))}
            {otherCountries.length > 0 &&
              !continentsWithCountries.includes("Other") && (
                <ContinentGroup
                  key="Other"
                  continent="Other"
                  countries={otherCountries}
                  allCountries={sortedCountries as PaymentCountry[]}
                  expandedCountryId={expandedCountryId}
                  onToggleCountry={(id) =>
                    setExpandedCountryId((prev) => (prev === id ? null : id))
                  }
                />
              )}
          </div>
        )}

        {showAddCountry ? (
          <AddCountryForm onDone={() => setShowAddCountry(false)} />
        ) : (
          <button
            type="button"
            onClick={() => setShowAddCountry(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors"
            data-ocid="add-payment-country-btn"
          >
            <Plus className="w-3.5 h-3.5" /> Add Country
          </button>
        )}
      </SubSection>
    </div>
  );
}
