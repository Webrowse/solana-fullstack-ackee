import { WalletContextProvider } from '@/src/WalletContextProvider';
import NotesAppEnhanced from '@/src/components/NotesAppEnhanced';
import '@/src/index.css';

export const metadata = {
  title: 'Solana Notes - Decentralized Note Taking',
  description: 'Create and manage your notes on the Solana blockchain with multiple premium themes.',
};

export default function Page() {
  return (
    <WalletContextProvider>
      <NotesAppEnhanced />
    </WalletContextProvider>
  );
}
