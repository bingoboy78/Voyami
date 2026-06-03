"use client";

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Send, FileSignature, MessageSquarePlus, X, Loader2 } from 'lucide-react';
import { sendMessageAction, createNoteAction } from './actions';
import { useIdentity } from '@/components/layout/IdentityContext';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

interface Message {
  id: string;
  content: string;
  createdAt: Date;
  sender: {
    id?: string;
    name: string;
    initials: string;
    avatarColor: string;
  };
}

interface NotesClientProps {
  tripId: string;
  initialNotes: Note[];
  initialMessages: Message[];
}

export function NotesClient({ tripId, initialNotes, initialMessages }: NotesClientProps) {
  const { currentUser } = useIdentity();
  const [notes, setNotes] = useState(initialNotes);
  const [messages, setMessages] = useState(initialMessages);
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'notes'>('chat');
  
  // Note Modal States
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync state if initial props change (e.g. from server revalidation)
  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text) return;

    // Optimistic update
    const tempId = String(Date.now());
    const optimisticMsg: Message = {
      id: tempId,
      content: text,
      createdAt: new Date(),
      sender: {
        id: currentUser?.id,
        name: currentUser?.name || 'Гость',
        initials: currentUser?.initials || 'Г',
        avatarColor: currentUser?.avatarColor || 'oklch(56% .14 192)'
      }
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setInputText('');

    try {
      await sendMessageAction(tripId, text);
    } catch (err) {
      console.error('Failed to send message:', err);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
      alert('Ошибка при отправке сообщения');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim() || isSubmittingNote) return;

    setIsSubmittingNote(true);
    const tempId = String(Date.now());
    const optimisticNote: Note = {
      id: tempId,
      title: noteTitle,
      content: noteContent,
      createdAt: new Date()
    };

    setNotes(prev => [...prev, optimisticNote]);
    const savedTitle = noteTitle;
    const savedContent = noteContent;
    
    setNoteTitle('');
    setNoteContent('');
    setIsAddNoteOpen(false);

    try {
      await createNoteAction(tripId, savedTitle, savedContent);
    } catch (err) {
      console.error('Failed to create note:', err);
      setNotes(prev => prev.filter(n => n.id !== tempId));
      alert('Ошибка при создании заметки');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  return (
    <div className="flex flex-col gap-0">
      {/* Mobile Tab Switcher */}
      <div className="flex lg:hidden bg-surface border border-border p-1 rounded-xl mb-4">
        <button
          onClick={() => setActiveTab('chat')}
          className={cn(
            "flex-1 py-2 text-xs font-semibold rounded-lg transition-all",
            activeTab === 'chat' ? "bg-primary text-primary-foreground shadow-sm" : "text-text-secondary hover:text-text-primary"
          )}
        >
          Чат поездки
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={cn(
            "flex-1 py-2 text-xs font-semibold rounded-lg transition-all",
            activeTab === 'notes' ? "bg-primary text-primary-foreground shadow-sm" : "text-text-secondary hover:text-text-primary"
          )}
        >
          Заметки ({notes.length})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 items-start">
        {/* Left Column: Notes */}
        <div className={cn(
          "bg-surface border border-border rounded-[20px] shadow-soft p-5 grid gap-4",
          activeTab === 'notes' ? "grid" : "hidden lg:grid"
        )}>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="m-0 font-display font-[760] text-xl leading-none text-text-primary">
                Заметки
              </h3>
              <p className="m-0 mt-1 text-text-secondary text-xs">Важная информация и предложения</p>
            </div>
            <button 
              onClick={() => setIsAddNoteOpen(true)}
              className="p-2 rounded-[13px] border border-border bg-surface text-text-primary hover:bg-surface-elevated transition-colors"
            >
              <MessageSquarePlus className="w-4 h-4" />
            </button>
          </div>
          <div className="grid gap-3 max-h-[500px] overflow-y-auto pr-1">
            {notes.map((note) => (
              <div key={note.id} className="p-3.5 rounded-[16px] bg-surface-elevated border border-border">
                <h4 className="m-0 font-display font-[760] text-[15px] text-text-primary mb-2 flex items-center gap-1.5">
                  <FileSignature className="w-3.5 h-3.5 text-primary" />
                  {note.title}
                </h4>
                <p className="m-0 text-text-secondary text-[13px] leading-relaxed">{note.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Group Chat */}
        <div className={cn(
          "bg-surface border border-border rounded-[20px] shadow-soft flex flex-col h-[500px] lg:h-[650px] overflow-hidden",
          activeTab === 'chat' ? "flex" : "hidden lg:flex"
        )}>
          {/* Chat Header */}
          <div className="p-4 border-b border-border flex justify-between items-center shrink-0">
            <div>
              <strong className="block font-semibold text-text-primary text-base">Общий чат поездки</strong>
              <span className="block text-text-secondary text-xs mt-1">
                Участники комментируют и предлагают. Владелец редактирует маршрут.
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
              {messages.length} updates
            </span>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-5 overflow-y-auto bg-surface-elevated/40 grid gap-4 content-start">
            {messages.map((msg) => {
              const isOwn = currentUser ? msg.sender.id === currentUser.id : msg.sender.name === 'Алина';
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3 items-start max-w-[78%] animate-fade-in",
                    isOwn ? "ml-auto flex-row-reverse" : ""
                  )}
                >
                  {/* Avatar */}
                  <div 
                    className="w-[34px] h-[34px] rounded-[12px] flex items-center justify-center font-display font-[800] text-[11px] flex-shrink-0 text-white shadow-sm"
                    style={{ backgroundColor: msg.sender.avatarColor }}
                  >
                    {msg.sender.initials}
                  </div>

                  {/* Message Bubble */}
                  <div>
                    <div className={cn(
                      "p-3 rounded-[16px] border text-sm leading-relaxed",
                      isOwn
                        ? "bg-primary/10 border-primary/30 text-text-primary rounded-tr-none"
                        : "bg-surface border-border text-text-primary rounded-tl-none"
                    )}>
                      {msg.content}
                    </div>
                    <div className={cn("text-[10px] text-text-secondary mt-1.5", isOwn ? "text-right" : "text-left")}>
                      {isOwn ? 'Вы · ' : `${msg.sender.name} · `}
                      {new Date(msg.createdAt).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })} ✓✓
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Input Row */}
          <div className="p-4 border-t border-border bg-surface shrink-0">
            <div className="flex gap-2.5 items-end">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Написать сообщение…"
                className="flex-1 border border-border bg-surface-elevated text-text-primary rounded-[15px] p-3.5 outline-none resize-none min-h-[52px] max-h-[140px] text-sm focus:border-primary/40 transition-colors"
              />
              <button
                onClick={handleSendMessage}
                className="w-[52px] h-[52px] border-0 rounded-[16px] bg-primary text-primary-foreground font-black flex items-center justify-center shadow-md hover:opacity-90 transition-opacity shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-2 text-text-secondary text-[11px] leading-tight">
              Все могут писать комментарии. Структуру маршрута редактирует владелец.
            </div>
          </div>
        </div>
      </div>

      {/* Add Note Modal */}
      {isAddNoteOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden relative">
            {/* Header */}
            <div className="p-5 border-b border-border flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-primary" />
                <h3 className="font-display font-[780] text-lg text-text-primary m-0">Новая заметка</h3>
              </div>
              <button
                onClick={() => setIsAddNoteOpen(false)}
                className="p-1 rounded-lg text-text-tertiary hover:bg-surface-elevated hover:text-text-primary transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitNote} className="p-5 space-y-4">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">Заголовок</label>
                <input
                  type="text"
                  required
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Например: Пароли от Wi-Fi"
                  className="w-full border border-border bg-surface-elevated text-text-primary rounded-[15px] px-3.5 py-2.5 outline-none text-sm focus:border-primary/40 transition-colors"
                />
              </div>

              {/* Content */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">Содержимое</label>
                <textarea
                  required
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Введите текст заметки..."
                  rows={4}
                  className="w-full border border-border bg-surface-elevated text-text-primary rounded-[15px] px-3.5 py-2.5 outline-none text-sm focus:border-primary/40 transition-colors resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddNoteOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-border bg-surface hover:bg-surface-elevated text-text-primary font-semibold rounded-[15px] text-sm transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNote}
                  className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-[15px] text-sm flex items-center justify-center gap-1.5 shadow-md hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSubmittingNote ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Создание...
                    </>
                  ) : (
                    'Создать'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

