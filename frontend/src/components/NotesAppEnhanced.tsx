import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { getProgram } from '../utils/program';
import type { AnchorWallet } from '@solana/wallet-adapter-react';
import Header from './Header';
import SearchBar from './SearchBar';
import NoteCard from './NoteCard';
import WalletButton from './WalletButton';

interface Note {
  publicKey: string;
  noteId: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function NotesAppEnhanced() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNote, setEditingNote] = useState<{ id: number; content: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const getNextNoteId = (): number => {
    if (notes.length === 0) return 0;
    return Math.max(...notes.map((n) => n.noteId)) + 1;
  };

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

  useEffect(() => {
    if (wallet.publicKey) {
      fetchNotes();
    } else {
      setNotes([]);
    }
  }, [wallet.publicKey]);

  const filteredNotes = notes.filter((note) =>
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app-container">
      <Header walletConnected={wallet.connected} notesCount={notes.length} />

      <main className="main-content">
        {!wallet.connected ? (
          <div className="empty-state">
            <div className="empty-state-content">
              <h2>Welcome to Solana Notes</h2>
              <p>Connect your wallet to start creating and managing your decentralized notes.</p>
              <WalletButton />
            </div>
          </div>
        ) : (
          <>
            <section className="create-section">
              <h2 className="section-title">Create New Note</h2>
              <div className="create-form">
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Write your note here..."
                  className="create-textarea"
                  maxLength={1000}
                />
                <div className="create-footer">
                  <button
                    onClick={createNote}
                    disabled={loading || !newNoteContent.trim()}
                    className="btn btn-primary btn-large"
                  >
                    {loading ? 'Creating...' : 'Create Note'}
                  </button>
                  <span className="char-count">
                    {newNoteContent.length}/1000
                  </span>
                </div>
              </div>
            </section>

            <section className="notes-section">
              <div className="notes-header">
                <h2 className="section-title">Your Notes ({filteredNotes.length})</h2>
                <SearchBar value={searchQuery} onChange={setSearchQuery} />
              </div>

              {loading && notes.length === 0 && <p className="loading-text">Loading notes...</p>}
              {filteredNotes.length === 0 && !loading && (
                <p className="empty-notes-text">
                  {notes.length === 0
                    ? 'No notes yet. Create your first note!'
                    : 'No notes match your search.'}
                </p>
              )}

              <div className="notes-grid">
                {filteredNotes.map((note) => (
                  <NoteCard
                    key={note.noteId}
                    content={note.content}
                    createdAt={note.createdAt}
                    updatedAt={note.updatedAt}
                    isEditing={editingNote?.id === note.noteId}
                    editContent={editingNote?.content || ''}
                    onEditChange={(content) => setEditingNote({ id: note.noteId, content })}
                    onSave={() => editingNote && updateNote(note.noteId, editingNote.content)}
                    onEdit={() => setEditingNote({ id: note.noteId, content: note.content })}
                    onCancel={() => setEditingNote(null)}
                    onDelete={() => deleteNote(note.noteId)}
                    loading={loading}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
