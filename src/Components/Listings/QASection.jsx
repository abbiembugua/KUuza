import React, { useState, useEffect } from 'react';
import { MessageCircle, ChevronDown, ChevronUp, Loader2, Send, CheckCircle, Pencil, Trash2, X } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000/api';

async function fetchQuestions(listingId) {
  const res = await fetch(`${API_BASE}/questions/?listing=${listingId}`);
  if (!res.ok) return [];
  return res.json();
}

async function postQuestion(listingId, question, token) {
  const res = await fetch(`${API_BASE}/questions/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ listing: listingId, question }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Could not post question');
  return data;
}

async function patchQuestion(questionId, question, token) {
  const res = await fetch(`${API_BASE}/questions/${questionId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ question }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Could not update question');
  return data;
}

async function deleteQuestion(questionId, token) {
  const res = await fetch(`${API_BASE}/questions/${questionId}/`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Could not delete question');
  }
}

async function postAnswer(questionId, answer, token) {
  const res = await fetch(`${API_BASE}/questions/${questionId}/answer/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ answer }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Could not post answer');
  return data;
}

async function patchAnswer(questionId, answer, token) {
  const res = await fetch(`${API_BASE}/questions/${questionId}/answer/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ answer }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Could not update answer');
  return data;
}

async function deleteAnswer(questionId, token) {
  const res = await fetch(`${API_BASE}/questions/${questionId}/answer/`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Could not delete answer');
  return data;
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
}

function Avatar({ name, src, size = 'w-7 h-7' }) {
  if (src) return <img src={src} alt={name} className={`${size} rounded-full object-cover flex-shrink-0`} />;
  return (
    <div className={`${size} rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center flex-shrink-0`}>
      <span className="text-white text-xs font-bold">{(name || 'K').charAt(0).toUpperCase()}</span>
    </div>
  );
}

function IconBtn({ onClick, title, children, danger = false, darkMode }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`p-1 rounded-md transition-colors ${
        danger
          ? 'text-gray-400 hover:text-red-500'
          : darkMode
            ? 'text-gray-600 hover:text-emerald-400'
            : 'text-gray-300 hover:text-emerald-600'
      }`}
    >
      {children}
    </button>
  );
}

const QASection = ({ listingId, sellerId, currentUser, token, darkMode }) => {
  const [questions,   setQuestions]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [collapsed,   setCollapsed]   = useState(false);
  const [newQ,        setNewQ]        = useState('');
  const [submittingQ, setSubmittingQ] = useState(false);
  const [answerTexts, setAnswerTexts] = useState({});
  const [submittingA, setSubmittingA] = useState({});
  const [error,       setError]       = useState('');

  // Edit/delete state
  const [editingQId,   setEditingQId]   = useState(null);
  const [editQText,    setEditQText]    = useState('');
  const [savingQEdit,  setSavingQEdit]  = useState(false);
  const [deletingQId,  setDeletingQId]  = useState(null);

  const [editingAId,   setEditingAId]   = useState(null);
  const [editAText,    setEditAText]    = useState('');
  const [savingAEdit,  setSavingAEdit]  = useState(false);
  const [deletingAId,  setDeletingAId]  = useState(null);

  const isSeller   = currentUser && String(currentUser.id) === String(sellerId);
  const isLoggedIn = !!currentUser;

  useEffect(() => {
    fetchQuestions(listingId)
      .then(setQuestions)
      .finally(() => setLoading(false));
  }, [listingId]);

  // ── Ask ──────────────────────────────────────────────────────────────────
  const handleAsk = async () => {
    const q = newQ.trim();
    if (!q) return;
    setSubmittingQ(true);
    setError('');
    try {
      const created = await postQuestion(listingId, q, token);
      setQuestions(prev => [created, ...prev]);
      setNewQ('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingQ(false);
    }
  };

  // ── Answer ───────────────────────────────────────────────────────────────
  const handleAnswer = async (questionId) => {
    const a = (answerTexts[questionId] || '').trim();
    if (!a) return;
    setSubmittingA(prev => ({ ...prev, [questionId]: true }));
    setError('');
    try {
      const updated = await postAnswer(questionId, a, token);
      setQuestions(prev => prev.map(q => q.id === questionId ? updated : q));
      setAnswerTexts(prev => ({ ...prev, [questionId]: '' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingA(prev => ({ ...prev, [questionId]: false }));
    }
  };

  // ── Edit question ────────────────────────────────────────────────────────
  const startEditQ = (q) => { setEditingQId(q.id); setEditQText(q.question); setError(''); };
  const cancelEditQ = () => { setEditingQId(null); setEditQText(''); };
  const saveEditQ = async (questionId) => {
    const text = editQText.trim();
    if (!text) return;
    setSavingQEdit(true);
    setError('');
    try {
      const updated = await patchQuestion(questionId, text, token);
      setQuestions(prev => prev.map(q => q.id === questionId ? updated : q));
      setEditingQId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingQEdit(false);
    }
  };

  // ── Delete question ──────────────────────────────────────────────────────
  const confirmDeleteQ = async (questionId) => {
    setDeletingQId(questionId);
    setError('');
    try {
      await deleteQuestion(questionId, token);
      setQuestions(prev => prev.filter(q => q.id !== questionId));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingQId(null);
    }
  };

  // ── Edit answer ──────────────────────────────────────────────────────────
  const startEditA = (q) => { setEditingAId(q.id); setEditAText(q.answer); setError(''); };
  const cancelEditA = () => { setEditingAId(null); setEditAText(''); };
  const saveEditA = async (questionId) => {
    const text = editAText.trim();
    if (!text) return;
    setSavingAEdit(true);
    setError('');
    try {
      const updated = await patchAnswer(questionId, text, token);
      setQuestions(prev => prev.map(q => q.id === questionId ? updated : q));
      setEditingAId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingAEdit(false);
    }
  };

  // ── Delete answer ────────────────────────────────────────────────────────
  const confirmDeleteA = async (questionId) => {
    setDeletingAId(questionId);
    setError('');
    try {
      const updated = await deleteAnswer(questionId, token);
      setQuestions(prev => prev.map(q => q.id === questionId ? updated : q));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingAId(null);
    }
  };

  const card     = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm';
  const muted    = darkMode ? 'text-gray-400' : 'text-gray-500';
  const inputCls = `flex-1 px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
    darkMode
      ? 'bg-gray-900 border-gray-700 text-gray-200 placeholder-gray-600'
      : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'
  }`;

  return (
    <div className={`rounded-2xl border p-5 ${card}`}>

      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between gap-3 mb-1"
      >
        <div className="flex items-center gap-2">
          <MessageCircle size={18} className="text-emerald-500" />
          <span className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Questions &amp; Answers
          </span>
          {!loading && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
              darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}>
              {questions.length}
            </span>
          )}
        </div>
        {collapsed ? <ChevronDown size={16} className={muted} /> : <ChevronUp size={16} className={muted} />}
      </button>

      {!collapsed && (
        <>
          {/* Ask box */}
          {isLoggedIn && !isSeller && (
            <div className="mt-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newQ}
                  onChange={e => { setNewQ(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && !submittingQ && handleAsk()}
                  placeholder="Ask a question about this listing…"
                  maxLength={300}
                  className={inputCls}
                />
                <button
                  onClick={handleAsk}
                  disabled={submittingQ || !newQ.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingQ ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Ask
                </button>
              </div>
              {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
            </div>
          )}

          {!isLoggedIn && (
            <p className={`mt-3 text-sm ${muted}`}>
              <a href="/login" className="text-emerald-600 hover:underline font-medium">Log in</a> to ask a question.
            </p>
          )}

          {/* Questions list */}
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 size={20} className="animate-spin text-emerald-500" />
            </div>
          ) : questions.length === 0 ? (
            <div className={`mt-4 rounded-xl border border-dashed p-5 text-center text-sm ${
              darkMode ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-400'
            }`}>
              No questions yet. Be the first to ask!
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {questions.map(q => {
                const isMyQuestion = currentUser && String(currentUser.id) === String(q.asker);
                const canEditQ     = isMyQuestion && !q.is_answered;

                return (
                  <div key={q.id} className={`rounded-xl p-3.5 ${darkMode ? 'bg-gray-900/60' : 'bg-gray-50'}`}>

                    {/* Question row */}
                    <div className="flex items-start gap-2.5">
                      <Avatar name={q.asker_name} src={q.asker_picture} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                            {q.asker_name || 'KU Student'}
                          </span>
                          <span className={`text-xs ${muted}`}>{timeAgo(q.created_at)}</span>
                        </div>

                        {editingQId === q.id ? (
                          /* Inline edit for question */
                          <div className="mt-1.5 flex gap-1.5">
                            <input
                              autoFocus
                              type="text"
                              value={editQText}
                              onChange={e => setEditQText(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && !savingQEdit) saveEditQ(q.id);
                                if (e.key === 'Escape') cancelEditQ();
                              }}
                              maxLength={300}
                              className={`${inputCls} flex-1`}
                            />
                            <button
                              onClick={() => saveEditQ(q.id)}
                              disabled={savingQEdit || !editQText.trim()}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                            >
                              {savingQEdit ? <Loader2 size={12} className="animate-spin" /> : 'Save'}
                            </button>
                            <button onClick={cancelEditQ} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
                              <X size={13} className={muted} />
                            </button>
                          </div>
                        ) : (
                          <p className={`mt-0.5 text-sm leading-snug ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {q.question}
                          </p>
                        )}
                      </div>

                      {/* Edit / delete icons for question owner */}
                      {canEditQ && editingQId !== q.id && (
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <IconBtn title="Edit question" onClick={() => startEditQ(q)} darkMode={darkMode}>
                            <Pencil size={12} />
                          </IconBtn>
                          {deletingQId === q.id ? (
                            <Loader2 size={12} className="animate-spin text-red-400 p-1" />
                          ) : (
                            <IconBtn title="Delete question" onClick={() => confirmDeleteQ(q.id)} danger darkMode={darkMode}>
                              <Trash2 size={12} />
                            </IconBtn>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Answer section */}
                    {q.answer ? (
                      <div className="mt-2.5 ml-9 pl-3 border-l-2 border-emerald-500">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <CheckCircle size={11} className="text-emerald-500" />
                          <span className="text-xs font-semibold text-emerald-600">Seller</span>
                          <span className={`text-xs ${muted}`}>{timeAgo(q.answered_at)}</span>

                          {/* Edit / delete icons for seller's answer */}
                          {isSeller && editingAId !== q.id && (
                            <div className="flex items-center gap-0.5 ml-1">
                              <IconBtn title="Edit answer" onClick={() => startEditA(q)} darkMode={darkMode}>
                                <Pencil size={12} />
                              </IconBtn>
                              {deletingAId === q.id ? (
                                <Loader2 size={12} className="animate-spin text-red-400 p-1" />
                              ) : (
                                <IconBtn title="Delete answer" onClick={() => confirmDeleteA(q.id)} danger darkMode={darkMode}>
                                  <Trash2 size={12} />
                                </IconBtn>
                              )}
                            </div>
                          )}
                        </div>

                        {editingAId === q.id ? (
                          <div className="mt-1.5 flex gap-1.5">
                            <input
                              autoFocus
                              type="text"
                              value={editAText}
                              onChange={e => setEditAText(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && !savingAEdit) saveEditA(q.id);
                                if (e.key === 'Escape') cancelEditA();
                              }}
                              maxLength={500}
                              className={`${inputCls} flex-1`}
                            />
                            <button
                              onClick={() => saveEditA(q.id)}
                              disabled={savingAEdit || !editAText.trim()}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                            >
                              {savingAEdit ? <Loader2 size={12} className="animate-spin" /> : 'Save'}
                            </button>
                            <button onClick={cancelEditA} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
                              <X size={13} className={muted} />
                            </button>
                          </div>
                        ) : (
                          <p className={`text-sm leading-snug ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {q.answer}
                          </p>
                        )}
                      </div>

                    ) : isSeller ? (
                      <div className="mt-2.5 ml-9">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={answerTexts[q.id] || ''}
                            onChange={e => setAnswerTexts(prev => ({ ...prev, [q.id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && !submittingA[q.id] && handleAnswer(q.id)}
                            placeholder="Answer this question…"
                            maxLength={500}
                            className={inputCls}
                          />
                          <button
                            onClick={() => handleAnswer(q.id)}
                            disabled={submittingA[q.id] || !(answerTexts[q.id] || '').trim()}
                            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                          >
                            {submittingA[q.id] ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                            Answer
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className={`mt-1.5 ml-9 text-xs italic ${muted}`}>Not yet answered</p>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default QASection;
