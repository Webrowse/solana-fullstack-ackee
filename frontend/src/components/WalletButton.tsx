import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function WalletButton() {
  return (
    <div className="wallet-button-container">
      <WalletMultiButton className="wallet-button" />
    </div>
  );
}
