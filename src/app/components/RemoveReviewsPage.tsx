import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, Upload, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

// Declare Google Maps types for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmpx-api-loader': any;
      'gmp-map': any;
      'gmpx-place-picker': any;
      'gmp-advanced-marker': any;
    }
  }
  interface Window {
    google: any;
  }
}

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
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [manualFiles, setManualFiles] = useState<File[]>([]);
  const [manualReviewCount, setManualReviewCount] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<any>(null);
  const placePickerRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const CREDIT_PER_REVIEW = 5;

  // Initialize Google Maps interactions
  useEffect(() => {
    const initMap = async () => {
      await customElements.whenDefined('gmp-map');

      const map = mapRef.current;
      const marker = markerRef.current;
      const placePicker = placePickerRef.current;

      if (!map || !marker || !placePicker) return;

      const infowindow = new window.google.maps.InfoWindow();

      map.innerMap.setOptions({
        mapTypeControl: false
      });

      placePicker.addEventListener('gmpx-placechange', () => {
        const place = placePicker.value;

        if (!place.location) {
          toast.error("No details available for: '" + place.name + "'");
          infowindow.close();
          marker.position = null;
          return;
        }

        if (place.viewport) {
          map.innerMap.fitBounds(place.viewport);
        } else {
          map.center = place.location;
          map.zoom = 17;
        }

        marker.position = place.location;

        infowindow.setContent(`
          <strong>${place.displayName}</strong><br/>
          <span>${place.formattedAddress}</span>
        `);

        infowindow.open(map.innerMap, marker);

        setBusinessData({
          name: place.displayName || place.name || '',
          address: place.formattedAddress || '',
          rating: place.rating || 0,
          totalReviews: place.userRatingCount || 0,
          placeId: place.id || ''
        });

        // Extract real reviews from the place data
        const placeReviews: Review[] = [];

        if (place.reviews && place.reviews.length > 0) {
          place.reviews.forEach((review: any, index: number) => {
            placeReviews.push({
              id: `review-${index}`,
              reviewer: review.authorAttribution?.displayName || 'Anonymous',
              rating: review.rating || 0,
              text: review.text?.text || review.text || 'No review text',
              date: review.relativePublishTimeDescription || 'Recently',
            });
          });
        }

        setReviews(placeReviews);
        toast.success(`Found: ${place.displayName || place.name}`);
      });
    };

    initMap();
  }, []);


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
    <>
      <style>{`
        gmp-map {
          width: 100%;
          height: 500px;
          display: block;
        }

        .place-picker-container {
          padding: 20px;
        }
      `}</style>

      <div className="space-y-8">
        {/* Google Maps Section */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="w-6 h-6 text-[#0ea5e9]" />
            <h3 className="text-xl font-bold">Search Business on Google Maps</h3>
          </div>

          {/* Google Maps with Place Picker */}
          <div className="space-y-4">

          {/* Live Google Maps */}
          <div className="relative w-full rounded-lg overflow-hidden border border-white/10 bg-white/5">
            <gmpx-api-loader
              key="AIzaSyCdcJw0VNCxMwtiJmGu3dDsDcgnH4_0AD8"
              solution-channel="GMP_GE_mapsandplacesautocomplete_v2"
            />

            <gmp-map
              ref={mapRef}
              center="40.749933,-73.98633"
              zoom="13"
              map-id="DEMO_MAP_ID"
            >
              <div slot="control-block-start-inline-start" className="place-picker-container">
                <gmpx-place-picker
                  ref={placePickerRef}
                  placeholder="Search for your business..."
                />
              </div>
              <gmp-advanced-marker ref={markerRef} />
            </gmp-map>
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
    </>
  );
}
