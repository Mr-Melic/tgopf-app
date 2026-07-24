import React, { useState } from "react";
import { toast } from "sonner";
import { type BookSale, Quarter, type TaxRecord } from "../backend";
import {
  useAddBookSale,
  useAddTaxRecord,
  useGetBookSales,
  useGetTaxRecords,
  useUpdateBookSale,
  useUpdateTaxRecord,
} from "../hooks/useQueries";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export default function AdminBookSalesManager() {
  const { data: bookSales = [], isLoading: salesLoading } = useGetBookSales();
  const { data: taxRecords = [], isLoading: taxLoading } = useGetTaxRecords();
  const addBookSale = useAddBookSale();
  const updateBookSale = useUpdateBookSale();
  const addTaxRecord = useAddTaxRecord();
  const updateTaxRecord = useUpdateTaxRecord();

  const [maxBookNumber, setMaxBookNumber] = useState(50);
  const [customerNames, setCustomerNames] = useState<Record<number, string>>(
    {},
  );
  const [newYear, setNewYear] = useState("");
  const [newQuarter, setNewQuarter] = useState<Quarter>(Quarter.q1);
  const [salesAmounts, setSalesAmounts] = useState<Record<string, number>>({});
  const [savingQuarters, setSavingQuarters] = useState<Set<string>>(new Set());

  // Initialize customer names from backend data
  React.useEffect(() => {
    if (bookSales.length > 0) {
      const names: Record<number, string> = {};
      for (const sale of bookSales) {
        if (sale.customerName) {
          names[Number(sale.bookNumber)] = sale.customerName;
        }
      }
      setCustomerNames(names);

      // Find max book number
      const maxNum = Math.max(
        ...bookSales.map((s) => Number(s.bookNumber)),
        50,
      );
      setMaxBookNumber(maxNum);
    }
  }, [bookSales]);

  // Initialize sales amounts from backend data
  React.useEffect(() => {
    if (taxRecords.length > 0) {
      const amounts: Record<string, number> = {};
      for (const record of taxRecords) {
        const key = `${record.year}-${record.quarter}`;
        amounts[key] = Number(record.salesAmount);
      }
      setSalesAmounts(amounts);
    }
  }, [taxRecords]);

  const handleCustomerNameChange = async (bookNumber: number, name: string) => {
    setCustomerNames((prev) => ({ ...prev, [bookNumber]: name }));

    try {
      const sale: BookSale = {
        bookNumber: BigInt(bookNumber),
        customerName: name.trim() || undefined,
        salesAmount: BigInt(3939), // €39.39 in cents
      };

      const existingSale = bookSales.find(
        (s) => Number(s.bookNumber) === bookNumber,
      );
      if (existingSale) {
        await updateBookSale.mutateAsync(sale);
      } else {
        await addBookSale.mutateAsync(sale);
      }
    } catch (error) {
      console.error("Failed to save book sale:", error);
      toast.error("Failed to save customer name");
    }
  };

  const handleAddMoreBooks = () => {
    setMaxBookNumber((prev) => prev + 10);
    toast.success("Added 10 more book numbers");
  };

  const calculateTaxAmount = (numberOfBooks: number): number => {
    // Each book: €39.39, tax rate: 9%
    // Tax per book: €39.39 × 0.09 = €3.5451
    // Total tax in cents: numberOfBooks × 3.5451 × 100, rounded to nearest cent
    const taxPerBookInCents = 354.51; // €3.5451 in cents
    const totalTaxInCents = Math.round(numberOfBooks * taxPerBookInCents);
    return totalTaxInCents;
  };

  const handleSalesAmountChange = (
    year: number,
    quarter: Quarter,
    value: string,
  ) => {
    const key = `${year}-${quarter}`;
    const amount = value === "" ? 0 : Number(value);
    setSalesAmounts((prev) => ({ ...prev, [key]: amount }));
  };

  const handleSalesAmountBlur = async (year: number, quarter: Quarter) => {
    const key = `${year}-${quarter}`;
    const amount = salesAmounts[key] || 0;

    // Check if this quarter is already being saved
    if (savingQuarters.has(key)) {
      return;
    }

    setSavingQuarters((prev) => new Set(prev).add(key));

    try {
      const taxAmountInCents = calculateTaxAmount(amount);

      const record: TaxRecord = {
        year: BigInt(year),
        quarter,
        salesAmount: BigInt(amount),
        taxAmount: BigInt(taxAmountInCents),
      };

      const existingRecord = taxRecords.find(
        (r) => Number(r.year) === year && r.quarter === quarter,
      );
      if (existingRecord) {
        await updateTaxRecord.mutateAsync(record);
      } else {
        await addTaxRecord.mutateAsync(record);
      }

      toast.success(`Saved ${year} ${quarter.toUpperCase()}`);
    } catch (error) {
      console.error("Failed to save tax record:", error);
      toast.error(`Failed to save ${year} ${quarter.toUpperCase()}`);
    } finally {
      setSavingQuarters((prev) => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  const handleAddYearQuarter = () => {
    if (!newYear || Number.isNaN(Number(newYear))) {
      toast.error("Please enter a valid year");
      return;
    }

    const year = Number(newYear);
    const key = `${year}-${newQuarter}`;

    if (salesAmounts[key] !== undefined) {
      toast.error("This year and quarter already exists");
      return;
    }

    setSalesAmounts((prev) => ({ ...prev, [key]: 0 }));
    setNewYear("");
    toast.success(`Added ${year} ${newQuarter.toUpperCase()}`);
  };

  const getYearsAndQuarters = () => {
    const years = [2025, 2026];
    const quarters: Quarter[] = [
      Quarter.q1,
      Quarter.q2,
      Quarter.q3,
      Quarter.q4,
    ];
    const result: Array<{ year: number; quarter: Quarter }> = [];

    for (const year of years) {
      for (const quarter of quarters) {
        result.push({ year, quarter });
      }
    }

    // Add custom years/quarters from salesAmounts
    for (const key of Object.keys(salesAmounts)) {
      const [yearStr, quarterStr] = key.split("-");
      const year = Number(yearStr);
      const quarter = quarterStr as Quarter;
      if (!result.some((r) => r.year === year && r.quarter === quarter)) {
        result.push({ year, quarter });
      }
    }

    return result.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      const qOrder = { q1: 1, q2: 2, q3: 3, q4: 4 };
      return qOrder[a.quarter] - qOrder[b.quarter];
    });
  };

  const getTaxForQuarter = (year: number, quarter: Quarter): number => {
    const record = taxRecords.find(
      (r) => Number(r.year) === year && r.quarter === quarter,
    );
    return record ? Number(record.taxAmount) / 100 : 0;
  };

  if (salesLoading || taxLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto" />
          <p className="mt-4 text-gray-600">Loading book sales data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
      <div className="flex items-center mb-8">
        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mr-4">
          <span className="text-gray-900 text-xl">📚</span>
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Book Sales Administration
          </h2>
          <p className="text-gray-600">
            Manage manual book sales records and tax overview
          </p>
        </div>
      </div>

      {/* Book Print Numbers Section */}
      <div className="mb-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Book Print Numbers
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Assign customer names to book print numbers
        </p>

        <div className="space-y-3 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
          {Array.from({ length: maxBookNumber }, (_, i) => i + 1).map(
            (bookNumber) => (
              <div key={bookNumber} className="flex items-center gap-4">
                <Label className="w-24 text-sm font-medium text-gray-700">
                  Book #{bookNumber}
                </Label>
                <Input
                  type="text"
                  placeholder="Customer name"
                  value={customerNames[bookNumber] || ""}
                  onChange={(e) =>
                    handleCustomerNameChange(bookNumber, e.target.value)
                  }
                  className="flex-1"
                />
              </div>
            ),
          )}
        </div>

        <Button
          onClick={handleAddMoreBooks}
          className="mt-4 bg-black text-white hover:bg-gray-800"
        >
          Add 10 More Books
        </Button>
      </div>

      {/* Quarterly Tax Overview Section */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Quarterly Tax Overview
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Record sales amounts per quarter. Tax is automatically calculated at
          9% of €39.39 per book (€3.5451 each). Changes are saved when you leave
          the input field.
        </p>

        <div className="space-y-6">
          {getYearsAndQuarters().map(({ year, quarter }) => {
            const key = `${year}-${quarter}`;
            const salesAmount = salesAmounts[key] || 0;
            const taxAmount = getTaxForQuarter(year, quarter);
            const isSaving = savingQuarters.has(key);

            return (
              <div key={key} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-4 mb-2">
                  <Label className="w-32 text-sm font-semibold text-gray-900">
                    {year} {quarter.toUpperCase()}
                  </Label>
                  <div className="flex-1">
                    <Label className="text-xs text-gray-600 mb-1 block">
                      Sales Amount (books sold)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="Number of books sold"
                      value={salesAmount || ""}
                      onChange={(e) =>
                        handleSalesAmountChange(year, quarter, e.target.value)
                      }
                      onBlur={() => handleSalesAmountBlur(year, quarter)}
                      disabled={isSaving}
                      className="w-full"
                    />
                  </div>
                  <div className="w-48">
                    <Label className="text-xs text-gray-600 mb-1 block">
                      Total Tax
                    </Label>
                    <div className="text-lg font-semibold text-gray-900 bg-gray-50 rounded px-3 py-2 flex items-center justify-between">
                      <span>€{taxAmount.toFixed(2)}</span>
                      {isSaving && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add New Year/Quarter */}
        <div className="mt-6 border-t border-gray-200 pt-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">
            Add New Year/Quarter
          </h4>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label className="text-xs text-gray-600 mb-1 block">Year</Label>
              <Input
                type="number"
                min="2025"
                placeholder="e.g., 2027"
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs text-gray-600 mb-1 block">
                Quarter
              </Label>
              <Select
                value={newQuarter}
                onValueChange={(value) => setNewQuarter(value as Quarter)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Quarter.q1}>Q1</SelectItem>
                  <SelectItem value={Quarter.q2}>Q2</SelectItem>
                  <SelectItem value={Quarter.q3}>Q3</SelectItem>
                  <SelectItem value={Quarter.q4}>Q4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleAddYearQuarter}
              className="bg-black text-white hover:bg-gray-800"
            >
              Add Quarter
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
