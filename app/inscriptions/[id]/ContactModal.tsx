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

interface ContactModalProps {
  inscriptionId: string;
}

interface ContactData {
  inscriptionId: string;
  subject: string;
  message: string;
}

function useContactSubmission() {
  return useMutation({
    mutationFn: async (data: ContactData) => {
      const res = await fetch("/api/contact-inscription", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erreur lors de l'envoi du message");
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success("Votre message a été envoyé avec succès !");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function ContactModal({inscriptionId}: ContactModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const contactMutation = useContactSubmission();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !message.trim()) {
      toast.error("Veuillez remplir tous les champs");
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
          className="bg-blue-600 hover:bg-blue-700 text-white hover:text-white shadow-md flex items-center gap-2 w-24 cursor-pointer"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="hidden md:inline">Contact</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[95vw] md:w-full max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            Poser une question
          </DialogTitle>
          <div className="text-sm text-gray-600 mt-2">
            Votre message sera envoyé à Philippe Martin et J.M Agnellet.
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Sujet</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Sujet de votre question..."
              disabled={contactMutation.isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Décrivez votre question ou commentaire..."
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
              Annuler
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
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
