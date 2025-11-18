use crate::{errors::NotesError, state::Note};
use anchor_lang::prelude::*;

pub fn update_note(ctx: Context<UpdateNote>, content: String) -> Result<()> {
    require!(content.len() <= 1000, NotesError::ContentTooLong);
    require!(!content.is_empty(), NotesError::ContentEmpty);

    let note = &mut ctx.accounts.note;
    note.content = content;
    note.updated_at = Clock::get()?.unix_timestamp;

    msg!("Note updated with ID: {}", note.note_id);

    Ok(())
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
