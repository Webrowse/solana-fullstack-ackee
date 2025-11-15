import { WalletContextProvider } from './WalletContextProvider';
import NotesApp from './components/NotesApp';

function App() {
  return (
    <WalletContextProvider>
      <NotesApp />
    </WalletContextProvider>
  );
}

export default App;