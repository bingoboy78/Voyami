"use client";

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { FileText, Download, Share2, Pin, HardDrive, Plus, Loader2 } from 'lucide-react';
import { uploadDocumentAction } from './actions';

interface Document {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  category: string;
  isOfflineAvailable: boolean;
  uploadedBy: {
    name: string;
  };
  createdAt: Date;
}

const docCategories = [
  { id: 'all', name: 'Все' },
  { id: 'TICKETS', name: 'Билеты' },
  { id: 'HOTELS', name: 'Отели' },
  { id: 'TRANSPORT', name: 'Транспорт' },
  { id: 'OTHER', name: 'Прочее' }
];

export function DocumentsClient({ initialDocs }: { initialDocs: Document[] }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(initialDocs[0]?.id || null);
  const [docs, setDocs] = useState(initialDocs);
  const [uploadCategory, setUploadCategory] = useState('OTHER');
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDocs(initialDocs);
    if (initialDocs.length > 0 && !selectedDocId) {
      setSelectedDocId(initialDocs[0].id);
    }
  }, [initialDocs]);

  const filteredDocs = activeCategory === 'all'
    ? docs
    : docs.filter(d => d.category === activeCategory);

  const selectedDoc = docs.find(d => d.id === selectedDocId) || docs[0];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', uploadCategory);

    // Optimistically add the file to the catalog list
    const tempId = String(Date.now());
    const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
    const optimisticDoc: Document = {
      id: tempId,
      title: file.name.replace(/\.[^/.]+$/, ""),
      fileName: file.name,
      fileType: ext === 'PDF' ? 'PDF' : 'IMG',
      category: uploadCategory,
      isOfflineAvailable: true,
      uploadedBy: { name: 'Алина (загрузка...)' },
      createdAt: new Date()
    };

    setDocs(prev => [optimisticDoc, ...prev]);
    setSelectedDocId(tempId);

    try {
      const realDoc = await uploadDocumentAction(formData);
      if (realDoc) {
        setDocs(prev => prev.map(d => d.id === tempId ? (realDoc as any) : d));
        setSelectedDocId(realDoc.id);
      }
    } catch (err) {
      console.error('Failed to upload file:', err);
      alert('Ошибка при загрузке файла');
      // Revert optimistic insert
      setDocs(prev => prev.filter(d => d.id !== tempId));
      if (initialDocs.length > 0) {
        setSelectedDocId(initialDocs[0].id);
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleShare = async () => {
    if (!selectedDoc) return;
    const url = window.location.origin + (selectedDoc.fileName.startsWith('http') || selectedDoc.fileName.startsWith('/uploads/') ? selectedDoc.fileName : `/uploads/${selectedDoc.fileName}`);
    if (navigator.share) {
      try {
        await navigator.share({
          title: selectedDoc.title,
          url: url
        });
      } catch (err) {
        console.log(err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        alert('Ссылка на документ скопирована в буфер обмена!');
      } catch (err) {
        console.error(err);
        alert('Ссылка на документ: ' + url);
      }
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'TICKETS': return 'Билеты';
      case 'HOTELS': return 'Отель';
      case 'TRANSPORT': return 'Транспорт';
      case 'OTHER': return 'Прочее';
      default: return 'Документ';
    }
  };

  const getDocIconText = (title: string, category: string) => {
    if (category === 'TICKETS') return 'FLY';
    if (category === 'HOTELS') {
      if (title.toLowerCase().includes('berat') || title.toLowerCase().includes('mangalemi')) return 'BER';
      return 'HTL';
    }
    if (category === 'TRANSPORT') {
      if (title.toLowerCase().includes('car') || title.toLowerCase().includes('авто')) return 'CAR';
      return 'BUS';
    }
    return 'INS';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr] gap-5 items-start">
      {/* Left Vault panel */}
      <div className="bg-surface border border-border rounded-[20px] shadow-soft p-5">
        <div className="mb-5">
          <h2 className="font-display font-[780] text-2xl tracking-[-0.02em] m-0">Документы поездки</h2>
          <p className="text-text-secondary text-sm m-0 mt-1">Travel vault для PDF, билетов, ваучеров и скриншотов</p>
        </div>

        {/* Upload Block */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-[18px] rounded-[18px] border border-dashed border-primary/30 bg-primary/5 mb-5">
          <div className="flex-1 w-full">
            <h4 className="font-display font-[760] text-[16px] m-0 text-text-primary">Добавить файл или скриншот</h4>
            <p className="text-text-secondary text-[13px] m-0 mt-1 mb-3">PDF, изображения ваучеров, билеты, брони, страховки и практические файлы.</p>
            <div className="flex gap-2 w-full max-w-xs">
              <select 
                value={uploadCategory} 
                onChange={(e) => setUploadCategory(e.target.value)}
                className="bg-surface border border-border text-text-primary text-xs rounded-xl p-2 w-full outline-none focus:border-primary/40"
              >
                <option value="OTHER">Прочее</option>
                <option value="TICKETS">Билеты</option>
                <option value="HOTELS">Отели</option>
                <option value="TRANSPORT">Транспорт</option>
                <option value="INSURANCE">Страховка</option>
              </select>
            </div>
          </div>
          <div className="shrink-0 w-full sm:w-auto">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept=".pdf,image/*" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={cn(
                "w-full sm:w-auto px-4 py-2.5 rounded-[13px] bg-primary text-primary-foreground font-[800] hover:opacity-90 transition-opacity text-sm flex items-center justify-center gap-1.5 shrink-0",
                isUploading && "opacity-50 cursor-not-allowed"
              )}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Загрузка...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Прикрепить
                </>
              )}
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {docCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-3 py-2 rounded-full border text-xs font-medium transition-all duration-150",
                activeCategory === cat.id
                  ? "bg-primary/5 border-primary/30 text-primary"
                  : "bg-surface border-border text-text-secondary hover:bg-surface-elevated"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Documents Grid */}
        {filteredDocs.length === 0 ? (
          <div className="p-8 text-center bg-surface border border-border rounded-[20px] text-text-secondary text-sm">
            В этом разделе пока нет документов.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredDocs.map((doc) => (
              <div key={doc.id} className="bg-surface border border-border rounded-[20px] shadow-soft p-[18px] flex flex-col justify-between h-[280px]">
                <div>
                  <div className="h-[130px] rounded-[17px] border border-border bg-gradient-to-br from-surface-elevated to-primary/5 flex items-center justify-center relative overflow-hidden mb-3">
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-surface border border-border font-mono font-extrabold text-[10px] text-text-primary">
                      {doc.fileType}
                    </span>
                    {doc.isOfflineAvailable && (
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-ok/10 border border-ok/20 font-mono font-extrabold text-[10px] text-ok">
                        Офлайн
                      </span>
                    )}
                    <div className="w-14 h-14 rounded-2xl bg-surface border border-border shadow-sm flex items-center justify-center font-mono font-[850] text-sm text-text-primary">
                      {getDocIconText(doc.title, doc.category)}
                    </div>
                  </div>
                  <h4 className="font-display font-[760] text-[15px] leading-tight text-text-primary m-0 truncate">
                    {doc.title}
                  </h4>
                  <p className="text-text-secondary text-[12px] m-0 mt-1 truncate">{doc.fileName}</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <button 
                    onClick={() => setSelectedDocId(doc.id)}
                    className={cn(
                      "flex-1 px-3 py-1.5 rounded-[13px] font-semibold text-xs transition-colors",
                      selectedDocId === doc.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface-elevated text-text-primary border border-border hover:bg-border"
                    )}
                  >
                    Открыть
                  </button>
                  <a 
                    href={doc.fileName.startsWith('http') || doc.fileName.startsWith('/uploads/') ? doc.fileName : `/uploads/${doc.fileName}`}
                    download={doc.title}
                    className="px-2 py-1.5 rounded-[13px] bg-surface text-text-secondary border border-border hover:bg-surface-elevated transition-colors text-xs flex items-center justify-center"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Preview Panel */}
      {selectedDoc ? (
        <div className="bg-surface-elevated border border-border rounded-[20px] shadow-soft p-5 sticky top-5 grid gap-4 animate-fade-in">
          <div>
            <div className="font-mono font-extrabold text-[11px] tracking-[0.12em] uppercase text-text-secondary">
              Выбранный документ
            </div>
            <h3 className="font-display font-[760] text-xl leading-snug mt-2 mb-1 text-text-primary truncate">
              {selectedDoc.title}
            </h3>
            <p className="text-text-secondary text-xs m-0">
              {selectedDoc.fileType}-документ. Загружен пользователем {selectedDoc.uploadedBy.name}.
            </p>
          </div>

          {/* Visual PDF/IMG content preview */}
          <div className="h-[200px] border border-border rounded-[16px] bg-gradient-to-b from-white to-[#f6f8fc] dark:from-slate-800 dark:to-slate-900 p-4 relative overflow-hidden">
            <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 w-2/5 mb-3"></div>
            <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 w-[90%] mb-3"></div>
            <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 w-[75%] mb-3"></div>
            <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 w-[30%] mb-3"></div>
            <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 w-[85%] mb-3"></div>
            <div className="absolute right-4.5 bottom-4.5 px-2.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 font-mono font-extrabold text-[11px] text-primary">
              {selectedDoc.fileType} PREVIEW
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <span className="px-2.5 py-1 rounded-full border border-border bg-surface text-text-secondary text-xs">
              {getCategoryLabel(selectedDoc.category)}
            </span>
            <span className="px-2.5 py-1 rounded-full border border-border bg-surface text-text-secondary text-xs">
              {selectedDoc.fileType}
            </span>
            <span className="px-2.5 py-1 rounded-full border border-border bg-surface text-text-secondary text-xs">
              {new Date(selectedDoc.createdAt).toLocaleDateString('ru')}
            </span>
          </div>

          <div className="grid gap-2.5 border-t border-border pt-4">
            {selectedDoc.isOfflineAvailable && (
              <div className="flex gap-3 items-center">
                <HardDrive className="w-4 h-4 text-ok" />
                <div>
                  <strong className="block text-xs font-semibold text-text-primary">Сохранён локально</strong>
                  <span className="block text-[11px] text-text-secondary">Можно открыть без сети в дороге.</span>
                </div>
              </div>
            )}
            <div className="flex gap-3 items-center">
              <Pin className="w-4 h-4 text-primary" />
              <div>
                <strong className="block text-xs font-semibold text-text-primary">Доступен всем</strong>
                <span className="block text-[11px] text-text-secondary">Все участники группы могут просматривать файл.</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <a 
              href={selectedDoc.fileName.startsWith('http') || selectedDoc.fileName.startsWith('/uploads/') ? selectedDoc.fileName : `/uploads/${selectedDoc.fileName}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-2 rounded-[13px] bg-primary text-primary-foreground font-[800] text-sm hover:opacity-90 transition-opacity text-center flex items-center justify-center"
            >
              Открыть полностью
            </a>
            <a 
              href={selectedDoc.fileName.startsWith('http') || selectedDoc.fileName.startsWith('/uploads/') ? selectedDoc.fileName : `/uploads/${selectedDoc.fileName}`}
              download={selectedDoc.title}
              className="px-3 py-2 rounded-[13px] bg-surface text-text-primary border border-border hover:bg-surface-elevated transition-colors text-sm flex items-center justify-center"
            >
              <Download className="w-4 h-4" />
            </a>
            <button 
              onClick={handleShare}
              className="px-3 py-2 rounded-[13px] bg-surface text-text-primary border border-border hover:bg-surface-elevated transition-colors text-sm"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-[20px] p-5 text-center text-text-secondary text-sm">
          Выберите файл для предпросмотра
        </div>
      )}
    </div>
  );
}
