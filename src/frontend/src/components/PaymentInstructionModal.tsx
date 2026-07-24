import React from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface PaymentInstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  instruction: string;
  continueUrl: string;
}

export default function PaymentInstructionModal({
  isOpen,
  onClose,
  title,
  instruction,
  continueUrl,
}: PaymentInstructionModalProps) {
  const handleContinue = () => {
    window.open(continueUrl, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border-2 border-black max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-black text-center">
            {title}
          </DialogTitle>
          <DialogDescription className="text-gray-700 text-center mt-4 text-base leading-relaxed">
            {instruction}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center mt-6">
          <Button
            onClick={handleContinue}
            className="bg-black text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
