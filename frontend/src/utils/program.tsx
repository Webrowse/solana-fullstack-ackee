import { Program, AnchorProvider } from '@coral-xyz/anchor';
import type { Idl } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import type { AnchorWallet } from '@solana/wallet-adapter-react';
import idl from '../notes_app.json';
import type { NotesApp } from '../notes_app';

const PROGRAM_ID = new PublicKey('FchaqsnrXy4NyEZ1ddpkz1MNVnMo1pStEro3Jak9zvLk');

export function getProgram(connection: Connection, wallet: AnchorWallet): Program<NotesApp> {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
  });
  
  return new Program(idl as Idl, provider) as Program<NotesApp>;
}

export { PROGRAM_ID };