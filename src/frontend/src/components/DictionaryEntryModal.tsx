import React from "react";
import type { DictionaryEntry } from "../backend";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { ScrollArea } from "../components/ui/scroll-area";

interface DictionaryEntryModalProps {
  entry: DictionaryEntry;
  isOpen: boolean;
  onClose: () => void;
}

export default function DictionaryEntryModal({
  entry,
  isOpen,
  onClose,
}: DictionaryEntryModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-white p-6 rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold adobe-jenson">
            {entry.word}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-700">
                Meaning
              </h3>
              <p className="text-gray-900 leading-relaxed">{entry.meaning}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-700">
                Etymology
              </h3>
              <p className="text-gray-900 leading-relaxed">{entry.etymology}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-700">
                Examples
              </h3>
              <div className="text-gray-900 leading-relaxed whitespace-pre-line">
                {entry.examples}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
