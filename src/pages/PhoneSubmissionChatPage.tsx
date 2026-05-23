import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, ArrowLeft, X, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import {
  getPhoneSubmissionConversation,
  createPhoneSubmissionConversation,
  getMessagesByConversation,
  sendMessage,
  closePhoneSubmissionChat,
  updatePhoneSubmissionStatus,
} from '@/db/api';
import { supabase } from '@/db/supabase';
import type { Conversation, Message } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function PhoneSubmissionChatPage() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [closingChat, setClosingChat] = useState(false);
  const [chatStatus, setChatStatus] = useState<string>('active');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    loadChat();
    getCurrentUser();
  }, [submissionId]);

  useEffect(() => {
    if (conversation) {
      subscribeToMessages();
    }
  }, [conversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadChat = async () => {
    if (!submissionId) return;

    try {
      setLoading(true);
      
      // Check if conversation exists
      let conv = await getPhoneSubmissionConversation(submissionId);
      
      // If not, create one
      if (!conv) {
        const conversationId = await createPhoneSubmissionConversation(submissionId);
        conv = await getPhoneSubmissionConversation(submissionId);
      }

      setConversation(conv);

      // Load phone submission status
      const { data: submission } = await supabase
        .from('phone_submissions')
        .select('status')
        .eq('id', submissionId)
        .maybeSingle();

      if (submission) {
        const submissionData = submission as { status?: string };
        if (submissionData.status) {
          setChatStatus(submissionData.status);
        }
      }

      // Load messages
      if (conv) {
        const msgs = await getMessagesByConversation(conv.id);
        setMessages(msgs);
      }
    } catch (error: any) {
      console.error('Failed to load chat:', error);
      toast.error(error.message || 'Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    if (!conversation) return;

    const channel = supabase
      .channel(`conversation:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          
          // Fetch sender profile
          const { data: sender } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newMsg.sender_id)
            .maybeSingle();

          setMessages((prev) => [...prev, { ...newMsg, sender: sender || undefined }]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation) return;

    // Check if chat is closed
    if (chatStatus === 'closed') {
      toast.error('This chat has been closed. Please contact support if you need assistance.');
      return;
    }

    try {
      setSending(true);
      await sendMessage({
        conversation_id: conversation.id,
        content: newMessage,
      });
      setNewMessage('');
    } catch (error: any) {
      console.error('Failed to send message:', error);
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleCloseChat = async () => {
    if (!submissionId) return;

    setClosingChat(true);
    try {
      await closePhoneSubmissionChat(submissionId);
      setChatStatus('closed');
      toast.success('Chat closed successfully');
      setShowCloseDialog(false);
    } catch (error: any) {
      toast.error('Failed to close chat');
      console.error('Error closing chat:', error);
    } finally {
      setClosingChat(false);
    }
  };

  const handleReopenChat = async () => {
    if (!submissionId) return;

    try {
      await updatePhoneSubmissionStatus(submissionId, 'active');
      setChatStatus('active');
      toast.success('Chat reopened');
    } catch (error: any) {
      toast.error('Failed to reopen chat');
      console.error('Error reopening chat:', error);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-4xl py-8 space-y-4">
        <Skeleton className="h-12 w-64 bg-muted" />
        <Skeleton className="h-96 w-full bg-muted" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Chat not available</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Phone Submission Chat
                {chatStatus === 'closed' && (
                  <Badge variant="secondary">Closed</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Chat with admin about your phone submission
              </CardDescription>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2">
                {chatStatus === 'closed' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReopenChat}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reopen Chat
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowCloseDialog(true)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Close Chat
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Messages Area */}
          <div className="border rounded-lg p-4 h-96 overflow-y-auto mb-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((message) => {
                const isOwnMessage = message.sender_id === currentUserId;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {!isOwnMessage && message.sender && (
                        <div className="text-xs font-medium mb-1">
                          {message.sender.full_name || 'Admin'}
                        </div>
                      )}
                      <div className="text-sm">{message.content}</div>
                      <div className={`text-xs mt-1 ${isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {new Date(message.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={
                chatStatus === 'closed'
                  ? 'This chat is closed'
                  : 'Type your message...'
              }
              disabled={sending || chatStatus === 'closed'}
            />
            <Button 
              type="submit" 
              disabled={sending || !newMessage.trim() || chatStatus === 'closed'}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          {chatStatus === 'closed' && !isAdmin && (
            <p className="text-sm text-muted-foreground mt-2 text-center">
              This chat has been closed by the admin
            </p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close this chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This will close the chat and prevent the customer from sending new messages. 
              You can reopen it later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCloseChat}
              disabled={closingChat}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {closingChat ? 'Closing...' : 'Close Chat'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
