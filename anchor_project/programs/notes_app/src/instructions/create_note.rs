// #[derive(Accounts)]
// #[instruction(content: String, note_id: u64)]
// pub struct CreateNote<'info> {
//     #[account(
//         init,
//         payer = user,
//         space = 8 + Note::INIT_SPACE,
//         seeds = [b"note", user.key().as_ref(), note_id.to_le_bytes().as_ref()],
//         bump
//     )]
//     pub note: Account<'info, Note>,
    
//     #[account(mut)]
//     pub user: Signer<'info>,
    
//     pub system_program: Program<'info, System>,
// }

use anchor_lang::prelude::*;
use crate::{state::Note, errors::NotesError};

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