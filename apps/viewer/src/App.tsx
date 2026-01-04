import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard.tsx';
import { TracePage } from './pages/TracePage.tsx';
import { EventsPage } from './pages/EventsPage.tsx';
import { DocsPage } from './pages/DocsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import './index.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/traces" element={<Navigate to="/" replace />} />
            <Route path="/traces/:id" element={<TracePage />} />
            <Route path="/events/:id" element={<EventsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="*" element={<div>Not Found</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
