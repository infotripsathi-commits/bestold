import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import {
  getConversationsByUser,
  getMessagesByConversation,
  sendMessage,
  markConversationAsRead,
  getUnreadByConversation,
} from '@/db/api';
import type { Conversation, Message, Profile } from '@/types';

export default function ChatPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId && conversations.length > 0) {
      const conv = conversations.find(c => c.id === conversationId);
      if (conv) {
        setSelectedConversation(conv);
      }
    }
  }, [searchParams, conversations]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages();
      markAsRead();
      const unsubscribe = subscribeToMessages();
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      const convs = await getConversationsByUser(user.id);
      setConversations(convs);

      // Load unread counts
      const unreadData = await getUnreadByConversation();
      const unreadMap: Record<string, number> = {};
      unreadData.forEach((item) => {
        unreadMap[item.conversation_id] = item.unread_count;
      });
      setUnreadCounts(unreadMap);

      if (convs.length > 0 && !selectedConversation) {
        setSelectedConversation(convs[0]);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!selectedConversation) return;

    try {
      const msgs = await getMessagesByConversation(selectedConversation.id);
      setMessages(msgs);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const markAsRead = async () => {
    if (!selectedConversation) return;

    try {
      await markConversationAsRead(selectedConversation.id);
      // Update unread counts
      setUnreadCounts((prev) => ({
        ...prev,
        [selectedConversation.id]: 0,
      }));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const subscribeToMessages = () => {
    if (!selectedConversation) return;

    const channel = supabase
      .channel(`messages:${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          
          // Fetch sender profile
          const { data: sender } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newMsg.sender_id)
            .maybeSingle();

          const senderProfile = sender as Profile | null;
          setMessages((prev) => [...prev, { ...newMsg, sender: senderProfile || undefined }]);

          // Show browser notification if message is from someone else
          if (user && newMsg.sender_id !== user.id) {
            showNotification(senderProfile?.full_name || 'Someone', newMsg.content);
            // Mark as read since user is viewing the conversation
            await markConversationAsRead(selectedConversation.id);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const showNotification = (senderName: string, content: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`New message from ${senderName}`, {
        body: content.substring(0, 100),
        icon: '/favicon.ico',
        tag: 'chat-message',
      });
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !user) return;

    setSending(true);
    try {
      await sendMessage({
        conversation_id: selectedConversation.id,
        content: newMessage.trim(),
      });
      setNewMessage('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getOtherParty = (conversation: Conversation) => {
    if (!user) return null;
    return conversation.buyer_id === user.id ? conversation.seller : conversation.buyer;
  };

  if (loading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-96 bg-muted" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="container py-16">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Conversations Yet</h2>
            <p className="text-muted-foreground">
              Start a conversation by contacting a seller from a product or store page
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      <div className="container h-full py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
          {/* Conversations List */}
          <Card className="md:col-span-1">
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-8rem)]">
                <div className="p-4 border-b">
                  <h2 className="font-semibold">Messages</h2>
                </div>
                <div className="divide-y">
                  {conversations.map((conv) => {
                    const otherParty = getOtherParty(conv);
                    const unreadCount = unreadCounts[conv.id] || 0;
                    return (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv)}
                        className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                          selectedConversation?.id === conv.id ? 'bg-muted' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold line-clamp-1">
                              {otherParty?.full_name}
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {conv.store?.name}
                            </p>
                            {conv.product && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                Re: {conv.product.title}
                              </p>
                            )}
                          </div>
                          {unreadCount > 0 && (
                            <span className="ml-2 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card className="md:col-span-2 flex flex-col">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b">
                  <h2 className="font-semibold">
                    {getOtherParty(selectedConversation)?.full_name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedConversation.store?.name}
                  </p>
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isOwn = message.sender_id === user?.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              isOwn
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(message.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <form onSubmit={handleSendMessage} className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      disabled={sending}
                    />
                    <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground">Select a conversation to start messaging</p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
