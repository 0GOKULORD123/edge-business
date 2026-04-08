import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Search, Loader2, Star, Upload, X, ChevronRight, MapPin, FileImage } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface RemoveReviewsFormProps {
  onComplete: () => void;
  onCancel: () => void;
}

interface MockReview {
  id: string;
  reviewer: string;
  rating: number;
  text: string;
  date: string;
}

interface BusinessData {
  name: string;
  address: string;
  rating: number;
  totalReviews: number;
  placeId: string;
}

export function RemoveReviewsForm({ onComplete, onCancel }: RemoveReviewsFormProps) {
  const { user, createRequest, updateUser } = useAuth();
  const [uploadMethod, setUploadMethod] = useState<'scan' | 'manual'>('scan');
  const [step, setStep] = useState<'method' | 'input' | 'scanning' | 'results' | 'manual-upload'>('method');
  const [businessLink, setBusinessLink] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [scanResults, setScanResults] = useState<MockReview[]>([]);
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [evidenceFiles, setEvidenceFiles] = useState<{ name: string; url: string; type: string }[]>([]);
  const [manualFiles, setManualFiles] = useState<{ name: string; url: string; type: string }[]>([]);
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);

  const CREDIT_PER_REVIEW = 5; // Cost per review removal (1 review removal = $50 = 5 EDGE)

  const totalCost = uploadMethod === 'manual' ? CREDIT_PER_REVIEW : selectedReviews.length * CREDIT_PER_REVIEW;

  const handleSearchBusiness = () => {
    if (!searchQuery) {
      toast.error('Please enter a business name to search');
      return;
    }

    setStep('scanning');

    // Simulate Google Maps search and business data extraction
    setTimeout(() => {
      // Mock business data
      const mockBusiness: BusinessData = {
        name: searchQuery,
        address: '123 Main St, New York, NY 10001',
        rating: 3.2,
        totalReviews: 247,
        placeId: 'ChIJ' + Math.random().toString(36).substr(2, 9),
      };

      setBusinessData(mockBusiness);

      // Mock review data
      const mockReviews: MockReview[] = [
        {
          id: '1',
          reviewer: 'John D.',
          rating: 1,
          text: 'Terrible service. Would not recommend at all. Staff was rude and unprofessional.',
          date: '2 weeks ago',
        },
        {
          id: '2',
          reviewer: 'Sarah M.',
          rating: 2,
          text: 'Very disappointed with the quality. Not worth the price.',
          date: '1 month ago',
        },
        {
          id: '3',
          reviewer: 'Mike R.',
          rating: 1,
          text: 'Worst experience ever. Avoid this place!',
          date: '3 weeks ago',
        },
        {
          id: '4',
          reviewer: 'Lisa K.',
          rating: 2,
          text: 'Poor customer service. Long wait times and unhelpful staff.',
          date: '1 week ago',
        },
        {
          id: '5',
          reviewer: 'Tom B.',
          rating: 1,
          text: 'Complete waste of money. Do not trust this business.',
          date: '4 days ago',
        },
      ];

      setScanResults(mockReviews);
      setStep('results');
    }, 3000);
  };

  const toggleReview = (reviewId: string) => {
    setSelectedReviews((prev) =>
      prev.includes(reviewId) ? prev.filter((id) => id !== reviewId) : [...prev, reviewId]
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = files.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type,
    }));
    setEvidenceFiles([...evidenceFiles, ...newFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setEvidenceFiles(evidenceFiles.filter((_, i) => i !== index));
  };

  const handleManualFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = files.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type,
    }));
    setManualFiles([...manualFiles, ...newFiles]);
  };

  const handleRemoveManualFile = (index: number) => {
    setManualFiles(manualFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (uploadMethod === 'scan') {
      if (selectedReviews.length === 0) {
        toast.error('Please select at least one review');
        return;
      }

      if (user.credits < totalCost) {
        toast.error('Insufficient credits');
        return;
      }

      const selectedReviewData = scanResults.filter((r) => selectedReviews.includes(r.id));

      // Create request
      await createRequest({
        type: 'remove',
        status: 'awaiting_agent',
        creditsUsed: totalCost,
        businessLink: searchQuery,
        selectedReviews: selectedReviewData,
        evidenceFiles,
        uploadMethod: 'scan',
        businessData,
        messages: [],
      });
    } else {
      // Manual upload
      if (manualFiles.length === 0) {
        toast.error('Please upload at least one screenshot');
        return;
      }

      if (user.credits < CREDIT_PER_REVIEW) {
        toast.error('Insufficient credits');
        return;
      }

      // Create request with manual files
      await createRequest({
        type: 'remove',
        status: 'awaiting_agent',
        creditsUsed: CREDIT_PER_REVIEW,
        manualFiles,
        uploadMethod: 'manual',
        messages: [],
      });
    }

    // Deduct credits
    await updateUser({ credits: user.credits - totalCost });

    toast.success('Request submitted successfully!');
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl glass-card rounded-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold neon-text">Remove Reviews</h2>
          <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* Step: Method Selection */}
          {step === 'method' && (
            <motion.div
              key="method"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-bold mb-4">Select Removal Method</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Google Maps Search */}
                  <button
                    onClick={() => {
                      setUploadMethod('scan');
                      setStep('input');
                    }}
                    className="group p-6 rounded-xl border-2 border-white/10 hover:border-[#0ea5e9] bg-white/5 hover:bg-white/10 transition-all text-left"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#0ea5e9] to-[#8b5cf6] flex items-center justify-center mb-4 neon-glow">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-bold mb-2">Google Maps Search</h4>
                    <p className="text-sm text-muted-foreground">
                      Search for your business on Google Maps, select it, and we'll scan for negative reviews to remove.
                    </p>
                  </button>

                  {/* Manual Upload */}
                  <button
                    onClick={() => {
                      setUploadMethod('manual');
                      setStep('manual-upload');
                    }}
                    className="group p-6 rounded-xl border-2 border-white/10 hover:border-[#0ea5e9] bg-white/5 hover:bg-white/10 transition-all text-left"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#0ea5e9] to-[#8b5cf6] flex items-center justify-center mb-4 neon-glow">
                      <FileImage className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-bold mb-2">Manual Upload</h4>
                    <p className="text-sm text-muted-foreground">
                      Upload screenshots of reviews you want removed. Highlight the reviews in your images.
                    </p>
                    <div className="mt-3 text-xs text-[#0ea5e9]">{CREDIT_PER_REVIEW} EDGE per submission</div>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step: Input (Google Maps Search) */}
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm mb-2">Search for Your Business on Google Maps</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter business name..."
                    className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] outline-none transition-all"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchBusiness()}
                  />
                  <button
                    onClick={handleSearchBusiness}
                    className="px-6 py-3 bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] hover:shadow-lg hover:shadow-[#0ea5e9]/50 rounded-lg transition-all font-semibold flex items-center gap-2"
                  >
                    <Search className="w-5 h-5" />
                    Search
                  </button>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-sm text-muted-foreground">
                  Enter your business name to search on Google Maps. We'll find your business and scan all reviews.
                </p>
              </div>

              <button
                onClick={() => setStep('method')}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                Back
              </button>
            </motion.div>
          )}

          {/* Step: Manual Upload */}
          {step === 'manual-upload' && (
            <motion.div
              key="manual-upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm mb-3">Upload Screenshots</label>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload screenshots of the reviews you want removed. Highlight or circle the specific reviews in your images.
                </p>
                <input
                  type="file"
                  onChange={handleManualFileUpload}
                  multiple
                  accept="image/*"
                  className="hidden"
                  id="manual-upload"
                />
                <label
                  htmlFor="manual-upload"
                  className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/20 rounded-lg hover:border-[#0ea5e9] hover:bg-white/5 cursor-pointer transition-all"
                >
                  <Upload className="w-8 h-8 text-muted-foreground mb-3" />
                  <span className="text-sm text-muted-foreground mb-1">Click to upload screenshots</span>
                  <span className="text-xs text-muted-foreground">PNG, JPG, or JPEG</span>
                </label>
              </div>

              {manualFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold mb-2">Uploaded Screenshots ({manualFiles.length})</h4>
                  {manualFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        {file.type.startsWith('image/') && (
                          <img src={file.url} alt={file.name} className="w-12 h-12 object-cover rounded" />
                        )}
                        <span className="text-sm truncate flex-1">{file.name}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveManualFile(index)}
                        className="p-1 hover:bg-white/10 rounded transition-colors ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Cost Summary */}
              <div className="p-4 bg-gradient-to-r from-[#0ea5e9]/20 to-[#8b5cf6]/20 border border-[#0ea5e9]/50 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-muted-foreground">Manual Review Removal</span>
                  <span className="text-2xl font-bold text-[#0ea5e9]">{CREDIT_PER_REVIEW} EDGE</span>
                </div>
                <div className="text-right text-sm text-muted-foreground mb-2">≈ ${CREDIT_PER_REVIEW * 10} USD</div>
                <p className="text-xs text-muted-foreground">Your balance: {user?.credits || 0} EDGE credits</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('method')}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={manualFiles.length === 0 || (user ? user.credits < CREDIT_PER_REVIEW : true)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] hover:shadow-lg hover:shadow-[#0ea5e9]/50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
                >
                  Submit Request
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step: Scanning */}
          {step === 'scanning' && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12"
            >
              <div className="flex flex-col items-center justify-center text-center space-y-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#0ea5e9] to-[#8b5cf6] flex items-center justify-center neon-glow">
                    <Loader2 className="w-12 h-12 animate-spin text-white" />
                  </div>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#0ea5e9] to-[#8b5cf6] animate-ping opacity-20" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Analyzing Reviews...</h3>
                  <p className="text-muted-foreground">Scanning for negative and removable reviews</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step: Results */}
          {step === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Business Info */}
              {businessData && (
                <div className="p-4 bg-gradient-to-r from-[#0ea5e9]/10 to-[#8b5cf6]/10 rounded-lg border border-[#0ea5e9]/30">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#0ea5e9] mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{businessData.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{businessData.address}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                          <span>{businessData.rating.toFixed(1)}</span>
                        </div>
                        <span className="text-muted-foreground">{businessData.totalReviews} reviews</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Total Reviews</p>
                  <p className="text-2xl font-bold">{businessData?.totalReviews || 247}</p>
                </div>
                <div className="p-4 bg-destructive/20 border border-destructive/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Negative Reviews</p>
                  <p className="text-2xl font-bold text-destructive">{scanResults.length}</p>
                </div>
              </div>

              {/* Review List */}
              <div>
                <h3 className="text-lg font-bold mb-3">Select Reviews to Remove</h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {scanResults.map((review) => (
                    <label
                      key={review.id}
                      className={`block p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedReviews.includes(review.id)
                          ? 'border-[#0ea5e9] bg-[#0ea5e9]/10'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex gap-3">
                        <input
                          type="checkbox"
                          checked={selectedReviews.includes(review.id)}
                          onChange={() => toggleReview(review.id)}
                          className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-[#0ea5e9] focus:ring-[#0ea5e9] focus:ring-offset-0"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{review.reviewer}</span>
                            <span className="text-xs text-muted-foreground">{review.date}</span>
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-white/20'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground">{review.text}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Cost Summary */}
              {selectedReviews.length > 0 && (
                <div className="p-4 bg-gradient-to-r from-[#0ea5e9]/20 to-[#8b5cf6]/20 border border-[#0ea5e9]/50 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-muted-foreground">
                      {selectedReviews.length} review(s) × {CREDIT_PER_REVIEW} EDGE
                    </span>
                    <span className="text-2xl font-bold text-[#0ea5e9]">{totalCost} EDGE</span>
                  </div>
                  <div className="text-right text-sm text-muted-foreground mb-2">
                    ≈ ${totalCost * 10} USD
                  </div>
                  <p className="text-xs text-muted-foreground">Your balance: {user?.credits || 0} EDGE credits</p>
                </div>
              )}

              {/* Evidence Upload */}
              <div>
                <label className="block text-sm mb-3">Supporting Evidence (Optional)</label>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                  id="evidence-upload"
                />
                <label
                  htmlFor="evidence-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-lg hover:border-[#0ea5e9] hover:bg-white/5 cursor-pointer transition-all"
                >
                  <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Upload evidence, documents, or notes</span>
                </label>
              </div>

              {evidenceFiles.length > 0 && (
                <div className="space-y-2">
                  {evidenceFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-sm truncate flex-1">{file.name}</span>
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="p-1 hover:bg-white/10 rounded transition-colors ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('input')}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={selectedReviews.length === 0 || (user ? user.credits < totalCost : true)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] hover:shadow-lg hover:shadow-[#0ea5e9]/50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
                >
                  Submit Request
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
