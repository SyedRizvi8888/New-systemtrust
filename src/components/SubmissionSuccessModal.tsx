"use client";

import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from "@/components/ui/alert-dialog";
import { CheckCircle2, MapPin, Mail, Clock } from "lucide-react";
import Link from "next/link";

interface SubmissionSuccessModalProps {
  open: boolean;
  onClose: () => void;
  type: 'found' | 'lost' | 'claim';
  studentEmail?: string;
}

export function SubmissionSuccessModal({ open, onClose, type, studentEmail }: SubmissionSuccessModalProps) {
  const getContent = () => {
    switch (type) {
      case 'found':
        return {
          title: 'Report submitted successfully!',
          description: 'Thank you for reporting this found item.',
          steps: [
            {
              icon: MapPin,
              title: 'Bring to Main Office',
              text: 'Please bring the found item to the main office/help desk as soon as possible.',
            },
            {
              icon: Mail,
              title: 'Office will store it',
              text: 'The office will store and manage the item. You\'ll receive email confirmation.',
            },
            {
              icon: Clock,
              title: 'Status updates',
              text: 'Watch your email at ' + studentEmail + ' for updates when items are claimed or picked up.',
            },
          ],
          action: 'Browse items',
          actionHref: '/search',
        };
      case 'lost':
        return {
          title: 'Lost item report submitted!',
          description: 'Your report has been sent to the office for review.',
          steps: [
            {
              icon: Mail,
              title: 'Check your email',
              text: 'The office will review possible matches and may contact you at ' + studentEmail + '.',
            },
            {
              icon: Clock,
              title: 'Check office for urgent items',
              text: 'If your item is urgent, visit the main office right away. They may have it already!',
            },
            {
              icon: MapPin,
              title: 'Bring any proof',
              text: 'If you find photos of your item online, bring them to the office to speed up verification.',
            },
          ],
          action: 'View your reports',
          actionHref: '/claims',
        };
      case 'claim':
        return {
          title: 'Claim submitted!',
          description: 'Your ownership proof has been sent to the office.',
          steps: [
            {
              icon: Mail,
              title: 'Office will review',
              text: 'The office will verify your proof. You may be contacted at ' + studentEmail + ' for additional information.',
            },
            {
              icon: Clock,
              title: 'Pick up instructions',
              text: 'If approved, the office will email you pickup instructions and an available time slot.',
            },
            {
              icon: MapPin,
              title: 'Bring ID to office',
              text: 'Please bring a valid school ID when picking up your item.',
            },
          ],
          action: 'Track your claim',
          actionHref: '/claims',
        };
    }
  };

  const content = getContent();
  const StepComponent = ({ icon: Icon, title, text }: { icon: any; title: string; text: string }) => (
    <div className="flex gap-3 mb-4">
      <Icon className="h-5 w-5 text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
      <div>
        <p className="font-medium text-foreground text-sm">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{text}</p>
      </div>
    </div>
  );

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <AlertDialogTitle className="text-center">{content.title}</AlertDialogTitle>
          <AlertDialogDescription className="text-center mx-auto">
            {content.description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4 space-y-2 max-h-48 overflow-y-auto">
          {content.steps.map((step, idx) => (
            <StepComponent key={idx} icon={step.icon} title={step.title} text={step.text} />
          ))}
        </div>

        <AlertDialogFooter>
          <Link href={content.actionHref} className="w-full">
            <AlertDialogAction className="w-full bg-green-600 hover:bg-green-700 text-white">
              {content.action}
            </AlertDialogAction>
          </Link>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
