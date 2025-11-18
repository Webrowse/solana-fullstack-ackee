use anchor_lang::prelude::*;

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
// impl Note {
//     pub const INIT_SPACE: usize = 32 + (4 + 1000) + 8 + 8 + 8;
// }