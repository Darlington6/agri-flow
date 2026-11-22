import { Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SessionProvider } from '@/context/SessionContext'
import { AuthProvider } from '@/context/AuthContext'
import { PlatformDataProvider } from '@/context/PlatformDataContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageLoading } from '@/components/layout/PageLoading'
import { page } from '@/lib/lazyPage'

// Each page is its own download, fetched the first time it's opened, so
// signing in doesn't download the charts and every platform screen.
const LandingPage = page(() => import('@/pages/LandingPage'), 'LandingPage')
const LoginPage = page(() => import('@/pages/LoginPage'), 'LoginPage')
const SignInPage = page(() => import('@/pages/auth/SignInPage'), 'SignInPage')
const AccountPage = page(() => import('@/pages/auth/AccountPage'), 'AccountPage')
const MagicLinkVerifyPage = page(() => import('@/pages/auth/MagicLinkVerifyPage'), 'MagicLinkVerifyPage')
const ConfirmEmailPage = page(() => import('@/pages/auth/ConfirmEmailPage'), 'ConfirmEmailPage')
const DashboardPage = page(() => import('@/pages/DashboardPage'), 'DashboardPage')
const BuyersPage = page(() => import('@/pages/buyers/BuyersPage'), 'BuyersPage')
const BuyerDetailPage = page(() => import('@/pages/buyers/BuyerDetailPage'), 'BuyerDetailPage')
const FarmersPage = page(() => import('@/pages/farmers/FarmersPage'), 'FarmersPage')
const FarmerDetailPage = page(() => import('@/pages/farmers/FarmerDetailPage'), 'FarmerDetailPage')
const ContractsPage = page(() => import('@/pages/contracts/ContractsPage'), 'ContractsPage')
const ContractDetailPage = page(() => import('@/pages/contracts/ContractDetailPage'), 'ContractDetailPage')
const ProductionPage = page(() => import('@/pages/ProductionPage'), 'ProductionPage')
const HarvestPage = page(() => import('@/pages/HarvestPage'), 'HarvestPage')
const ClimatePage = page(() => import('@/pages/ClimatePage'), 'ClimatePage')
const FinancePage = page(() => import('@/pages/FinancePage'), 'FinancePage')
const MarketplacePage = page(() => import('@/pages/MarketplacePage'), 'MarketplacePage')
const DeliveryPage = page(() => import('@/pages/DeliveryPage'), 'DeliveryPage')
const ExecutivePage = page(() => import('@/pages/ExecutivePage'), 'ExecutivePage')
const CopilotPage = page(() => import('@/pages/CopilotPage'), 'CopilotPage')
const SettingsPage = page(() => import('@/pages/SettingsPage'), 'SettingsPage')
const NotFoundPage = page(() => import('@/pages/NotFoundPage'), 'NotFoundPage')

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SessionProvider>
          <PlatformDataProvider>
            <Suspense fallback={<PageLoading fullScreen />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signin" element={<SignInPage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/magic-link" element={<MagicLinkVerifyPage />} />
                <Route path="/confirm-email" element={<ConfirmEmailPage />} />

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
            </Suspense>
          </PlatformDataProvider>
        </SessionProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
