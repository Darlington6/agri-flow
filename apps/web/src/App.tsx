import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SessionProvider } from '@/context/SessionContext'
import { AuthProvider } from '@/context/AuthContext'
import { PlatformDataProvider } from '@/context/PlatformDataContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { SignInPage } from '@/pages/auth/SignInPage'
import { AccountPage } from '@/pages/auth/AccountPage'
import { MagicLinkVerifyPage } from '@/pages/auth/MagicLinkVerifyPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { BuyersPage } from '@/pages/buyers/BuyersPage'
import { BuyerDetailPage } from '@/pages/buyers/BuyerDetailPage'
import { FarmersPage } from '@/pages/farmers/FarmersPage'
import { FarmerDetailPage } from '@/pages/farmers/FarmerDetailPage'
import { ContractsPage } from '@/pages/contracts/ContractsPage'
import { ContractDetailPage } from '@/pages/contracts/ContractDetailPage'
import { ProductionPage } from '@/pages/ProductionPage'
import { HarvestPage } from '@/pages/HarvestPage'
import { ClimatePage } from '@/pages/ClimatePage'
import { FinancePage } from '@/pages/FinancePage'
import { MarketplacePage } from '@/pages/MarketplacePage'
import { DeliveryPage } from '@/pages/DeliveryPage'
import { ExecutivePage } from '@/pages/ExecutivePage'
import { CopilotPage } from '@/pages/CopilotPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SessionProvider>
          <PlatformDataProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/magic-link" element={<MagicLinkVerifyPage />} />

              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/buyers" element={<BuyersPage />} />
                <Route path="/buyers/:id" element={<BuyerDetailPage />} />
                <Route path="/farmers" element={<FarmersPage />} />
                <Route path="/farmers/:id" element={<FarmerDetailPage />} />
                <Route path="/contracts" element={<ContractsPage />} />
                <Route path="/contracts/:id" element={<ContractDetailPage />} />
                <Route path="/production" element={<ProductionPage />} />
                <Route path="/harvest" element={<HarvestPage />} />
                <Route path="/climate" element={<ClimatePage />} />
                <Route path="/finance" element={<FinancePage />} />
                <Route path="/marketplace" element={<MarketplacePage />} />
                <Route path="/delivery" element={<DeliveryPage />} />
                <Route path="/executive" element={<ExecutivePage />} />
                <Route path="/copilot" element={<CopilotPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </PlatformDataProvider>
        </SessionProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
