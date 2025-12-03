![School of Solana](https://github.com/Ackee-Blockchain/school-of-solana/blob/master/.banner/banner.png?raw=true)

# Project Description

**Deployed Frontend URL:** [Solana Notes](https://notes-sol.netlify.app/)

**Solana Program ID:** `FchaqsnrXy4NyEZ1ddpkz1MNVnMo1pStEro3Jak9zvLk`

## Project Overview

### Description
A decentralized notes application built on Solana where users can create, edit, and delete personal notes stored entirely on-chain. Each note is stored in its own Program Derived Address (PDA) account, allowing efficient management of multiple notes per user. The application demonstrates core Solana concepts including PDA derivation, account management, rent reclamation, and proper authorization checks.

### Key Features

- **Wallet-Based Authentication**: Users connect their Solana wallet (Phantom, Solflare) to interact with the dApp
- **Create Notes**: Store text notes (up to 1000 characters) on-chain with automatic timestamp recording
- **Edit Notes**: Update note content while preserving creation timestamp and updating modification time
- **Delete Notes**: Remove notes and reclaim rent (approximately 0.002 SOL per note)
- **Automatic Note Fetching**: All user notes are automatically loaded when wallet connects
- **Individual PDAs**: Each note uses a separate PDA account for gas-efficient operations
- **Authorization**: Only note owners can edit or delete their notes
- **Timestamps**: Creation and last-update timestamps stored on-chain
  
### How to Use the dApp

1. **Connect Wallet**
   - Visit the deployed frontend URL
   - Ensure your wallet is set to **Devnet** 
   - Click "Select Wallet" button
   - Choose your wallet
   - Approve the connection request

2. **Get Devnet SOL (if needed)**
   - Visit https://faucet.solana.com
   - Enter your wallet address
   - Request devnet SOL (needed for transaction fees)

3. **Create a Note**
   - Type your note content in the text area (max 1000 characters)
   - Click "Create Note"
   - Approve the transaction in your wallet
   - Note appears in the list below

4. **Edit a Note**
   - Click "Edit" button on any existing note
   - Modify the content in the text area
   - Click "Save"
   - Approve the transaction
   - Updated note shows with new "Updated" timestamp

5. **Delete a Note**
   - Click "Delete" button on any note
   - Confirm the deletion in the popup
   - Approve the transaction in your wallet
   - Note is removed and rent is returned to your wallet


## Program Architecture

The Solana program is structured using modular Anchor framework patterns with clear separation of concerns:

### File Structure
```
programs/notes_app/src/
├── lib.rs              # Program entry point and instruction routing
├── state.rs            # Note account structure definition
├── errors.rs           # Custom error types
└── instructions/
    ├── mod.rs          # Instruction module exports
    ├── create_note.rs  # Note creation logic
    ├── update_note.rs  # Note update logic
    └── delete_note.rs  # Note deletion logic
```


### PDA Usage

The program uses a single PDA pattern for note accounts, ensuring each note is uniquely identified and owned:

**PDAs Used:**

- **Note Account PDA**: Stores individual note data
  - **Seeds**: `["note", user_pubkey, note_id]`
  - **Purpose**: Deterministically derive unique addresses for each user's notes
  - **Why these seeds**:
    - `"note"` - Namespace identifier to avoid collisions
    - `user_pubkey` - Ensures notes are user-specific
    - `note_id` (u64) - Allows multiple notes per user with sequential IDs
  - **Benefits**: 
    - No need to store note addresses off-chain
    - Users can have unlimited notes
    - Each note can be independently created/deleted
    - Rent is reclaimed individually per note

### Program Instructions


**Instructions Implemented:**

1. **`create_note`**
   - **Purpose**: Initialize a new note account and store content
   - **Parameters**: `content: String`, `note_id: u64`
   - **Validations**:
     - Content length ≤ 1000 characters
     - Content is not empty
   - **Actions**:
     - Derives PDA from seeds
     - Initializes account with space allocation
     - Stores content, authority, timestamps
     - Charges user for rent
   - **Rent**: ~0.002 SOL (reclaimable on delete)

2. **`update_note`**
   - **Purpose**: Modify existing note content
   - **Parameters**: `content: String`
   - **Validations**:
     - Note exists
     - Caller is the note authority (owner)
     - Content length ≤ 1000 characters
     - Content is not empty
   - **Actions**:
     - Updates content field
     - Updates `updated_at` timestamp
     - Preserves `created_at` timestamp
   - **Cost**: ~0.00001 SOL (transaction fee only)

3. **`delete_note`**
   - **Purpose**: Close note account and reclaim rent
   - **Parameters**: None
   - **Validations**:
     - Note exists
     - Caller is the note authority
   - **Actions**:
     - Closes the account
     - Returns rent (~0.002 SOL) to user
   - **Cost**: ~0.00001 SOL (transaction fee, but rent is returned)


### Account Structure

```rust
#[account]
#[derive(InitSpace)]
pub struct Note {
    pub authority: Pubkey,      // 32 bytes - Owner's wallet address
    #[max_len(1000)]
    pub content: String,         // 4 + 1000 bytes - Note text with length prefix
    pub note_id: u64,            // 8 bytes - Unique identifier within user's notes
    pub created_at: i64,         // 8 bytes - Unix timestamp of creation
    pub updated_at: i64,         // 8 bytes - Unix timestamp of last modification
}
// Total account size: 8 (discriminator) + 1060 bytes = 1068 bytes
```


## Testing

### Test Coverage
The project includes 15 comprehensive tests covering all instructions with both success and failure scenarios.

**Happy Path Tests:**
1. **Create single note**: Verifies note creation with valid content and ID
2. **Create multiple notes**: Tests creating 3+ notes with different IDs sequentially
3. **Update note content**: Confirms content changes and timestamp updates
4. **Update note multiple times**: Ensures repeated updates work correctly
5. **Delete note**: Verifies account closure and rent reclamation
6. **Delete multiple notes**: Tests batch deletion operations
7. **PDA derivation validation**: Confirms different users/IDs produce unique PDAs

**Unhappy Path Tests:**
1. **Empty content on create**: Expects `ContentEmpty` error when content is ""
2. **Content too long on create**: Expects error when content > 1000 characters
3. **Duplicate note ID**: Expects failure when trying to reuse same note_id
4. **Empty content on update**: Validates update with empty string fails
5. **Content too long on update**: Validates update with >1000 chars fails
6. **Update non-existent note**: Expects `AccountNotInitialized` error
7. **Delete non-existent note**: Expects `AccountNotInitialized` error
8. **Delete already deleted note**: Confirms double-delete fails

### Running Tests
```bash
# Navigate to anchor project
cd anchor_project

# Run all tests (starts local validator, deploys, tests, and cleans up)
anchor test

# Expected output: 15 passing tests
```

**Test Statistics:**
- Total Tests: 15
- Happy Paths: 7
- Unhappy Paths: 8
- Test Execution Time: ~40 seconds
- Coverage: All instructions, all validation logic, PDA derivation


### Additional Notes for Evaluators

**Design Decisions:**

1. **Why separate PDAs per note instead of a single account with Vec<Note>?**
   - Gas efficiency: Only pay for storage you use
   - Scalability: No account size limits (can have unlimited notes)
   - Rent reclamation: Delete individual notes and get rent back
   - Parallel operations: Multiple notes can be modified simultaneously

2. **Why user provides note_id instead of auto-increment?**
   - Simplicity: No need for a counter PDA
   - Cost: Saves rent for additional counter account
   - Flexibility: Frontend can manage IDs (timestamp-based, sequential, etc.)
   - Current implementation: Frontend queries all notes and uses `max_id + 1`

3. **Security considerations:**
   - `has_one = authority` constraint ensures only owners can modify/delete
   - Input validation on all instructions (length, empty checks)
   - Rent is paid by user and returned on delete (no griefing attacks)
   - Program is immutable once deployed (for this educational version)

**Known Limitations:**

- **Devnet only**: Not audited or recommended for mainnet
- **No pagination**: Frontend fetches all notes at once (fine for <100 notes)
- **No note recovery**: Deleted notes are permanently removed
- **Sequential ID management**: Frontend must track highest ID (could use timestamps instead)

**Testing Notes:**

- Tests use `Date.now()` offset for unique note IDs per test run
- Some tests skip on airdrop rate limits (devnet limitation, not code issue)
- All tests verify both success criteria AND error messages

**Frontend Implementation:**

- Built with React 18 + TypeScript + Vite
- Uses `@solana/wallet-adapter` for wallet connections
- Buffer polyfill added for browser compatibility
- Responsive design with inline styles (could be improved with Tailwind)
- Real-time updates after each transaction

**Deployment:**

- Program deployed on Solana Devnet
- IDL uploaded on-chain for public accessibility
- Frontend hosted on Netlify with automatic deployments
- All source code available in repository

---

**Thank you for reviewing this project! Feel free to test the dApp or run tests locally. Feedback is appreciated!**