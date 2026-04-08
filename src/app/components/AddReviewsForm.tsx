import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ChevronRight, ChevronLeft, Upload, X, Tag, Check } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface AddReviewsFormProps {
  reviewCount: number;
  onComplete: () => void;
  onCancel: () => void;
}

export function AddReviewsForm({ reviewCount, onComplete, onCancel }: AddReviewsFormProps) {
  const { user, createRequest, updateUser } = useAuth();
  const [step, setStep] = useState(1);

  // Form data
  const [businessName, setBusinessName] = useState('');
  const [businessLink, setBusinessLink] = useState('');
  const [location, setLocation] = useState('');
  const [reviewTone, setReviewTone] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [spreadOverTime, setSpreadOverTime] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<{ name: string; url: string; type: string }[]>([]);

  const creditCost = reviewCount * 2; // 1 review = 2 EDGE (since 1 EDGE = $10 and 1 review = $20)

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = files.map(file => ({
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type,
    }));
    setMediaFiles([...mediaFiles, ...newFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!user) return;

    if (user.credits < creditCost) {
      toast.error('Insufficient credits');
      return;
    }

    // Create request
    createRequest({
      type: 'add',
      status: 'awaiting_agent',
      creditsUsed: creditCost,
      businessName,
      businessLink,
      location,
      reviewTone,
      keywords,
      specialInstructions,
      reviewCount,
      spreadOverTime,
      mediaFiles,
      messages: [],
    });

    // Deduct credits
    updateUser({ credits: user.credits - creditCost });

    toast.success('Request submitted successfully!');
    onComplete();
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return businessName && businessLink;
      case 2:
        return reviewTone;
      case 3:
        return true; // Media is optional
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl glass-card rounded-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold neon-text">Create Review Request</h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <React.Fragment key={i}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  i === step
                    ? 'bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] neon-glow'
                    : i < step
                    ? 'bg-[#0ea5e9]/50'
                    : 'bg-white/10'
                }`}
              >
                {i < step ? <Check className="w-4 h-4" /> : i}
              </div>
              {i < 4 && (
                <div className={`w-8 h-1 rounded-full ${i < step ? 'bg-[#0ea5e9]' : 'bg-white/10'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Business Details */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-xl font-bold mb-1">Business Details</h3>
                <p className="text-sm text-muted-foreground">Tell us about your business</p>
              </div>

              <div>
                <label className="block text-sm mb-2">Business Name *</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Enter business name"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Google Business Link *</label>
                <input
                  type="url"
                  value={businessLink}
                  onChange={(e) => setBusinessLink(e.target.value)}
                  placeholder="https://google.com/maps/..."
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Location (Optional)</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, State"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] outline-none transition-all"
                />
              </div>
            </motion.div>
          )}

          {/* Step 2: Review Specification */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-xl font-bold mb-1">Review Specification</h3>
                <p className="text-sm text-muted-foreground">Customize your reviews</p>
              </div>

              <div>
                <label className="block text-sm mb-2">Review Tone *</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Natural', 'Positive', 'Mixed (realistic)', 'Custom'].map((tone) => (
                    <button
                      key={tone}
                      onClick={() => setReviewTone(tone)}
                      className={`py-3 px-4 rounded-lg border transition-all text-sm ${
                        reviewTone === tone
                          ? 'border-[#0ea5e9] bg-[#0ea5e9]/10'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2">Keywords to Include</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                    placeholder="Add keyword..."
                    className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] outline-none transition-all"
                  />
                  <button
                    onClick={handleAddKeyword}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <Tag className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="px-3 py-1 bg-[#0ea5e9]/20 border border-[#0ea5e9]/50 rounded-full text-sm flex items-center gap-2"
                    >
                      {keyword}
                      <button onClick={() => handleRemoveKeyword(keyword)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2">Special Instructions</label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g., mention customer service and speed"
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] outline-none transition-all resize-none"
                />
              </div>
            </motion.div>
          )}

          {/* Step 3: Media Upload */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-xl font-bold mb-1">Media Upload</h3>
                <p className="text-sm text-muted-foreground">Upload real media to increase authenticity</p>
              </div>

              <div>
                <label className="block text-sm mb-3">Images & Videos (Optional)</label>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                  id="media-upload"
                />
                <label
                  htmlFor="media-upload"
                  className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/20 rounded-lg hover:border-[#0ea5e9] hover:bg-white/5 cursor-pointer transition-all"
                >
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Click to upload media</span>
                  <span className="text-xs text-muted-foreground mt-1">Images or videos</span>
                </label>
              </div>

              {mediaFiles.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {mediaFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-video bg-white/5 rounded-lg overflow-hidden">
                        {file.type.startsWith('image/') ? (
                          <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                        ) : (
                          <video src={file.url} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="absolute top-2 right-2 p-1 bg-destructive rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{file.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 4: Review & Submit */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-xl font-bold mb-1">Review & Submit</h3>
                <p className="text-sm text-muted-foreground">Confirm your request details</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-lg space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Business</span>
                    <span className="font-medium">{businessName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Review Count</span>
                    <span className="font-medium">{reviewCount} reviews</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Review Tone</span>
                    <span className="font-medium">{reviewTone}</span>
                  </div>
                  {keywords.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Keywords</span>
                      <span className="font-medium">{keywords.length} keywords</span>
                    </div>
                  )}
                  {mediaFiles.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Media Files</span>
                      <span className="font-medium">{mediaFiles.length} files</span>
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-3 cursor-pointer p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <input
                    type="checkbox"
                    checked={spreadOverTime}
                    onChange={(e) => setSpreadOverTime(e.target.checked)}
                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-[#0ea5e9] focus:ring-[#0ea5e9] focus:ring-offset-0"
                  />
                  <div>
                    <p className="text-sm font-medium">Spread reviews over time</p>
                    <p className="text-xs text-muted-foreground">Reviews will be posted gradually for authenticity</p>
                  </div>
                </label>

                <div className="p-4 bg-gradient-to-r from-[#0ea5e9]/20 to-[#8b5cf6]/20 border border-[#0ea5e9]/50 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">Total Cost</span>
                    <span className="text-2xl font-bold text-[#0ea5e9]">{creditCost} EDGE</span>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    ≈ ${creditCost * 10} USD
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Your balance: {user?.credits || 0} EDGE credits
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>
          )}
          
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] hover:shadow-lg hover:shadow-[#0ea5e9]/50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              Continue
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={user ? user.credits < creditCost : true}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] hover:shadow-lg hover:shadow-[#0ea5e9]/50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              Submit Request
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
