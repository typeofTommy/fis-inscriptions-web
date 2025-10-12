"use client";

import React, {useState} from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {MessageCircle, Send, Loader2} from "lucide-react";
import {useMutation} from "@tanstack/react-query";
import {toast} from "sonner";
import {useTranslations} from "next-intl";

interface ContactModalProps {
  inscriptionId: string;
}

interface ContactData {
  inscriptionId: string;
  subject: string;
  message: string;
}

function useContactSubmission(successMessage: string, errorMessage: string) {
  return useMutation({
    mutationFn: async (data: ContactData) => {
      const res = await fetch("/api/contact-inscription", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || errorMessage);
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success(successMessage);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function ContactModal({inscriptionId}: ContactModalProps) {
  const t = useTranslations("modals.contact");
  const tCommon = useTranslations("common");

  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const contactMutation = useContactSubmission(t("success"), t("sendError"));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !message.trim()) {
      toast.error(t("fillAllFields"));
      return;
    }

    await contactMutation.mutateAsync({
      inscriptionId,
      subject: subject.trim(),
      message: message.trim(),
    });

    // Reset form and close modal on success
    if (!contactMutation.isError) {
      setSubject("");
      setMessage("");
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-blue-600 hover:bg-blue-700 text-white hover:text-white shadow-md flex items-center gap-2 md:w-24 cursor-pointer"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="hidden md:inline">{t("buttonText")}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[95vw] md:w-full max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            {t("title")}
          </DialogTitle>
          <div className="text-sm text-gray-600 mt-2">
            {t("description")}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">{t("subject")}</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t("subjectPlaceholder")}
              disabled={contactMutation.isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">{t("message")}</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("messagePlaceholder")}
              rows={4}
              disabled={contactMutation.isPending}
              required
              className="resize-none"
            />
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={contactMutation.isPending}
              className="order-2 sm:order-1"
            >
              {tCommon("actions.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={
                contactMutation.isPending || !subject.trim() || !message.trim()
              }
              className="order-1 sm:order-2 bg-blue-600 hover:bg-blue-700"
            >
              {contactMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("sending")}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {t("send")}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
