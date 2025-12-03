interface NoteCardProps {
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isEditing: boolean;
  editContent: string;
  onEditChange: (content: string) => void;
  onSave: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onDelete: () => void;
  loading: boolean;
}

export default function NoteCard({
  content,
  createdAt,
  updatedAt,
  isEditing,
  editContent,
  onEditChange,
  onSave,
  onEdit,
  onCancel,
  onDelete,
  loading,
}: NoteCardProps) {
  return (
    <div className="note-card">
      {isEditing ? (
        <div className="note-edit-mode">
          <textarea
            value={editContent}
            onChange={(e) => onEditChange(e.target.value)}
            className="note-textarea-edit"
            maxLength={1000}
          />
          <div className="note-actions">
            <button onClick={onSave} disabled={loading} className="btn btn-primary">
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button onClick={onCancel} disabled={loading} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="note-content">{content}</p>
          <div className="note-footer">
            <span className="note-date">
              Created: {createdAt.toLocaleDateString()} at {createdAt.toLocaleTimeString()}
            </span>
            {updatedAt.getTime() !== createdAt.getTime() && (
              <span className="note-date">
                Updated: {updatedAt.toLocaleDateString()} at {updatedAt.toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="note-actions">
            <button onClick={onEdit} disabled={loading} className="btn btn-secondary">
              Edit
            </button>
            <button onClick={onDelete} disabled={loading} className="btn btn-danger">
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
