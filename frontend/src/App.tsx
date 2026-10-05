import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { FloatingPillNav } from './components/FloatingPillNav';
import { MaterialDetailDrawer } from './components/MaterialDetailDrawer';
import { ToastContainer, ToastMessage } from './components/Toast';
import { AiAssistantModal } from './components/AiAssistantModal';
import { JudgeDemoTour } from './components/JudgeDemoTour';
import { SihDemoScenarioModal } from './components/SihDemoScenarioModal';

import { DashboardPage } from './pages/DashboardPage';
import { MaterialsPage } from './pages/MaterialsPage';
import { HarmonizationPage } from './pages/HarmonizationPage';
import { ReviewQueuePage } from './pages/ReviewQueuePage';
import { DuplicateDetectionPage } from './pages/DuplicateDetectionPage';
import { TryAiMatchingPage } from './pages/TryAiMatchingPage';
import { ImportDataPage } from './pages/ImportDataPage';
import { CpseDirectoryPage } from './pages/CpseDirectoryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { LoginPage } from './pages/LoginPage';

import { api } from './services/api';
import { User, DashboardStats, MaterialDetail } from './types';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [currentUser, setCurrentUser] = useState<User>({
    id: 1,
    username: 'admin',
    email: 'admin@samhita.gov.in',
    full_name: 'Dr. Rajesh Sharma (Chief Technical Officer)',
    role: 'admin'
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [materialsFilter, setMaterialsFilter] = useState<any>({});
  
  // Dashboard & Metrics cache
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Material Detail Drawer State
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialDetail | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Stage 4 Modals
  const [assistantModalOpen, setAssistantModalOpen] = useState(false);
  const [judgeTourOpen, setJudgeTourOpen] = useState(false);
  const [demoScenariosOpen, setDemoScenariosOpen] = useState(false);

  const handleSelectScenario = (scenarioId: number) => {
    switch (scenarioId) {
      case 1:
        handleNavigate('harmonization');
        showToast('SIH Demo: Scenario 1', 'Displaying SS Hex Bolt M10×50 mm harmonized across all 5 CPSEs under canonical standard STD-FST-00128', 'info');
        break;
      case 2:
        handleNavigate('try-ai');
        showToast('SIH Demo: Scenario 2', 'Testing M10 vs M12 Fastener Conflict — Notice the explicit "Why Not a Match?" conflict reasoning', 'info');
        break;
      case 3:
        handleNavigate('duplicates');
        showToast('SIH Demo: Scenario 3', 'Reviewing cross-CPSE redundant record pairs ready for safe non-destructive merging', 'info');
        break;
      case 4:
        handleNavigate('materials', { harmonizationStatus: 'UNIQUE' });
        showToast('SIH Demo: Scenario 4', 'Demonstrating unique high-spec materials maintaining independent standard identities without false merging', 'info');
        break;
      case 5:
        handleNavigate('review');
        showToast('SIH Demo: Scenario 5', 'Routing borderline AI suggestions to technical reviewers for approval/rejection', 'info');
        break;
      default:
        break;
    }
  };

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (title: string, message?: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const loadDashboardStats = async () => {
    setLoadingStats(true);
    try {
      const data = await api.getDashboard();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      api.setUserRole(currentUser.role);
      loadDashboardStats();
    }
  }, [isAuthenticated, currentUser.role]);

  const handleRoleChange = async (newRole: 'admin' | 'reviewer' | 'viewer') => {
    try {
      api.setUserRole(newRole);
      const res = await api.demoLogin(newRole);
      setCurrentUser(res.user);
      showToast('Role Switched', `Active session is now: ${res.user.role.toUpperCase()} (RBAC enforced)`, 'info');
    } catch (err) {
      // Fallback local update
      api.setUserRole(newRole);
      setCurrentUser((prev) => ({ ...prev, role: newRole }));
      showToast('Role Switched', `Active role updated to ${newRole.toUpperCase()}`, 'info');
    }
  };

  const handleOpenMaterial = async (id: number) => {
    try {
      const data = await api.getMaterialDetail(id);
      setSelectedMaterial(data);
      setDrawerOpen(true);
    } catch (err) {
      showToast('Error', 'Unable to load material details', 'error');
    }
  };

  const handleApproveMatch = async (id: number) => {
    try {
      await api.submitReviewDecision(id, 'approved', {
        reviewerName: currentUser.full_name,
        notes: 'Approved via detail inspection drawer.'
      });
      showToast('Match Approved', 'Standard material mapping confirmed and recorded.', 'success');
      setDrawerOpen(false);
      loadDashboardStats();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    }
  };

  const handleRejectMatch = async (id: number) => {
    try {
      await api.submitReviewDecision(id, 'rejected', {
        reviewerName: currentUser.full_name,
        rejectionReason: 'Rejected via detail inspection drawer.'
      });
      showToast('Match Rejected', 'Removed from standard mapping.', 'info');
      setDrawerOpen(false);
      loadDashboardStats();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    }
  };

  const handleNavigate = (tab: string, filter?: any) => {
    setActiveTab(tab);
    if (filter) {
      setMaterialsFilter(filter);
    } else {
      setMaterialsFilter({});
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGlobalSearch = (query: string) => {
    if (!query.trim()) return;
    setMaterialsFilter({ search: query.trim() });
    setActiveTab('materials');
  };

  if (!isAuthenticated) {
    return (
      <LoginPage
        onLogin={(role) => {
          handleRoleChange(role);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 selection:bg-blue-100 selection:text-blue-900 dark:selection:bg-blue-950 dark:selection:text-blue-200 pb-28 sm:pb-32">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onRoleChange={handleRoleChange}
        onNavigate={handleNavigate}
        onSearchSubmit={handleGlobalSearch}
        onOpenAssistant={() => setAssistantModalOpen(true)}
        onToggleJudgeTour={() => setJudgeTourOpen(!judgeTourOpen)}
        isJudgeTourActive={judgeTourOpen}
        onOpenDemoScenarios={() => setDemoScenariosOpen(true)}
      />

      {/* Main Content Area - Full width with ample bottom padding for floating dock */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-12 sm:pb-16">
        <div key={activeTab} className="animate-page-enter">
          {activeTab === 'dashboard' && (
            <DashboardPage
              stats={stats}
              loading={loadingStats}
              onNavigate={handleNavigate}
              onOpenMaterial={handleOpenMaterial}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'materials' && (
            <MaterialsPage
              onOpenMaterial={handleOpenMaterial}
              initialFilter={materialsFilter}
            />
          )}

          {activeTab === 'harmonization' && (
            <HarmonizationPage onOpenMaterial={handleOpenMaterial} />
          )}

          {activeTab === 'review' && (
            <ReviewQueuePage
              onOpenMaterial={handleOpenMaterial}
              currentUser={currentUser}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'duplicates' && (
            <DuplicateDetectionPage
              onOpenMaterial={handleOpenMaterial}
              currentUser={currentUser}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'try-ai' && <TryAiMatchingPage />}

          {activeTab === 'import' && (
            <ImportDataPage onShowToast={showToast} onNavigate={handleNavigate} />
          )}

          {activeTab === 'cpse' && (
            <CpseDirectoryPage
              onNavigateToMaterials={(cpseCode) => {
                setMaterialsFilter({ cpseCode });
                setActiveTab('materials');
              }}
            />
          )}

          {activeTab === 'analytics' && <AnalyticsPage stats={stats} />}

          {activeTab === 'audit' && <AuditLogPage />}
        </div>
      </main>

      {/* Floating Bottom Dock Navigation (Fixed to bottom, centered) */}
      <FloatingPillNav
        activeTab={activeTab}
        onSelectTab={handleNavigate}
        pendingReviewCount={stats?.pending_review || 0}
        currentUser={currentUser}
      />

      {/* Material Detail Drawer */}
      <MaterialDetailDrawer
        material={selectedMaterial}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onApprove={handleApproveMatch}
        onReject={handleRejectMatch}
        userRole={currentUser.role}
      />

      {/* Stage 4 AI Search & Assistant Modal */}
      <AiAssistantModal
        isOpen={assistantModalOpen}
        onClose={() => setAssistantModalOpen(false)}
        onNavigateToMaterial={(id) => {
          setAssistantModalOpen(false);
          handleOpenMaterial(id);
        }}
      />

      {/* Stage 4 SIH Judge Demo Tour Controller */}
      <JudgeDemoTour
        isOpen={judgeTourOpen}
        onClose={() => setJudgeTourOpen(false)}
        onNavigate={handleNavigate}
        onOpenMaterial={handleOpenMaterial}
      />

      {/* SIH Demo Scenario Mode Picker Modal (Section 14) */}
      <SihDemoScenarioModal
        isOpen={demoScenariosOpen}
        onClose={() => setDemoScenariosOpen(false)}
        onSelectScenario={handleSelectScenario}
      />

      {/* Global Toast Feedback */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
