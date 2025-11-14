use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqgY3vQb3N9v9s4N8dDqVt1J");

#[program]
pub mod notes_app {
    use super::*;

    pub fn initialize_profile(
        ctx: Context<InitializeProfile>,
        username: String,
        bio: String,
    ) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        profile.username = username;
        profile.bio = bio;
        profile.authority = ctx.accounts.authority.key();
        Ok(())
    }

    pub fn update_bio(ctx: Context<UpdateBio>, new_bio: String) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        require_keys_eq!(profile.authority, ctx.accounts.authority.key(), CustomError::Unauthorized);
        profile.bio = new_bio;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(username: String, bio: String)]
pub struct InitializeProfile<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 4 + 64 + 4 + 280, seeds = [b"profile", authority.key().as_ref()], bump)]
    pub profile: Account<'info, Profile>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateBio<'info> {
    #[account(mut, seeds = [b"profile", authority.key().as_ref()], bump)]
    pub profile: Account<'info, Profile>,
    pub authority: Signer<'info>,
}

#[account]
pub struct Profile {
    pub authority: Pubkey,
    pub username: String,
    pub bio: String,
}

#[error_code]
pub enum CustomError {
    #[msg("You are not authorized to update this profile.")]
    Unauthorized,
}

