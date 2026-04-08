import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, Upload, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface Review {
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

export function RemoveReviewsPage() {
  const { user, createRequest, updateUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [manualFiles, setManualFiles] = useState<File[]>([]);
  const [manualReviewCount, setManualReviewCount] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const CREDIT_PER_REVIEW = 5;

  // Google Maps search using Places API
  const handleSearchBusiness = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a business name');
      return;
    }

    setSearching(true);
    setBusinessData(null);
    setReviews([]);
    setSelectedReviews([]);

    try {
      // TODO: Integrate with Google Maps Places API
      // For now, show a message that this needs API integration
      toast.info('Google Maps integration pending - Admin will configure API');

      // Simulate search delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // This is where real Google Maps API call would go
      // const service = new google.maps.places.PlacesService(map);
      // service.findPlaceFromQuery({ query: searchQuery, fields: ['name', 'place_id', 'formatted_address'] }, callback);

      toast.error('Google Maps API not configured. Please contact admin to set up API access.');
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search business');
    } finally {
      setSearching(false);
    }
  };

  const toggleReviewSelection = (reviewId: string) => {
    setSelectedReviews(prev =>
      prev.includes(reviewId)
        ? prev.filter(id => id !== reviewId)
        : [...prev, reviewId]
    );
  };

  const handleManualFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setManualFiles(prev => [...prev, ...files]);
  };

  const removeManualFile = (index: number) => {
    setManualFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitGoogleMapsRequest = async () => {
    if (!user || !businessData) return;

    if (selectedReviews.length === 0) {
      toast.error('Please select at least one review to remove');
      return;
    }

    const totalCost = selectedReviews.length * CREDIT_PER_REVIEW;

    if (user.credits < totalCost) {
      toast.error(`Insufficient credits. Need ${totalCost} EDGE credits`);
      return;
    }

    setSubmitting(true);

    try {
      const selectedReviewsData = reviews.filter(r => selectedReviews.includes(r.id));

      // Create removal request
      await createRequest({
        type: 'remove',
        status: 'submitted',
        creditsUsed: totalCost,
        uploadMethod: 'scan',
        businessData: businessData,
        selectedReviews: selectedReviewsData,
      });

      // Deduct credits
      await updateUser({ credits: user.credits - totalCost });

      toast.success('Review removal request submitted!');

      // Reset form
      setBusinessData(null);
      setReviews([]);
      setSelectedReviews([]);
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to submit request:', error);
      toast.error('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitManualRequest = async () => {
    if (!user) return;

    if (manualFiles.length === 0) {
      toast.error('Please upload at least one screenshot');
      return;
    }

    if (!manualReviewCount || manualReviewCount < 1) {
      toast.error('Please specify number of reviews to remove');
      return;
    }

    const totalCost = manualReviewCount * CREDIT_PER_REVIEW;

    if (user.credits < totalCost) {
      toast.error(`Insufficient credits. Need ${totalCost} EDGE credits`);
      return;
    }

    setSubmitting(true);

    try {
      // TODO: Upload files to Supabase Storage
      // For now, store file metadata
      const fileMetadata = manualFiles.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size,
        url: '', // Will be populated after Supabase Storage upload
      }));

      // Create removal request
      await createRequest({
        type: 'remove',
        status: 'submitted',
        creditsUsed: totalCost,
        uploadMethod: 'manual',
        manualFiles: fileMetadata,
        reviewCount: manualReviewCount,
      });

      // Deduct credits
      await updateUser({ credits: user.credits - totalCost });

      toast.success(`Manual review removal request submitted! ${totalCost} EDGE deducted.`);

      // Reset form
      setManualFiles([]);
      setManualReviewCount(1);
    } catch (error) {
      console.error('Failed to submit request:', error);
      toast.error('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Google Maps Section */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <MapPin className="w-6 h-6 text-[#0ea5e9]" />
          <h3 className="text-xl font-bold">Search Business on Google Maps</h3>
        </div>

        {/* Search Input */}
        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchBusiness()}
              placeholder="Enter business name (e.g., 'Starbucks New York')"
              className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] outline-none transition-all"
            />
            <button
              onClick={handleSearchBusiness}
              disabled={searching || !searchQuery.trim()}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] hover:shadow-lg hover:shadow-[#0ea5e9]/50 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {searching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </button>
          </div>

          {/* Google Maps Embed Placeholder */}
          <div className="relative w-full h-96 rounded-lg bg-white/5 border border-white/10 overflow-hidden">
            {businessData ? (
              <div className="w-full h-full">
                {/* TODO: Embed actual Google Maps iframe */}
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Google Maps will be displayed here</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <MapPin className="w-16 h-16 text-muted-foreground opacity-30 mb-4" />
                <p className="text-muted-foreground">Search for a business to view on map</p>
              </div>
            )}
          </div>

          {/* Business Info & Reviews */}
          <AnimatePresence>
            {businessData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {/* Business Details */}
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <h4 className="font-bold text-lg mb-2">{businessData.name}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{businessData.address}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-yellow-500">★ {businessData.rating}</span>
                    <span className="text-muted-foreground">{businessData.totalReviews} reviews</span>
                  </div>
                </div>

                {/* Reviews List */}
                {reviews.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg">Select Reviews to Remove</h4>
                    {reviews.map((review) => (
                      <motion.div
                        key={review.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedReviews.includes(review.id)
                            ? 'bg-[#0ea5e9]/10 border-[#0ea5e9]'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                        onClick={() => toggleReviewSelection(review.id)}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedReviews.includes(review.id)}
                            onChange={() => {}}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold">{review.reviewer}</span>
                              <span className="text-yellow-500">{'★'.repeat(review.rating)}</span>
                              <span className="text-sm text-muted-foreground">{review.date}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{review.text}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {/* Submit Button */}
                    {selectedReviews.length > 0 && (
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-muted-foreground">
                            {selectedReviews.length} review{selectedReviews.length > 1 ? 's' : ''} selected
                          </span>
                          <span className="font-bold text-[#0ea5e9]">
                            {selectedReviews.length * CREDIT_PER_REVIEW} EDGE
                          </span>
                        </div>
                        <button
                          onClick={handleSubmitGoogleMapsRequest}
                          disabled={submitting}
                          className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] hover:shadow-lg hover:shadow-[#0ea5e9]/50 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submitting ? (
                            <span className="flex items-center justify-center gap-2">
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Submitting...
                            </span>
                          ) : (
                            'Submit Removal Request'
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Manual Screenshot Upload Section */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Upload className="w-6 h-6 text-[#0ea5e9]" />
          <h3 className="text-xl font-bold">Manual Screenshot Upload</h3>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload screenshots of the reviews you want to remove. Our admin will review your request and may ask for additional information through the messaging system.
          </p>

          {/* Review Count Input */}
          <div>
            <label htmlFor="reviewCount" className="block text-sm mb-2 font-semibold">
              Number of Reviews to Remove *
            </label>
            <input
              id="reviewCount"
              type="number"
              min="1"
              value={manualReviewCount}
              onChange={(e) => setManualReviewCount(parseInt(e.target.value) || 1)}
              placeholder="Enter number of reviews"
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] outline-none transition-all"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Cost: {manualReviewCount} review{manualReviewCount > 1 ? 's' : ''} × {CREDIT_PER_REVIEW} EDGE = <span className="font-bold text-[#0ea5e9]">{manualReviewCount * CREDIT_PER_REVIEW} EDGE</span>
            </p>
          </div>

          {/* File Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center cursor-pointer hover:border-[#0ea5e9] hover:bg-white/5 transition-all"
          >
            <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="font-semibold mb-1">Click to upload screenshots</p>
            <p className="text-sm text-muted-foreground">PNG, JPG, or PDF (Max 10MB each)</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handleManualFileChange}
              className="hidden"
            />
          </div>

          {/* Uploaded Files List */}
          {manualFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Uploaded Files ({manualFiles.length})</h4>
              {manualFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    {file.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-white/10 rounded flex items-center justify-center">
                        <Upload className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeManualFile(index)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}

              {/* Submit Manual Request */}
              <div className="p-4 bg-white/5 rounded-lg border border-white/10 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-sm text-muted-foreground block">
                      {manualReviewCount} review{manualReviewCount > 1 ? 's' : ''} to remove
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {CREDIT_PER_REVIEW} EDGE per review
                    </span>
                  </div>
                  <span className="font-bold text-[#0ea5e9] text-xl">{manualReviewCount * CREDIT_PER_REVIEW} EDGE</span>
                </div>
                <button
                  onClick={handleSubmitManualRequest}
                  disabled={submitting || manualReviewCount < 1}
                  className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] hover:shadow-lg hover:shadow-[#0ea5e9]/50 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    'Submit Manual Request'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Info Note */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-400">
                <p className="font-semibold mb-1">Note:</p>
                <p>
                  Admin may request additional evidence or information through the messaging system.
                  Please highlight which specific review(s) you want removed in your screenshots.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
