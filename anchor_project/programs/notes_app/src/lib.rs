use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("FchaqsnrXy4NyEZ1ddpkz1MNVnMo1pStEro3Jak9zvLk");

#[program]
pub mod notes_app {
    use super::*;

    pub fn create_note(ctx: Context<CreateNote>, content: String, note_id: u64) -> Result<()> {
        instructions::create_note::create_note(ctx, content, note_id)
    }

    pub fn update_note(ctx: Context<UpdateNote>, content: String) -> Result<()> {
        instructions::update_note::update_note(ctx, content)
    }

    pub fn delete_note(ctx: Context<DeleteNote>) -> Result<()> {
        instructions::delete_note::delete_note(ctx)
    }
}






