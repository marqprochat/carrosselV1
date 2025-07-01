import { ThemeProvider } from '@/components/theme-provider';
import HomePage from '@/pages/Home';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <HomePage />
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
