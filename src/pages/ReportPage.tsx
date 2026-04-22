"use client";

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { categoryLabels, categoryIcons } from '@/lib/mockData';
import { ItemCategory, ContactMethod } from '@/types';
import { SubmissionSuccessModal } from '@/components/SubmissionSuccessModal';
import { 
  Upload, 
  MapPin, 
  Calendar, 
  FileText, 
  Tag, 
  CheckCircle2,
  Image as ImageIcon,
  X,
  ChevronRight,
  ChevronLeft,
  Megaphone,
  User,
  Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { createItem } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const categories: ItemCategory[] = ['electronics', 'clothing', 'accessories', 'books', 'sports', 'keys', 'wallet', 'jewelry', 'bag', 'other'];

const steps = [
  { id: 1, title: 'Category', icon: Tag },
  { id: 2, title: 'Details', icon: FileText },
  { id: 3, title: 'Location', icon: MapPin },
  { id: 4, title: 'Photo', icon: ImageIcon },
  { id: 5, title: 'Identity', icon: User },
  { id: 6, title: 'Contact', icon: Phone },
];

export default function ReportPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [reportType, setReportType] = useState<'found' | 'lost'>('found');
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    category: '' as ItemCategory | '',
    title: '',
    description: '',
    location: '',
    dateFound: new Date().toISOString().split('T')[0],
    contactEmail: '',
    studentName: '',
    studentId: '',
    grade: '',
    contactPhone: '',
    preferredContactMethod: 'email_preferred' as ContactMethod,
  });

  const isFoundReport = reportType === 'found';
  const locationLabel = isFoundReport ? 'Location Found *' : 'Last Known Location *';
  const locationPlaceholder = isFoundReport
    ? 'e.g., Library - 2nd Floor, near study rooms'
    : 'e.g., Science Lab, left on the back counter';
  const dateLabel = isFoundReport ? 'Date Found *' : 'Date Lost *';
  const summaryDateLabel = isFoundReport ? 'Date Found:' : 'Date Lost:';
  const titlePlaceholder = isFoundReport
    ? 'e.g., Blue North Face Jacket'
    : 'e.g., Lost TI-84 Calculator';
  const descriptionHelper = isFoundReport
    ? 'Describe the item in detail. Include color, size, brand, distinguishing features...'
    : 'Share identifying details and when you last had it to help others recognize your item.';
  const descriptionPlaceholder = isFoundReport
    ? 'Describe the item in detail. Include color, size, brand, distinguishing features...'
    : 'Explain how and where you last had the item, including any unique identifiers.';
  const submitLabel = isFoundReport ? 'Submit Item' : 'Post Lost Item';

  useEffect(() => {
    if (!loading && !user) {
      toast.error('Please sign in to post an item');
      router.replace('/student-login');
      return;
    }

    if (user?.email) {
      setFormData(prev => ({
        ...prev,
        contactEmail: prev.contactEmail || user.email || '',
      }));
    }
  }, [loading, user, router]);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const canProceed = () => {
    switch (currentStep) {
      case 1: return !!formData.category;
      case 2: return formData.title.length >= 3 && formData.description.length >= 10;
      case 3: return formData.location.length >= 3 && formData.dateFound;
      case 4: return true; // Photo is optional
      case 5: return formData.studentName.trim().length >= 2 && formData.studentId.trim().length >= 2; // Name and ID required
      case 6: return formData.contactEmail.trim().length > 0 && formData.grade.trim().length > 0; // Email and grade required
      default: return false;
    }
  };

  const handleSubmit = async () => {
    if (!formData.category) return;
    if (!user) {
      toast.error('Please sign in to post an item');
      router.push('/student-login');
      return;
    }
    
    // Validate all required identity fields
    if (!formData.studentName.trim() || !formData.studentId.trim() || !formData.grade.trim()) {
      toast.error('Please fill in all required identity fields');
      setCurrentStep(5);
      return;
    }

    if (!formData.contactEmail.trim()) {
      toast.error('Email is required');
      setCurrentStep(6);
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createItem({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        location: formData.location,
        dateFound: formData.dateFound,
        status: reportType,
        imageUrl: imagePreview || undefined,
        contactEmail: formData.contactEmail.trim(),
        contactPhone: formData.contactPhone || undefined,
        studentName: formData.studentName,
        studentId: formData.studentId,
        grade: formData.grade,
        preferredContactMethod: formData.preferredContactMethod,
        claimedBy: undefined,
        claimedAt: undefined,
        createdBy: user.id,
      });

      // Show success modal with context-specific instructions
      setSuccessModalOpen(true);
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error(err);
      toast.error('Failed to report item', {
        description: err.message || 'Check console for details',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <section className="py-12 md:py-20">
        <div className="container-narrow">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Share a Lost or Found Item
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Notify the community about items you have found or belongings you misplaced. Provide clear details so we can take action sooner.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-12">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                  disabled={step.id > currentStep}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-fast',
                    currentStep === step.id
                      ? 'bg-accent text-accent-foreground'
                      : currentStep > step.id
                      ? 'bg-success/15 text-success cursor-pointer hover:bg-success/25'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {currentStep > step.id ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <step.icon className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline text-sm font-medium">{step.title}</span>
                </button>
                {index < steps.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
                )}
              </div>
            ))}
          </div>

          {/* Form Container */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
            {/* Step 1: Category */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    What are you reporting?
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Choose the report type and category so we know how to handle the item.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[{ type: 'found' as const, title: 'I found an item', description: 'Let us know so we can reunite it with its owner.' }, { type: 'lost' as const, title: 'I lost an item', description: 'Share details so others can help look for it.' }].map(option => (
                    <button
                      key={option.type}
                      onClick={() => setReportType(option.type)}
                      className={cn(
                        'flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all duration-fast',
                        reportType === option.type
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border bg-background hover:border-accent/50 hover:bg-accent/5'
                      )}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        {option.type === 'found' ? <Upload className="h-5 w-5" /> : <Megaphone className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{option.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {option.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => updateField('category', cat)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-fast',
                        formData.category === cat
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border bg-background hover:border-accent/50 hover:bg-accent/5'
                      )}
                    >
                      <span className="text-2xl">{categoryIcons[cat]}</span>
                      <span className="text-sm font-medium">{categoryLabels[cat]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Details */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Describe the item
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {descriptionHelper}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Item Title *</Label>
                    <Input
                      id="title"
                      placeholder={titlePlaceholder}
                      value={formData.title}
                      onChange={(e) => updateField('title', e.target.value)}
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder={descriptionPlaceholder}
                      value={formData.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.description.length}/500 characters
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Location */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    {isFoundReport ? 'Where did you find it?' : 'Where did you lose it?'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {isFoundReport
                      ? 'Specify the location and date of discovery.'
                      : 'Share the last known location and when you noticed it was missing.'}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">{locationLabel}</Label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="location"
                        placeholder={locationPlaceholder}
                        value={formData.location}
                        onChange={(e) => updateField('location', e.target.value)}
                        className="h-12 pl-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateFound">{dateLabel}</Label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="dateFound"
                        type="date"
                        value={formData.dateFound}
                        onChange={(e) => updateField('dateFound', e.target.value)}
                        className="h-12 pl-11"
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Your Email *</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="your.email@school.edu"
                      value={formData.contactEmail}
                      onChange={(e) => updateField('contactEmail', e.target.value)}
                      className="h-12"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {isFoundReport
                        ? 'Email is required so staff can notify you when ownership is verified.'
                        : 'Email is required so staff can contact you with updates.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Photo */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Add a photo (optional)
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    A photo helps owners identify their items more easily.
                  </p>
                </div>

                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-xl"
                    />
                    <button
                      onClick={() => setImagePreview(null)}
                      className="absolute top-4 right-4 p-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="relative border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-accent/50 hover:bg-accent/5 transition-colors cursor-pointer"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      aria-label="Upload image"
                    />
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-foreground font-medium mb-1">
                      Drag and drop an image
                    </p>
                    <p className="text-sm text-muted-foreground">
                      or click to browse from your device
                    </p>
                  </div>
                )}

                {/* Summary */}
                <div className="mt-8 p-4 rounded-xl bg-secondary/50 border border-border">
                  <h3 className="font-medium text-foreground mb-3">Summary</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Report Type:</dt>
                      <dd className="font-medium capitalize">{reportType}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Category:</dt>
                      <dd className="font-medium">{formData.category ? categoryLabels[formData.category] : '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Title:</dt>
                      <dd className="font-medium truncate ml-4">{formData.title || '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Location:</dt>
                      <dd className="font-medium truncate ml-4">{formData.location || '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{summaryDateLabel}</dt>
                      <dd className="font-medium">{formData.dateFound || '-'}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Verify Your Identity *
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    This information helps the office verify and contact you about your report.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="student-name" className="text-base font-medium mb-2 block">
                      Full Name *
                    </Label>
                    <Input
                      id="student-name"
                      placeholder="e.g., Syed Rizvi"
                      value={formData.studentName}
                      onChange={(e) => updateField('studentName', e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div>
                    <Label htmlFor="student-id" className="text-base font-medium mb-2 block">
                      Student ID *
                    </Label>
                    <Input
                      id="student-id"
                      placeholder="e.g., 123456"
                      value={formData.studentId}
                      onChange={(e) => updateField('studentId', e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div>
                    <Label htmlFor="grade" className="text-base font-medium mb-2 block">
                      Grade *
                    </Label>
                    <select
                      id="grade"
                      value={formData.grade}
                      onChange={(e) => updateField('grade', e.target.value)}
                      className="w-full h-11 px-3 rounded-lg border border-input bg-background text-foreground"
                    >
                      <option value="">Select grade...</option>
                      <option value="9">9th Grade</option>
                      <option value="10">10th Grade</option>
                      <option value="11">11th Grade</option>
                      <option value="12">12th Grade</option>
                      <option value="staff">Staff</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 6 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    How should we contact you? *
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    The office will use this information to update you about your report.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="contact-email" className="text-base font-medium mb-2 block">
                      School Email *
                    </Label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="your.name@school.edu"
                      value={formData.contactEmail}
                      onChange={(e) => updateField('contactEmail', e.target.value)}
                      className="h-11"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Required for office contact</p>
                  </div>

                  <div>
                    <Label htmlFor="contact-phone" className="text-base font-medium mb-2 block">
                      Phone (optional)
                    </Label>
                    <Input
                      id="contact-phone"
                      type="tel"
                      placeholder="Leave blank if email only"
                      value={formData.contactPhone}
                      onChange={(e) => updateField('contactPhone', e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div>
                    <Label className="text-base font-medium mb-3 block">
                      Preferred Contact Method
                    </Label>
                    <div className="space-y-2">
                      {[
                        { value: 'email_preferred', label: 'Email preferred' },
                        { value: 'phone_preferred', label: 'Phone preferred (if available)' },
                      ].map((method) => (
                        <label key={method.value} className="flex items-center gap-3 p-3 rounded-lg border border-input cursor-pointer hover:bg-accent/5">
                          <input
                            type="radio"
                            name="contact-method"
                            value={method.value}
                            checked={formData.preferredContactMethod === method.value}
                            onChange={(e) => updateField('preferredContactMethod', e.target.value as ContactMethod)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm font-medium">{method.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(s => s - 1)}
                disabled={currentStep === 1}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>

              {currentStep < 4 ? (
                <Button
                  variant="accent"
                  onClick={() => setCurrentStep(s => s + 1)}
                  disabled={!canProceed()}
                  className="gap-2"
                >
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="accent"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="gap-2 min-w-32"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      {submitLabel}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <SubmissionSuccessModal 
        open={successModalOpen}
        onClose={() => {
          setSuccessModalOpen(false);
          router.push('/claims');
        }}
        type={reportType}
        studentEmail={formData.contactEmail || user?.email}
      />
    </Layout>
  );
}
