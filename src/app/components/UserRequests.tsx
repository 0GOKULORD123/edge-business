import React, { useState, useEffect } from 'react';
import { useAuth, ReviewRequest } from '../contexts/AuthContext';
import { FileText, Clock, CheckCircle, XCircle, Loader2, MessageSquare, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export function UserRequests() {
  const { user, getRequests, addRequestMessage } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<ReviewRequest | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadRequests();
    }
  }, [user]);

  const loadRequests = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userRequests = await getRequests(user.id);
      setRequests(userRequests);
    } catch (error) {
      console.error('Failed to load requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

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
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedRequest || !user) return;

    try {
      await addRequestMessage(selectedRequest.id, messageInput, 'user');
      setMessageInput('');
      toast.success('Message sent to admin');

      // Refresh the selected request
      const updatedRequests = await getRequests(user.id);
      const updatedRequest = updatedRequests.find(r => r.id === selectedRequest.id);
      if (updatedRequest) {
        setSelectedRequest(updatedRequest);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };

  const unreadMessages = (request: ReviewRequest) => {
    return request.messages?.filter(m => m.from === 'admin').length || 0;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-16 h-16 text-[#0ea5e9] mx-auto mb-4 animate-spin" />
        <p className="text-muted-foreground">Loading requests...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground">No requests yet</p>
        <p className="text-sm text-muted-foreground mt-2">Create your first request to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
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
                  {request.type === 'add' ? 'Add Reviews' : 'Remove Reviews'}
                </h3>
                <p className="text-sm text-muted-foreground">{formatDate(request.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadMessages(request) > 0 && (
                <span className="px-2 py-1 bg-[#0ea5e9] rounded-full text-xs font-semibold">
                  {unreadMessages(request)} new
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(request.status)}`}>
                {getStatusLabel(request.status)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
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
                <div>
                  <span className="text-muted-foreground">Business Link:</span>
                  <p className="font-medium truncate">{request.businessLink}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Reviews to Remove:</span>
                  <p className="font-medium">{request.selectedReviews?.length || 0}</p>
                </div>
              </>
            )}
            <div>
              <span className="text-muted-foreground">Credits Used:</span>
              <p className="font-medium text-[#0ea5e9]">{request.creditsUsed}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <p className="font-medium">{getStatusLabel(request.status)}</p>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Request Detail Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl glass-card rounded-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold neon-text">
                    {selectedRequest.type === 'add' ? 'Add Reviews Request' : 'Remove Reviews Request'}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">{formatDate(selectedRequest.createdAt)}</p>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Timeline */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  {['submitted', 'awaiting_agent', 'accepted', 'processing', 'completed'].map((status, idx) => (
                    <React.Fragment key={status}>
                      <div className="flex flex-col items-center flex-1">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            selectedRequest.status === status
                              ? 'bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] neon-glow'
                              : ['submitted', 'awaiting_agent', 'accepted', 'processing', 'completed'].indexOf(selectedRequest.status) > idx
                              ? 'bg-[#0ea5e9]/50'
                              : 'bg-white/10'
                          }`}
                        >
                          {getStatusIcon(status as ReviewRequest['status'])}
                        </div>
                        <span className="text-xs text-muted-foreground mt-2 text-center">
                          {getStatusLabel(status as ReviewRequest['status'])}
                        </span>
                      </div>
                      {idx < 4 && (
                        <div
                          className={`h-1 flex-1 ${
                            ['submitted', 'awaiting_agent', 'accepted', 'processing', 'completed'].indexOf(selectedRequest.status) > idx
                              ? 'bg-[#0ea5e9]'
                              : 'bg-white/10'
                          }`}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Request Details */}
              <div className="space-y-6">
                <div className="p-4 bg-white/5 rounded-lg space-y-3">
                  {selectedRequest.type === 'add' && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Business Name</span>
                        <span className="font-medium">{selectedRequest.businessName}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Business Link</span>
                        <a href={selectedRequest.businessLink} target="_blank" rel="noopener noreferrer" className="font-medium text-[#0ea5e9] hover:underline truncate max-w-xs">
                          {selectedRequest.businessLink}
                        </a>
                      </div>
                      {selectedRequest.location && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Location</span>
                          <span className="font-medium">{selectedRequest.location}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Review Count</span>
                        <span className="font-medium">{selectedRequest.reviewCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Review Tone</span>
                        <span className="font-medium">{selectedRequest.reviewTone}</span>
                      </div>
                      {selectedRequest.keywords && selectedRequest.keywords.length > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Keywords</span>
                          <div className="flex flex-wrap gap-1 max-w-xs justify-end">
                            {selectedRequest.keywords.map((kw, idx) => (
                              <span key={idx} className="px-2 py-1 bg-[#0ea5e9]/20 rounded text-xs">{kw}</span>
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
                    </>
                  )}

                  {selectedRequest.type === 'remove' && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Business Link</span>
                        <a href={selectedRequest.businessLink} target="_blank" rel="noopener noreferrer" className="font-medium text-[#0ea5e9] hover:underline truncate max-w-xs">
                          {selectedRequest.businessLink}
                        </a>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Reviews to Remove</span>
                        <span className="font-medium">{selectedRequest.selectedReviews?.length || 0}</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between text-sm pt-3 border-t border-white/10">
                    <span className="text-muted-foreground">Credits Used</span>
                    <span className="font-medium text-[#0ea5e9]">{selectedRequest.creditsUsed}</span>
                  </div>
                </div>

                {/* Messages */}
                <div>
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Agent Communication
                  </h3>
                  
                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                    {selectedRequest.messages && selectedRequest.messages.length > 0 ? (
                      selectedRequest.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-3 rounded-lg ${
                            msg.from === 'admin'
                              ? 'bg-[#0ea5e9]/20 border border-[#0ea5e9]/50'
                              : 'bg-white/5'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold">
                              {msg.from === 'admin' ? 'EDGE Agent' : 'You'}
                            </span>
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
                      placeholder="Send a message to the agent..."
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
      </AnimatePresence>
    </div>
  );
}
