import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmpx-api-loader': any;
      'gmp-map': any;
      'gmpx-place-picker': any;
      'gmp-advanced-marker': any;
    }
  }
}

interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  isNegative: boolean;
}

interface BusinessInfo {
  name: string;
  address: string;
  rating: number;
  totalReviews: number;
  location?: {
    lat: number;
    lng: number;
  };
}

export function BusinessSearchReviews() {
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const placePickerRef = useRef<any>(null);

  // Wait for Google Maps to load
  useEffect(() => {
    const checkGoogleMaps = async () => {
      // Wait for the custom elements to be defined
      try {
        await customElements.whenDefined('gmp-map');
        await customElements.whenDefined('gmpx-place-picker');
        await customElements.whenDefined('gmpx-api-loader');

        // Small delay to ensure everything is ready
        setTimeout(() => {
          setMapLoaded(true);
        }, 100);
      } catch (error) {
        console.error('Error loading Google Maps components:', error);
        // Retry after a delay
        setTimeout(checkGoogleMaps, 500);
      }
    };

    // Check if script is already loaded
    const existingScript = document.querySelector('script[src*="googlemaps/extended-component-library"]');

    if (existingScript) {
      checkGoogleMaps();
    } else {
      // Load the extended component library
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://ajax.googleapis.com/ajax/libs/@googlemaps/extended-component-library/0.6.11/index.min.js';
      script.onload = () => checkGoogleMaps();
      document.head.appendChild(script);
    }
  }, []);

  // Set up place picker listener
  useEffect(() => {
    if (!mapLoaded || !placePickerRef.current) return;

    const initMap = async () => {
      await customElements.whenDefined('gmp-map');
      await customElements.whenDefined('gmpx-place-picker');

      const map = mapRef.current;
      const marker = markerRef.current;
      const placePicker = placePickerRef.current;

      if (!map || !marker || !placePicker) return;

      // Configure map
      if (map.innerMap) {
        map.innerMap.setOptions({
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
      }

      // Listen for place changes
      placePicker.addEventListener('gmpx-placechange', async () => {
        const place = placePicker.value;

        if (!place.location) {
          return;
        }

        setIsLoading(true);

        // Update map
        if (place.viewport && map.innerMap) {
          map.innerMap.fitBounds(place.viewport);
        } else if (place.location) {
          map.center = place.location;
          map.zoom = 17;
        }

        marker.position = place.location;

        // Get real reviews from the place data
        const placeReviews: Review[] = [];

        if (place.reviews && place.reviews.length > 0) {
          place.reviews.forEach((review: any, index: number) => {
            placeReviews.push({
              id: `review-${index}`,
              author: review.authorAttribution?.displayName || 'Anonymous',
              rating: review.rating || 0,
              text: review.text?.text || review.text || 'No review text',
              date: review.relativePublishTimeDescription || 'Recently',
              isNegative: review.rating <= 3,
            });
          });
        }

        // Extract real rating
        const placeRating = place.rating || 0;
        const totalReviews = place.userRatingCount || placeReviews.length;

        setBusinessInfo({
          name: place.displayName || place.name || 'Unknown Business',
          address: place.formattedAddress || place.shortFormattedAddress || 'Address not available',
          rating: placeRating,
          totalReviews: totalReviews,
          location: {
            lat: place.location.lat,
            lng: place.location.lng,
          },
        });

        setReviews(placeReviews);
        setIsLoading(false);
      });
    };

    initMap();
  }, [mapLoaded]);

  const toggleReviewSelection = (reviewId: string) => {
    const newSelected = new Set(selectedReviews);
    if (newSelected.has(reviewId)) {
      newSelected.delete(reviewId);
    } else {
      newSelected.add(reviewId);
    }
    setSelectedReviews(newSelected);
  };

  const handleRemoveReviews = () => {
    if (selectedReviews.size === 0) return;

    // Scroll to the Starter Access plan (first plan)
    const plansSection = document.querySelector('.plans-section');
    if (plansSection) {
      plansSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const negativeReviews = reviews.filter(r => r.isNegative);
  const positiveReviews = reviews.filter(r => !r.isNegative);

  return (
    <>
      <style>{`
        gmp-map {
          width: 100%;
          height: 500px;
          display: block;
        }

        @media (max-width: 640px) {
          gmp-map {
            height: 300px;
          }
        }

        .place-picker-container {
          padding: 20px;
        }

        gmpx-place-picker {
          width: 100%;
        }
      `}</style>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="max-w-5xl mx-auto mb-16"
      >
        <div className="glass-card rounded-2xl p-4 sm:p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Check Your Business Reviews</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Search for your business on the map to see and manage your online reputation
          </p>
        </div>

        {/* Map Container */}
        {mapLoaded ? (
          <div className="mb-8 rounded-xl overflow-hidden border border-white/10 relative">
            <gmp-map
              ref={mapRef}
              center="40.749933,-73.98633"
              zoom="13"
            >
              <div slot="control-block-start-inline-start" className="place-picker-container">
                <gmpx-place-picker
                  ref={placePickerRef}
                  placeholder="Search for your business..."
                />
              </div>
              <gmp-advanced-marker ref={markerRef} />
            </gmp-map>

            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="flex items-center gap-3 bg-white/10 px-6 py-3 rounded-lg">
                  <div className="w-5 h-5 border-2 border-[#0ea5e9] border-t-transparent rounded-full animate-spin" />
                  <span className="text-white font-semibold">Loading business data...</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-8 rounded-xl overflow-hidden border border-white/10 h-[300px] sm:h-[500px] flex items-center justify-center bg-white/5">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-[#0ea5e9] border-t-transparent rounded-full animate-spin" />
              <span className="text-white font-semibold">Loading map...</span>
            </div>
          </div>
        )}

        {/* Business Info & Reviews */}
        <AnimatePresence>
          {businessInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Business Card */}
              <div className="bg-white/5 rounded-xl p-4 sm:p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold mb-2">{businessInfo.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{businessInfo.address}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(businessInfo.rating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-lg font-bold">{businessInfo.rating}</span>
                      <span className="text-sm text-muted-foreground">
                        ({businessInfo.totalReviews} reviews)
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:gap-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <ThumbsDown className="w-4 h-4 text-red-400" />
                        <span className="text-2xl font-bold text-red-400">{negativeReviews.length}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Bad Reviews</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <ThumbsUp className="w-4 h-4 text-green-400" />
                        <span className="text-2xl font-bold text-green-400">{positiveReviews.length}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Good Reviews</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                {reviews.map((review) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => toggleReviewSelection(review.id)}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      selectedReviews.has(review.id)
                        ? 'bg-[#0ea5e9]/20 border-2 border-[#0ea5e9]'
                        : review.isNegative
                        ? 'bg-red-500/10 border border-red-500/20'
                        : 'bg-green-500/10 border border-green-500/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-sm">{review.author}</span>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">{review.date}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.text}</p>
                      </div>
                      {selectedReviews.has(review.id) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-6 h-6 rounded-full bg-[#0ea5e9] flex items-center justify-center flex-shrink-0"
                        >
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Remove Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRemoveReviews}
                disabled={selectedReviews.size === 0}
                className={`w-full py-3 sm:py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  selectedReviews.size > 0
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:shadow-lg hover:shadow-red-500/50 cursor-pointer'
                    : 'bg-white/5 cursor-not-allowed opacity-50'
                }`}
              >
                <Trash2 className="w-5 h-5" />
                <span>
                  {selectedReviews.size > 0
                    ? `Remove ${selectedReviews.size} Selected Review${selectedReviews.size > 1 ? 's' : ''}`
                    : 'Select reviews to remove'}
                </span>
              </motion.button>

              {selectedReviews.size > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-sm text-muted-foreground mt-3"
                >
                  Cost: {selectedReviews.size * 2} EDGE ({selectedReviews.size} review{selectedReviews.size > 1 ? 's' : ''} × 2 EDGE)
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
    </>
  );
}
