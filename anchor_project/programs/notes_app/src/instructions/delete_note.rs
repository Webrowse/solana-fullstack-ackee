use anchor_lang::prelude::*;
use crate::{errors::NotesError, state::Note};

pub fn delete_note(ctx: Context<DeleteNote>) -> Result<()> {
    let note_id = ctx.accounts.note.note_id;
    msg!("Note deleted with ID: {}", note_id);
    Ok(())
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
