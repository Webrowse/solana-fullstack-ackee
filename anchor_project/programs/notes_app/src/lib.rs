use anchor_lang::prelude::*;

declare_id!("FchaqsnrXy4NyEZ1ddpkz1MNVnMo1pStEro3Jak9zvLk");

#[program]
pub mod notes_app {
    use super::*;

    pub fn create_note(ctx: Context<CreateNote>, content: String, note_id: u64) -> Result<()> {
        require!(content.len() <= 1000, NotesError::ContentTooLong);
        require!(!content.is_empty(), NotesError::ContentEmpty);
        
        let note = &mut ctx.accounts.note;
        note.authority = ctx.accounts.user.key();
        note.content = content;
        note.note_id = note_id;
        note.created_at = Clock::get()?.unix_timestamp;
        note.updated_at = Clock::get()?.unix_timestamp;

        msg!("Note created with ID: {}", note_id);
        
        Ok(())
    }

    pub fn update_note(ctx: Context<UpdateNote>, content: String) -> Result<()> {
        require!(content.len() <= 1000, NotesError::ContentTooLong);
        require!(!content.is_empty(), NotesError::ContentEmpty);
        
        let note = &mut ctx.accounts.note;
        note.content = content;
        note.updated_at = Clock::get()?.unix_timestamp;
        
        msg!("Note updated with ID: {}", note.note_id);

        Ok(())
    }

    pub fn delete_note(_ctx: Context<DeleteNote>) -> Result<()> {
        
        msg!("Note deleted");

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(content: String, note_id: u64)]
pub struct CreateNote<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + Note::INIT_SPACE,
        seeds = [b"note", user.key().as_ref(), note_id.to_le_bytes().as_ref()],
        bump
    )]
    pub note: Account<'info, Note>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateNote<'info> {
    #[account(
        mut,
        seeds = [b"note", user.key().as_ref(), note.note_id.to_le_bytes().as_ref()],
        bump,
        has_one = authority @ NotesError::Unauthorized
    )]
    pub note: Account<'info, Note>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    ///CHECK: This is safe because we check authority above
    pub authority: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct DeleteNote<'info> {
    #[account(
        mut,
        seeds = [b"note", user.key().as_ref(), note.note_id.to_le_bytes().as_ref()],
        bump,
        has_one = authority @ NotesError::Unauthorized,
        close = user
    )]
    pub note: Account<'info, Note>,
    
    #[account(mut)]
    pub user: Signer<'info>,

    ///CHECK: Authority of the note, validated by has_one constraint
    pub authority: AccountInfo<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Note {
    pub authority: Pubkey,      // 32
    #[max_len(1000)]
    pub content: String,         // 4 + 1000
    pub note_id: u64,            // 8
    pub created_at: i64,         // 8
    pub updated_at: i64,         // 8
}

#[error_code]
pub enum NotesError {
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,
    #[msg("Content is too long. Maximum 1000 characters.")]
    ContentTooLong,
    #[msg("Content cannot be empty.")]
    ContentEmpty,
}