use anchor_lang::prelude::*;

#[error_code]
pub enum NotesError {
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,
    #[msg("Content is too long. Maximum 1000 characters.")]
    ContentTooLong,
    #[msg("Content cannot be empty.")]
    ContentEmpty,
}