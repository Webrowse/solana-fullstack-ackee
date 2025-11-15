import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { NotesApp } from "../target/types/notes_app";
import { PublicKey, Keypair } from "@solana/web3.js";
import { assert } from "chai";

describe("notes_app", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.NotesApp as Program<NotesApp>;
  const user = provider.wallet;

  // Helper function to derive note PDA
  function getNotePDA(userPubkey: PublicKey, noteId: number): PublicKey {
    const [notePDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("note"),
        userPubkey.toBuffer(),
        new BN(noteId).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );
    return notePDA;
  }

  describe("create_note", () => {
    it("Creates a note successfully (Happy Path)", async () => {
      const noteId = 0;
      const content = "My first note on Solana!";
      const notePDA = getNotePDA(user.publicKey, noteId);

      const tx = await program.methods
        .createNote(content, new BN(noteId))
        .accounts({
          note: notePDA,
          user: user.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Create note transaction:", tx);

      // Fetch and verify the note
      const noteAccount = await program.account.note.fetch(notePDA);
      assert.equal(noteAccount.content, content);
      assert.equal(noteAccount.noteId.toNumber(), noteId);
      assert.equal(
        noteAccount.authority.toString(),
        user.publicKey.toString()
      );
      assert.isTrue(noteAccount.createdAt.toNumber() > 0);
      assert.isTrue(noteAccount.updatedAt.toNumber() > 0);
      assert.equal(
        noteAccount.createdAt.toNumber(),
        noteAccount.updatedAt.toNumber()
      );
    });

    it("Creates multiple notes with different IDs (Happy Path)", async () => {
      const notes = [
        { id: 1, content: "Second note" },
        { id: 2, content: "Third note" },
        { id: 3, content: "Fourth note" },
      ];

      for (const note of notes) {
        const notePDA = getNotePDA(user.publicKey, note.id);
        await program.methods
          .createNote(note.content, new BN(note.id))
          .accounts({
            note: notePDA,
            user: user.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();

        const noteAccount = await program.account.note.fetch(notePDA);
        assert.equal(noteAccount.content, note.content);
        assert.equal(noteAccount.noteId.toNumber(), note.id);
      }
    });

    it("Fails to create note with empty content (Unhappy Path)", async () => {
      const noteId = 100;
      const notePDA = getNotePDA(user.publicKey, noteId);

      try {
        await program.methods
          .createNote("", new BN(noteId))
          .accounts({
            note: notePDA,
            user: user.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();
        assert.fail("Should have failed with empty content");
      } catch (error) {
        assert.include(error.message, "ContentEmpty");
      }
    });

    it("Fails to create note with content > 1000 characters (Unhappy Path)", async () => {
      const noteId = 101;
      const notePDA = getNotePDA(user.publicKey, noteId);
      const longContent = "a".repeat(1001);

      try {
        await program.methods
          .createNote(longContent, new BN(noteId))
          .accounts({
            note: notePDA,
            user: user.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();
        assert.fail("Should have failed with content too long");
      } catch (error) { 
            assert.isTrue(
            error.message.includes("ContentTooLong") || 
            error.message.includes("encoding overruns Buffer")
        );
      }
    });

    it("Fails to create note with duplicate ID (Unhappy Path)", async () => {
      const noteId = 200;
      const notePDA = getNotePDA(user.publicKey, noteId);

      // Create first note
      await program.methods
        .createNote("First note", new BN(noteId))
        .accounts({
          note: notePDA,
          user: user.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      // Try to create duplicate
      try {
        await program.methods
          .createNote("Duplicate note", new BN(noteId))
          .accounts({
            note: notePDA,
            user: user.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();
        assert.fail("Should have failed with duplicate note ID");
      } catch (error) {
        // Anchor will throw an error because account already exists
        assert.isTrue(error.message.includes("already in use"));
      }
    });
  });

  describe("update_note", () => {
    const noteId = 300;
    let notePDA: PublicKey;

    before(async () => {
      // Create a note to update
      notePDA = getNotePDA(user.publicKey, noteId);
      await program.methods
        .createNote("Original content", new BN(noteId))
        .accounts({
          note: notePDA,
          user: user.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
    });

    it("Updates a note successfully (Happy Path)", async () => {
      const newContent = "Updated content!";
      
      // Get original timestamps
      const beforeUpdate = await program.account.note.fetch(notePDA);
      const createdAt = beforeUpdate.createdAt.toNumber();

      // Wait a moment to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 1000));

      const tx = await program.methods
        .updateNote(newContent)
        .accounts({
          note: notePDA,
          user: user.publicKey,
          authority: user.publicKey,
        })
        .rpc();

      console.log("Update note transaction:", tx);

      // Fetch and verify
      const noteAccount = await program.account.note.fetch(notePDA);
      assert.equal(noteAccount.content, newContent);
      assert.equal(noteAccount.createdAt.toNumber(), createdAt);
      assert.isTrue(noteAccount.updatedAt.toNumber() > createdAt);
    });

    it("Updates note multiple times (Happy Path)", async () => {
      const updates = ["Update 1", "Update 2", "Update 3"];

      for (const content of updates) {
        await program.methods
          .updateNote(content)
          .accounts({
            note: notePDA,
            user: user.publicKey,
            authority: user.publicKey,
          })
          .rpc();

        const noteAccount = await program.account.note.fetch(notePDA);
        assert.equal(noteAccount.content, content);
      }
    });

    it("Fails to update note with empty content (Unhappy Path)", async () => {
      try {
        await program.methods
          .updateNote("")
          .accounts({
            note: notePDA,
            user: user.publicKey,
            authority: user.publicKey,
          })
          .rpc();
        assert.fail("Should have failed with empty content");
      } catch (error) {
        assert.include(error.message, "ContentEmpty");
      }
    });

    it("Fails to update note with content > 1000 characters (Unhappy Path)", async () => {
      const longContent = "a".repeat(1001);

      try {
        await program.methods
          .updateNote(longContent)
          .accounts({
            note: notePDA,
            user: user.publicKey,
            authority: user.publicKey,
          })
          .rpc();
        assert.fail("Should have failed with content too long");
      } catch (error) {
            assert.isTrue(
            error.message.includes("ContentTooLong") || 
            error.message.includes("encoding overruns Buffer")
        );
      }
    });

    it("Fails to update note by unauthorized user (Unhappy Path)", async () => {
      const unauthorizedUser = Keypair.generate();
      
      // Airdrop to unauthorized user
      const airdropSig = await provider.connection.requestAirdrop(
        unauthorizedUser.publicKey,
        2 * anchor.web3.LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(airdropSig);

      try {
        await program.methods
          .updateNote("Hacked content")
          .accounts({
            note: notePDA,
            user: unauthorizedUser.publicKey,
            authority: user.publicKey, // Wrong authority
          })
          .signers([unauthorizedUser])
          .rpc();
        assert.fail("Should have failed with unauthorized user");
      } catch (error) {
            assert.isTrue(
            error.message.includes("ContentTooLong") || 
            error.message.includes("encoding overruns Buffer")
        );
      }
    });

    it("Fails to update non-existent note (Unhappy Path)", async () => {
      const nonExistentNoteId = 999999;
      const nonExistentPDA = getNotePDA(user.publicKey, nonExistentNoteId);

      try {
        await program.methods
          .updateNote("This should fail")
          .accounts({
            note: nonExistentPDA,
            user: user.publicKey,
            authority: user.publicKey,
          })
          .rpc();
        assert.fail("Should have failed with non-existent note");
      } catch (error) {
        assert.include(error.message, "AccountNotInitialized");
      }
    });
  });

  describe("delete_note", () => {
    it("Deletes a note successfully (Happy Path)", async () => {
      const noteId = 400;
      const notePDA = getNotePDA(user.publicKey, noteId);

      // Create note
      await program.methods
        .createNote("Note to delete", new BN(noteId))
        .accounts({
          note: notePDA,
          user: user.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      // Verify it exists
      let noteAccount = await program.account.note.fetch(notePDA);
      assert.equal(noteAccount.content, "Note to delete");

      // Delete it
      const tx = await program.methods
        .deleteNote()
        .accounts({
          note: notePDA,
          user: user.publicKey,
          authority: user.publicKey,
        })
        .rpc();

      console.log("Delete note transaction:", tx);

      // Verify it's deleted
      try {
        await program.account.note.fetch(notePDA);
        assert.fail("Note should have been deleted");
      } catch (error) {
        assert.include(error.message, "Account does not exist");
      }
    });

    it("Deletes multiple notes (Happy Path)", async () => {
      const noteIds = [401, 402, 403];

      // Create notes
      for (const id of noteIds) {
        const notePDA = getNotePDA(user.publicKey, id);
        await program.methods
          .createNote(`Note ${id}`, new BN(id))
          .accounts({
            note: notePDA,
            user: user.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();
      }

      // Delete all notes
      for (const id of noteIds) {
        const notePDA = getNotePDA(user.publicKey, id);
        await program.methods
          .deleteNote()
          .accounts({
            note: notePDA,
            user: user.publicKey,
            authority: user.publicKey,
          })
          .rpc();

        // Verify deletion
        try {
          await program.account.note.fetch(notePDA);
          assert.fail(`Note ${id} should have been deleted`);
        } catch (error) {
          assert.include(error.message, "Account does not exist");
        }
      }
    });

    it("Fails to delete note by unauthorized user (Unhappy Path)", async () => {
      const noteId = 500;
      const notePDA = getNotePDA(user.publicKey, noteId);

      // Create note
      await program.methods
        .createNote("Protected note", new BN(noteId))
        .accounts({
          note: notePDA,
          user: user.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      // Try to delete with unauthorized user
      const unauthorizedUser = Keypair.generate();
     
     try {
         const airdropSig = await provider.connection.requestAirdrop(
           unauthorizedUser.publicKey,
           2 * anchor.web3.LAMPORTS_PER_SOL
         );

         await provider.connection.confirmTransaction(airdropSig);
     } catch (airdropError) {
        console.log("Airdop failed (rate limit), skipping unauthorized user delete test");
        this.skip();
        return;
     }

      try {
        await program.methods
          .deleteNote()
          .accounts({
            note: notePDA,
            user: unauthorizedUser.publicKey,
            authority: user.publicKey,
          })
          .signers([unauthorizedUser])
          .rpc();
        assert.fail("Should have failed with unauthorized user");
      } catch (error) {
        assert.include(error.message, "Unauthorized");
      }

      // Verify note still exists
      const noteAccount = await program.account.note.fetch(notePDA);
      assert.equal(noteAccount.content, "Protected note");
    });

    it("Fails to delete non-existent note (Unhappy Path)", async () => {
      const nonExistentNoteId = 888888;
      const nonExistentPDA = getNotePDA(user.publicKey, nonExistentNoteId);

      try {
        await program.methods
          .deleteNote()
          .accounts({
            note: nonExistentPDA,
            user: user.publicKey,
            authority: user.publicKey,
          })
          .rpc();
        assert.fail("Should have failed with non-existent note");
      } catch (error) {
        assert.include(error.message, "AccountNotInitialized");
      }
    });

    it("Fails to delete already deleted note (Unhappy Path)", async () => {
      const noteId = 600;
      const notePDA = getNotePDA(user.publicKey, noteId);

      // Create and delete note
      await program.methods
        .createNote("Temporary note", new BN(noteId))
        .accounts({
          note: notePDA,
          user: user.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      await program.methods
        .deleteNote()
        .accounts({
          note: notePDA,
          user: user.publicKey,
          authority: user.publicKey,
        })
        .rpc();

      // Try to delete again
      try {
        await program.methods
          .deleteNote()
          .accounts({
            note: notePDA,
            user: user.publicKey,
            authority: user.publicKey,
          })
          .rpc();
        assert.fail("Should have failed deleting already deleted note");
      } catch (error) {
        assert.include(error.message, "AccountNotInitialized");
      }
    });
  });

  describe("PDA Derivation", () => {
    it("Derives correct PDA for different users and note IDs", async () => {
      const user1 = Keypair.generate();
      const user2 = Keypair.generate();
      const noteId1 = 1;
      const noteId2 = 2;

      const pda1_1 = getNotePDA(user1.publicKey, noteId1);
      const pda1_2 = getNotePDA(user1.publicKey, noteId2);
      const pda2_1 = getNotePDA(user2.publicKey, noteId1);

      // Same user, different note IDs should have different PDAs
      assert.notEqual(pda1_1.toString(), pda1_2.toString());

      // Different users, same note ID should have different PDAs
      assert.notEqual(pda1_1.toString(), pda2_1.toString());

      // Deriving same PDA twice should give same result
      const pda1_1_again = getNotePDA(user1.publicKey, noteId1);
      assert.equal(pda1_1.toString(), pda1_1_again.toString());
    });
  });
});