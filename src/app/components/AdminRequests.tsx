import React, { useState, useEffect } from 'react';
import { useAuth, ReviewRequest } from '../contexts/AuthContext';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Send,
  Check,
  AlertCircle,
  Play,
  Star,
  Image as ImageIcon,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export function AdminRequests() {
  const { getRequests, updateRequest, addRequestMessage } = useAuth();
  const [selectedType, setSelectedType] = useState<'add' | 'remove' | 'all'>('all');
  const [selectedRequest, setSelectedRequest] = useState<ReviewRequest | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [allRequests, setAllRequests] = useState<ReviewRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const requests = await getRequests();
      setAllRequests(requests);
    } catch (error) {
      console.error('Failed to load requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests =
    selectedType === 'all' ? allRequests : allRequests.filter((r) => r.type === selectedType);

  const getStatusIcon = (status: ReviewRequest['status']) => {
    switch (status) {
      case 'submitted':
      case 'awaiting_agent':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'accepted':
      case 'processing':
        return <Loader2 className="w-5 h-5 text-[#0ea5e9] animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-destructive" />;
    }
  };

  const getStatusColor = (status: ReviewRequest['status']) => {
    switch (status) {
      case 'submitted':
      case 'awaiting_agent':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
      case 'accepted':
      case 'processing':
        return 'bg-[#0ea5e9]/20 text-[#0ea5e9] border-[#0ea5e9]/50';
      case 'completed':
        return 'bg-green-500/20 text-green-500 border-green-500/50';
      case 'failed':
        return 'bg-destructive/20 text-destructive border-destructive/50';
    }
  };

  const getStatusLabel = (status: ReviewRequest['status']) => {
    return status.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleStatusChange = async (requestId: string, newStatus: ReviewRequest['status']) => {
    try {
      await updateRequest(requestId, { status: newStatus });
      toast.success(`Request status updated to ${getStatusLabel(newStatus)}`);
      if (selectedRequest?.id === requestId) {
        setSelectedRequest({ ...selectedRequest, status: newStatus });
      }
      // Reload requests
      await loadRequests();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedRequest) return;

    try {
      await addRequestMessage(selectedRequest.id, messageInput, 'admin');
      setMessageInput('');
      toast.success('Message sent to user');

      // Refresh the selected request
      const updatedRequests = await getRequests();
      const updatedRequest = updatedRequests.find((r) => r.id === selectedRequest.id);
      if (updatedRequest) {
        setSelectedRequest(updatedRequest);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };

  const stats = {
    total: allRequests.length,
    pending: allRequests.filter((r) => r.status === 'submitted' || r.status === 'awaiting_agent').length,
    processing: allRequests.filter((r) => r.status === 'accepted' || r.status === 'processing').length,
    completed: allRequests.filter((r) => r.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Requests</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Processing</p>
          <p className="text-2xl font-bold text-[#0ea5e9]">{stats.processing}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Completed</p>
          <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        {[
          { id: 'all', label: 'All Requests' },
          { id: 'add', label: 'Add Reviews' },
          { id: 'remove', label: 'Remove Reviews' },
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => setSelectedType(filter.id as any)}
            className={`px-4 py-2 rounded-lg transition-all ${
              selectedType === filter.id
                ? 'bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] neon-glow'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-16 h-16 text-[#0ea5e9] mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">Loading requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No requests found</p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-xl p-6 cursor-pointer hover:bg-white/10 transition-all"
              onClick={() => setSelectedRequest(request)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(request.status)}
                  <div>
                    <h3 className="font-bold">
                      {request.type === 'add' ? 'Add Reviews' : 'Remove Reviews'} - {request.username}
                    </h3>
                    <p className="text-sm text-muted-foreground">{formatDate(request.createdAt)}</p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(request.status)}`}
                >
                  {getStatusLabel(request.status)}
                </span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">User:</span>
                  <p className="font-medium">{request.username}</p>
                </div>
                {request.type === 'add' && (
                  <>
                    <div>
                      <span className="text-muted-foreground">Business:</span>
                      <p className="font-medium truncate">{request.businessName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Reviews:</span>
                      <p className="font-medium">{request.reviewCount}</p>
                    </div>
                  </>
                )}
                {request.type === 'remove' && (
                  <>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Reviews to Remove:</span>
                      <p className="font-medium">{request.selectedReviews?.length || 0}</p>
                    </div>
                  </>
                )}
                <div>
                  <span className="text-muted-foreground">Credits:</span>
                  <p className="font-medium text-[#0ea5e9]">{request.creditsUsed}</p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl glass-card rounded-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold neon-text mb-1">
                  {selectedRequest.type === 'add' ? 'Add Reviews Request' : 'Remove Reviews Request'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  From {selectedRequest.username} • {formatDate(selectedRequest.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Request Details */}
            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <h3 className="font-bold text-lg">Request Details</h3>
                <div className="p-4 bg-white/5 rounded-lg space-y-3">
                  {selectedRequest.type === 'add' && (
                    <>
                      <div>
                        <span className="text-sm text-muted-foreground">Business Name</span>
                        <p className="font-medium">{selectedRequest.businessName}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Business Link</span>
                        <a
                          href={selectedRequest.businessLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-[#0ea5e9] hover:underline block truncate"
                        >
                          {selectedRequest.businessLink}
                        </a>
                      </div>
                      {selectedRequest.location && (
                        <div>
                          <span className="text-sm text-muted-foreground">Location</span>
                          <p className="font-medium">{selectedRequest.location}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-sm text-muted-foreground">Review Count</span>
                        <p className="font-medium">{selectedRequest.reviewCount}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Review Tone</span>
                        <p className="font-medium">{selectedRequest.reviewTone}</p>
                      </div>
                      {selectedRequest.keywords && selectedRequest.keywords.length > 0 && (
                        <div>
                          <span className="text-sm text-muted-foreground">Keywords</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedRequest.keywords.map((kw, idx) => (
                              <span key={idx} className="px-2 py-1 bg-[#0ea5e9]/20 rounded text-xs">
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedRequest.specialInstructions && (
                        <div>
                          <span className="text-sm text-muted-foreground">Special Instructions</span>
                          <p className="text-sm mt-1">{selectedRequest.specialInstructions}</p>
                        </div>
                      )}
                      {selectedRequest.spreadOverTime && (
                        <div className="flex items-center gap-2 text-sm text-[#0ea5e9]">
                          <Check className="w-4 h-4" />
                          Spread reviews over time
                        </div>
                      )}

                      {/* Media Files */}
                      {selectedRequest.mediaFiles && selectedRequest.mediaFiles.length > 0 && (
                        <div>
                          <span className="text-sm text-muted-foreground">Media Files ({selectedRequest.mediaFiles.length})</span>
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            {selectedRequest.mediaFiles.map((file, idx) => (
                              <div key={idx} className="aspect-square bg-white/5 rounded-lg overflow-hidden">
                                {file.type.startsWith('image/') ? (
                                  <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {selectedRequest.type === 'remove' && (
                    <>
                      <div>
                        <span className="text-sm text-muted-foreground">Business Link</span>
                        <a
                          href={selectedRequest.businessLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-[#0ea5e9] hover:underline block truncate"
                        >
                          {selectedRequest.businessLink}
                        </a>
                      </div>
                      
                      {/* Selected Reviews */}
                      {selectedRequest.selectedReviews && selectedRequest.selectedReviews.length > 0 && (
                        <div>
                          <span className="text-sm text-muted-foreground">
                            Selected Reviews ({selectedRequest.selectedReviews.length})
                          </span>
                          <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                            {selectedRequest.selectedReviews.map((review) => (
                              <div key={review.id} className="p-3 bg-white/5 rounded-lg">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-sm">{review.reviewer}</span>
                                  <div className="flex items-center gap-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-3 h-3 ${
                                          i < review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-white/20'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground">{review.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Evidence Files */}
                      {selectedRequest.evidenceFiles && selectedRequest.evidenceFiles.length > 0 && (
                        <div>
                          <span className="text-sm text-muted-foreground">
                            Evidence Files ({selectedRequest.evidenceFiles.length})
                          </span>
                          <div className="space-y-2 mt-2">
                            {selectedRequest.evidenceFiles.map((file, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2 bg-white/5 rounded-lg text-sm"
                              >
                                <span className="truncate">{file.name}</span>
                                <button className="p-1 hover:bg-white/10 rounded transition-colors">
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div className="pt-3 border-t border-white/10">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Credits Used</span>
                      <span className="font-medium text-[#0ea5e9]">{selectedRequest.creditsUsed}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions & Messages */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg">Actions</h3>
                <div className="space-y-2">
                  {selectedRequest.status === 'submitted' || selectedRequest.status === 'awaiting_agent' ? (
                    <button
                      onClick={() => handleStatusChange(selectedRequest.id, 'accepted')}
                      className="w-full px-4 py-3 bg-green-500/20 border border-green-500/50 text-green-500 hover:bg-green-500/30 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Check className="w-5 h-5" />
                      Accept Request
                    </button>
                  ) : null}

                  {selectedRequest.status === 'accepted' ? (
                    <button
                      onClick={() => handleStatusChange(selectedRequest.id, 'processing')}
                      className="w-full px-4 py-3 bg-[#0ea5e9]/20 border border-[#0ea5e9]/50 text-[#0ea5e9] hover:bg-[#0ea5e9]/30 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Play className="w-5 h-5" />
                      Start Processing
                    </button>
                  ) : null}

                  {selectedRequest.status === 'processing' ? (
                    <button
                      onClick={() => handleStatusChange(selectedRequest.id, 'completed')}
                      className="w-full px-4 py-3 bg-green-500/20 border border-green-500/50 text-green-500 hover:bg-green-500/30 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Mark as Completed
                    </button>
                  ) : null}

                  {selectedRequest.status !== 'completed' && selectedRequest.status !== 'failed' && (
                    <button
                      onClick={() => handleStatusChange(selectedRequest.id, 'failed')}
                      className="w-full px-4 py-3 bg-destructive/20 border border-destructive/50 text-destructive hover:bg-destructive/30 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <AlertCircle className="w-5 h-5" />
                      Mark as Failed
                    </button>
                  )}
                </div>

                <h3 className="font-bold text-lg pt-4">Messages</h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {selectedRequest.messages && selectedRequest.messages.length > 0 ? (
                    selectedRequest.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-lg ${
                          msg.from === 'admin'
                            ? 'bg-white/5 ml-4'
                            : 'bg-[#0ea5e9]/20 border border-[#0ea5e9]/50 mr-4'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold">{msg.from === 'admin' ? 'You' : msg.from}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(msg.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{msg.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No messages yet</p>
                  )}
                </div>

                {/* Message Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Send update to user..."
                    className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] outline-none transition-all"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] hover:shadow-lg hover:shadow-[#0ea5e9]/50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
