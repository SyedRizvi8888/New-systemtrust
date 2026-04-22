"use client";

import { useState, useEffect, type ChangeEvent } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { categoryLabels, categoryIcons, statusColors } from '@/lib/mockData';
import { LostItem, ClaimRequest } from '@/types';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Shield,
  Upload,
  X,
  MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { fetchItemById, createClaim, fetchItemQuestions, createItemQuestion, replyToQuestion, fetchAnsweredQuestions } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { SubmissionSuccessModal } from '@/components/SubmissionSuccessModal';

export default function ItemDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [item, setItem] = useState<LostItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [showQuestionsForm, setShowQuestionsForm] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  const [claimData, setClaimData] = useState({
    name: '',
    email: '',
    phone: '',
    proof: '',
    proofImage: '',
  });

  // Auto-populate claim form with logged-in user's info
  useEffect(() => {
    if (user && showClaimForm) {
      setClaimData(prev => ({
        ...prev,
        name: user.user_metadata?.full_name || '',
        email: user.email || '',
      }));
    }
  }, [user, showClaimForm]);

  // Load item and questions
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const found = await fetchItemById(id!);
        if (isMounted) {
          setItem(found);
          // Load questions for this item
          await loadQuestions(id);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        toast.error('Failed to load item');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    if (id) load();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const loadQuestions = async (itemId: string) => {
    try {
      setIsLoadingQuestions(true);
      const allQuestions = await fetchItemQuestions(itemId);
      setQuestions(allQuestions);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleProofImageUpload = (file: File | null | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setClaimData(d => ({ ...d, proofImage: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleProofImageInput = (event: ChangeEvent<HTMLInputElement>) => {
    handleProofImageUpload(event.target.files?.[0]);
  };

  const removeProofImage = () => {
    setClaimData(d => ({ ...d, proofImage: '' }));
  };

  const handleSubmitClaim = async () => {
    if (!item) return;

    setIsSubmitting(true);
    try {
      const newClaim: Omit<ClaimRequest, 'id' | 'submittedAt' | 'reviewedAt'> = {
        itemId: item.id,
        claimantName: claimData.name,
        claimantEmail: claimData.email,
        claimantPhone: claimData.phone || undefined,
        proofDescription: claimData.proof,
        proofImage: claimData.proofImage || undefined,
        status: 'pending',
      };

      await createClaim(newClaim);

      // Show success modal instead of just routing
      setSuccessModalOpen(true);
      setClaimData({ name: '', email: '', phone: '', proof: '', proofImage: '' });
      setShowClaimForm(false);
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error(err);
      toast.error(err.message || 'Failed to submit claim');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitQuestion = async () => {
    if (!item || !user || !questionText.trim()) {
      toast.error('Please enter a question');
      return;
    }

    try {
      setIsSubmitting(true);
      await createItemQuestion(
        item.id,
        questionText,
        user.id,
        user.user_metadata?.full_name || 'Anonymous',
        user.email || ''
      );

      toast.success('Question posted! The finder will reply soon.');
      setQuestionText('');
      setShowQuestionsForm(false);

      // Reload questions
      await loadQuestions(item.id);
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error(err);
      toast.error(err.message || 'Failed to post question');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <section className="py-12 md:py-20">
          <div className="container-wide">
            <div className="animate-pulse space-y-8">
              <div className="h-6 w-32 bg-muted rounded" />
              <div className="grid md:grid-cols-2 gap-8">
                <div className="aspect-[4/3] bg-muted rounded-2xl" />
                <div className="space-y-4">
                  <div className="h-10 w-3/4 bg-muted rounded" />
                  <div className="h-4 w-full bg-muted rounded" />
                  <div className="h-4 w-2/3 bg-muted rounded" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (!item) {
    return (
      <Layout>
        <section className="py-12 md:py-20">
          <div className="container-wide text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Item Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The item you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/search">
              <Button variant="accent">Browse All Items</Button>
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  const formattedDate = new Date(item.dateFound).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Check if user can claim this item
  const isItemCreator = user && item.createdBy === user.id;
  const isLost = item.status === 'lost';
  const canClaim = item.status === 'found' && !isItemCreator && !isAdmin;
  const locationLabel = isLost ? 'Last seen at' : 'Found at';
  const dateLabel = isLost ? 'Date reported missing' : 'Date found';
  const contactLabel = isLost ? 'Owner contact' : 'Finder contact';

  return (
    <>
      <Layout>
      <section className="py-8 md:py-12 lg:py-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 md:mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm md:text-base">Back to search</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12">
            {/* Image Section */}
            <div className="space-y-4 order-2 lg:order-1">
              <div className="aspect-[4/3] overflow-hidden rounded-xl md:rounded-2xl bg-muted shadow-md">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-6xl md:text-8xl">
                    {categoryIcons[item.category]}
                  </div>
                )}
              </div>
            </div>

            {/* Details Section */}
            <div className="space-y-6 order-1 lg:order-2">
              {/* Status & Category */}
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <span className={cn('status-badge capitalize text-xs md:text-sm', statusColors[item.status])}>
                  {item.status}
                </span>
                <span className="status-badge bg-secondary text-secondary-foreground text-xs md:text-sm">
                  {categoryIcons[item.category]} {categoryLabels[item.category]}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                {item.title}
              </h1>

              {/* Description */}
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                {item.description}
              </p>

              {/* Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 py-6 border-y border-border">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary flex-shrink-0">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-muted-foreground">{locationLabel}</p>
                    <p className="font-medium text-foreground text-sm md:text-base break-words">{item.location}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary flex-shrink-0">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-muted-foreground">{dateLabel}</p>
                    <p className="font-medium text-foreground text-sm md:text-base">{formattedDate}</p>
                  </div>
                </div>
              </div>

              {item.contactEmail && (
                <div className="p-4 rounded-2xl bg-secondary/40 border border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-1">{contactLabel}</h3>
                  <a
                    href={`mailto:${item.contactEmail}`}
                    className="text-sm text-accent hover:underline"
                  >
                    {item.contactEmail}
                  </a>
                </div>
              )}

              {/* Claim Section */}
              {canClaim && !showClaimForm && (
                <div className="p-6 rounded-2xl bg-accent/10 border border-accent/20">
                  <h3 className="font-semibold text-foreground mb-2">
                    Is this your item?
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Submit a claim request and describe how you can prove ownership.
                  </p>
                  <Button variant="accent" onClick={() => setShowClaimForm(true)} className="w-full">
                    Claim This Item
                  </Button>
                </div>
              )}

              {isLost && (
                <div className="p-6 rounded-2xl bg-warning/10 border border-warning/20">
                  <h3 className="font-semibold text-warning mb-2">
                    Missing item alert
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    This item has been reported missing. If you have seen it or have information, please reach out using the contact details above or notify campus staff immediately.
                  </p>
                </div>
              )}

              {/* Cannot Claim - User Created This Item */}
              {isItemCreator && item.status === 'found' && (
                <div className="p-6 rounded-2xl bg-warning/10 border border-warning/20">
                  <div className="flex items-start gap-3">
                    <Shield className="h-6 w-6 text-warning shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">
                        You reported this item
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        You cannot claim an item that you reported as found. This prevents fraudulent claims and ensures items go to their rightful owners.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Claim Form */}
              {showClaimForm && (
                <div className="p-6 rounded-2xl bg-card border border-border animate-fade-in">
                  <h3 className="font-semibold text-foreground mb-4">
                    Submit Your Claim
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="claim-name">Your Name *</Label>
                      <Input
                        id="claim-name"
                        placeholder="Full name"
                        value={claimData.name}
                        onChange={(e) => setClaimData(d => ({ ...d, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="claim-email">Email *</Label>
                      <Input
                        id="claim-email"
                        type="email"
                        placeholder="your.email@school.edu"
                        value={claimData.email}
                        onChange={(e) => setClaimData(d => ({ ...d, email: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="claim-phone">Phone (optional)</Label>
                      <Input
                        id="claim-phone"
                        type="tel"
                        placeholder="555-0123"
                        value={claimData.phone}
                        onChange={(e) => setClaimData(d => ({ ...d, phone: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="claim-proof">Proof of Ownership *</Label>
                      <Textarea
                        id="claim-proof"
                        placeholder="Describe unique identifiers or features that prove this item belongs to you..."
                        value={claimData.proof}
                        onChange={(e) => setClaimData(d => ({ ...d, proof: e.target.value }))}
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Supporting Photo (optional)</Label>
                      {claimData.proofImage ? (
                        <div className="relative">
                          <img
                            src={claimData.proofImage}
                            alt="Uploaded proof"
                            className="w-full h-48 object-cover rounded-xl border border-border"
                          />
                          <button
                            type="button"
                            onClick={removeProofImage}
                            className="absolute top-3 right-3 p-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                            aria-label="Remove uploaded proof image"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="relative flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-accent/50 hover:bg-accent/5 transition-colors cursor-pointer">
                          <Upload className="h-5 w-5 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">Attach a supporting photo</span>
                          <span className="text-xs text-muted-foreground">Images help staff verify ownership more quickly</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProofImageInput}
                            className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                          />
                        </label>
                      )}
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowClaimForm(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="accent"
                        onClick={handleSubmitClaim}
                        disabled={!claimData.name || !claimData.email || !claimData.proof || isSubmitting}
                        className="flex-1 gap-2"
                      >
                        {isSubmitting ? (
                          <span className="h-4 w-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        Submit Claim
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Already in non-claimable status */}
              {!isLost && !canClaim && (
                <div className="p-6 rounded-2xl bg-secondary/50 border border-border">
                  <div className="flex items-start gap-3">
                    {item.status === 'returned' ? (
                      <CheckCircle2 className="h-6 w-6 text-success shrink-0" />
                    ) : (
                      <Clock className="h-6 w-6 text-warning shrink-0" />
                    )}
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">
                        {item.status === 'returned'
                          ? 'This item has been returned'
                          : item.status === 'matched'
                          ? 'This item has an approved claim'
                          : item.status === 'under_review'
                          ? 'This item is under office review'
                          : ''}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {item.status === 'returned'
                          ? 'This item was successfully reunited with its owner.'
                          : item.status === 'matched'
                          ? 'Ownership was verified and pickup is in progress.'
                          : item.status === 'under_review'
                          ? 'Office staff is reviewing details before accepting new claims.'
                          : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Questions Section */}
        <div className="mt-12 md:mt-16 pt-8 md:pt-12 border-t border-border">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <MessageCircle className="h-6 w-6" />
            Questions ({questions.length})
          </h2>

          {/* Ask a Question Form */}
          {user && !showQuestionsForm && (
            <Button
              variant="outline"
              className="gap-2 mb-6 w-full sm:w-auto"
              onClick={() => setShowQuestionsForm(true)}
            >
              <MessageCircle className="h-4 w-4" />
              Ask a Question
            </Button>
          )}

          {showQuestionsForm && (
            <div className="bg-card border border-border rounded-xl md:rounded-2xl p-4 md:p-6 mb-6">
              <h3 className="font-semibold text-foreground mb-4 text-sm md:text-base">Ask the finder/reporter</h3>
              <Textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Ask any questions about this item..."
                rows={4}
                className="mb-4 text-sm md:text-base"
              />
              <div className="flex gap-2 flex-col sm:flex-row">
                <Button
                  size="sm"
                  className="gap-2 sm:flex-1"
                  onClick={handleSubmitQuestion}
                  disabled={!questionText.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span className="text-sm md:text-base">Post Question</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowQuestionsForm(false)}
                  className="sm:flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Questions List */}
          {isLoadingQuestions ? (
            <div className="text-center py-8 text-muted-foreground">Loading questions...</div>
          ) : questions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm md:text-base">No questions yet. Be the first to ask!</div>
          ) : (
            <div className="space-y-4">
              {questions.map((q) => (
                <div key={q.id} className="bg-card border border-border rounded-xl md:rounded-2xl p-4 md:p-6">
                  <div className="mb-4">
                    <p className="font-medium text-foreground text-sm md:text-base">{q.question_text}</p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">Asked by: {q.asked_by_name}</p>
                  </div>
                  {q.status === 'answered' && q.reply_text && (
                    <div className="bg-secondary/30 rounded-lg p-4 mt-4">
                      <p className="text-sm md:text-base text-foreground">
                        <strong>Reply from finder:</strong> {q.reply_text}
                      </p>
                      {q.replied_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Answered {new Date(q.replied_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                  {q.status === 'unanswered' && (
                    <div className="text-xs md:text-sm text-muted-foreground mt-4 italic">
                      Waiting for reply...
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      </Layout>

      <SubmissionSuccessModal
        open={successModalOpen}
        onClose={() => {
          setSuccessModalOpen(false);
          router.push('/claims');
        }}
        type="claim"
        studentEmail={claimData.email}
      />
    </>
  );
}
