import React, { useState, useEffect } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { api } from '@/services/auth.service';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface TranslationModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumes: any[];
  targetLanguages: any[];
}

export default function TranslationModal({ isOpen, onClose, resumes, targetLanguages }: TranslationModalProps) {
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [targetLanguageId, setTargetLanguageId] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isOpen && targetLanguages.length === 1) {
      setTargetLanguageId(targetLanguages[0].id || targetLanguages[0]);
    }
  }, [isOpen, targetLanguages]);

  if (!isOpen) return null;

  const handleTranslate = async () => {
    if (!selectedResumeId || !targetLanguageId) {
      toast.error('Выберите резюме и язык для перевода');
      return;
    }

    setIsTranslating(true);
    try {
      const response = await api.post('/api/resumes/' + selectedResumeId + '/translate/', {
        target_language_id: targetLanguageId
      });
      toast.success('Резюме успешно переведено!');
      router.push('/resumes/' + response.data.resume_id + '/edit');
    } catch (err: any) {
      toast.error('Ошибка перевода: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="text-blue-600" size={24} />
            AI Перевод резюме
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <p className="text-gray-600 text-lg">
            Для отклика на эту вакансию требуется резюме на следующем языке:
            <span className="font-bold underline text-blue-600 ml-1">
              {targetLanguages.map((l: any) => l.title || l).join(', ')}
            </span>. 
            <br/><br/>
            Вы можете создать новое резюме вручную или перевести существующее с помощью ИИ прямо сейчас.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Выберите резюме для перевода:</label>
              <select 
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                value={selectedResumeId}
                onChange={e => setSelectedResumeId(e.target.value)}
              >
                <option value="">-- Выберите резюме --</option>
                {resumes.map(r => (
                  <option key={r.id} value={r.id}>{r.career_objective || r.position || 'Резюме без должности'}</option>
                ))}
              </select>
            </div>

            {targetLanguages.length > 1 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">На какой язык перевести?</label>
                <select 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                  value={targetLanguageId}
                  onChange={e => setTargetLanguageId(e.target.value)}
                >
                  <option value="">-- Выберите язык --</option>
                  {targetLanguages.map((l: any) => (
                    <option key={l.id || l} value={l.id || l}>{l.title || l}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={() => router.push('/resumes/create')}
            className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition-colors"
          >
            Создать новое
          </button>
          <button
            onClick={handleTranslate}
            disabled={isTranslating}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isTranslating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Переводим...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Перевести с ИИ
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
