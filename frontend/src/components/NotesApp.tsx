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
    return Math.max(...notes.map(n => n.noteId)) + 1;
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

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Solana Notes App</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <WalletMultiButton />
      </div>

      {wallet.connected && (
        <>
          {/* Create Note */}
          <div style={{ marginBottom: '30px' }}>
            <h2>Create New Note</h2>
            <textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Write your note here..."
              style={{ width: '100%', minHeight: '100px', padding: '10px' }}
              maxLength={1000}
            />
            <div style={{ marginTop: '10px' }}>
              <button onClick={createNote} disabled={loading || !newNoteContent.trim()}>
                {loading ? 'Creating...' : 'Create Note'}
              </button>
              <span style={{ marginLeft: '10px', color: '#666' }}>
                {newNoteContent.length}/1000
              </span>
            </div>
          </div>

          {/* Notes List */}
          <div>
            <h2>Your Notes ({notes.length})</h2>
            {loading && <p>Loading...</p>}
            {notes.length === 0 && !loading && <p>No notes yet. Create your first note!</p>}
            
            {notes.map((note) => (
              <div
                key={note.publicKey}
                style={{
                  border: '1px solid #ccc',
                  padding: '15px',
                  marginBottom: '15px',
                  borderRadius: '5px',
                }}
              >
                {editingNote?.id === note.noteId ? (
                  <>
                    <textarea
                      value={editingNote.content}
                      onChange={(e) =>
                        setEditingNote({ ...editingNote, content: e.target.value })
                      }
                      style={{ width: '100%', minHeight: '80px', padding: '10px' }}
                      maxLength={1000}
                    />
                    <div style={{ marginTop: '10px' }}>
                      <button
                        onClick={() => updateNote(note.noteId, editingNote.content)}
                        disabled={loading}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingNote(null)}
                        style={{ marginLeft: '10px' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{note.content}</p>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                      <div>Created: {note.createdAt.toLocaleString()}</div>
                      <div>Updated: {note.updatedAt.toLocaleString()}</div>
                    </div>
                    <div style={{ marginTop: '10px' }}>
                      <button
                        onClick={() =>
                          setEditingNote({ id: note.noteId, content: note.content })
                        }
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteNote(note.noteId)}
                        disabled={loading}
                        style={{ marginLeft: '10px', background: '#dc3545', color: 'white' }}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {!wallet.connected && (
        <p style={{ textAlign: 'center', marginTop: '50px' }}>
          Please connect your wallet to view and manage notes
        </p>
      )}
    </div>
  );
}
