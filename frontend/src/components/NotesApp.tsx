import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { getProgram } from '../utils/program';
import type { AnchorWallet } from '@solana/wallet-adapter-react';

interface Note {
  publicKey: string;
  noteId: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function NotesApp() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNote, setEditingNote] = useState<{ id: number; content: string } | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const MAX_NOTE_LENGTH = 975; // Updated from 1000 to 975 to match transaction limit

  // Fetch all notes
  const fetchNotes = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) return;

    setLoading(true);
    try {
      const program = getProgram(connection, wallet as AnchorWallet);
      const allNotes = await program.account.note.all([
        {
          memcmp: {
            offset: 8,
            bytes: wallet.publicKey.toBase58(),
          },
        },
      ]);

      const formattedNotes: Note[] = allNotes.map((note) => ({
        publicKey: note.publicKey.toString(),
        noteId: note.account.noteId.toNumber(),
        content: note.account.content,
        createdAt: new Date(note.account.createdAt.toNumber() * 1000),
        updatedAt: new Date(note.account.updatedAt.toNumber() * 1000),
      }));

      setNotes(formattedNotes.sort((a, b) => b.noteId - a.noteId));
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get next note ID
  const getNextNoteId = (): number => {
    if (notes.length === 0) return 0;
    return Math.max(...notes.map((n) => n.noteId)) + 1;
  };

  // Create note
  const createNote = async () => {
    if (!wallet.publicKey || !wallet.signTransaction || !newNoteContent.trim()) return;

    setLoading(true);
    try {
      const program = getProgram(connection, wallet as AnchorWallet);
      const noteId = getNextNoteId();

      const [notePDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('note'),
          wallet.publicKey.toBuffer(),
          new BN(noteId).toArrayLike(Buffer, 'le', 8),
        ],
        program.programId
      );

      await program.methods
        .createNote(newNoteContent, new BN(noteId))
        .accountsPartial({
          note: notePDA,
          user: wallet.publicKey,
        })
        .rpc();

      setNewNoteContent('');
      await fetchNotes();
    } catch (error) {
      console.error('Error creating note:', error);
      alert('Failed to create note');
    } finally {
      setLoading(false);
    }
  };

  // Update note
  const updateNote = async (noteId: number, newContent: string) => {
    if (!wallet.publicKey || !wallet.signTransaction || !newContent.trim()) return;

    setLoading(true);
    try {
      const program = getProgram(connection, wallet as AnchorWallet);

      const [notePDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('note'),
          wallet.publicKey.toBuffer(),
          new BN(noteId).toArrayLike(Buffer, 'le', 8),
        ],
        program.programId
      );

      await program.methods
        .updateNote(newContent)
        .accountsPartial({
          note: notePDA,
          user: wallet.publicKey,
          authority: wallet.publicKey,
        })
        .rpc();

      setEditingNote(null);
      await fetchNotes();
    } catch (error) {
      console.error('Error updating note:', error);
      alert('Failed to update note');
    } finally {
      setLoading(false);
    }
  };

  // Delete note
  const deleteNote = async (noteId: number) => {
    if (!wallet.publicKey || !wallet.signTransaction) return;
    if (!confirm('Are you sure you want to delete this note?')) return;

    setLoading(true);
    try {
      const program = getProgram(connection, wallet as AnchorWallet);

      const [notePDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('note'),
          wallet.publicKey.toBuffer(),
          new BN(noteId).toArrayLike(Buffer, 'le', 8),
        ],
        program.programId
      );

      await program.methods
        .deleteNote()
        .accountsPartial({
          note: notePDA,
          user: wallet.publicKey,
          authority: wallet.publicKey,
        })
        .rpc();

      await fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note');
    } finally {
      setLoading(false);
    }
  };

  // Fetch notes when wallet connects
  useEffect(() => {
    if (wallet.publicKey) {
      fetchNotes();
    } else {
      setNotes([]);
    }
  }, [wallet.publicKey]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <div className="app-wrapper">
      {/* Header */}
      <header className="app-header">
        <div className="container">
          <div className="header-content">
            <div className="app-title">Solana Notes</div>
            <div className="header-right">
              <button className="theme-toggle" onClick={toggleTheme}>
                {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
              </button>
              <WalletMultiButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container">
        {wallet.connected ? (
          <div className="main-content">
            {/* Create Note Panel */}
            <div className="notes-container" style={{ maxWidth: '400px' }}>
              <div className="create-section">
                <h2>Create Note</h2>
                <div className="textarea-wrapper">
                  <textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Write your thoughts, ideas, or reminders here..."
                    maxLength={MAX_NOTE_LENGTH}
                  />
                  <div className="char-counter">{newNoteContent.length} / {MAX_NOTE_LENGTH}</div>
                </div>
                <button
                  className="btn-primary"
                  onClick={createNote}
                  disabled={loading || !newNoteContent.trim()}
                  style={{ width: '100%' }}
                >
                  {loading ? 'Creating...' : 'Create Note'}
                </button>
              </div>
            </div>

            {/* Notes List */}
            <div className="notes-container" style={{ flex: 1 }}>
              <div className="notes-section">
                <h2>
                  Your Notes <span className="notes-count">({notes.length})</span>
                </h2>

                {loading && notes.length === 0 && (
                  <div className="loading-state">Loading your notes...</div>
                )}

                {!loading && notes.length === 0 && (
                  <div className="empty-state">
                    No notes yet. Create your first note to get started!
                  </div>
                )}

                {notes.length > 0 && (
                  <div className="notes-grid">
                    {notes.map((note) => (
                      <div key={note.noteId} className="note-card">
                        {editingNote?.id === note.noteId ? (
                          <div className="note-edit-mode">
                            <textarea
                              value={editingNote.content}
                              onChange={(e) =>
                                setEditingNote({ ...editingNote, content: e.target.value })
                              }
                              maxLength={MAX_NOTE_LENGTH}
                            />
                            <div className="edit-actions">
                              <button
                                className="btn-primary"
                                onClick={() => updateNote(note.noteId, editingNote.content)}
                                disabled={loading}
                              >
                                Save
                              </button>
                              <button
                                className="btn-secondary"
                                onClick={() => setEditingNote(null)}
                                disabled={loading}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="note-content">{note.content}</div>
                            <div className="note-dates">
                              <span>Created: {note.createdAt.toLocaleString()}</span>
                              <span>Updated: {note.updatedAt.toLocaleString()}</span>
                            </div>
                            <div className="note-actions">
                              <button
                                className="btn-secondary"
                                onClick={() =>
                                  setEditingNote({ id: note.noteId, content: note.content })
                                }
                                disabled={loading}
                              >
                                Edit
                              </button>
                              <button
                                className="btn-danger"
                                onClick={() => deleteNote(note.noteId)}
                                disabled={loading}
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="wallet-state">
            <div className="wallet-prompt">
              <h2>Connect Your Wallet</h2>
              <p>Connect your Solana wallet to view and manage your decentralized notes securely on the blockchain.</p>
              <WalletMultiButton />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
