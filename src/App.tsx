import { useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom"
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { ThemeProvider } from "./contexts/ThemeContext"
import { usePushNotifications } from "./hooks/usePushNotifications"
import { perfilApi } from "./api"
import TabBar    from "./components/TabBar"
import AppShell  from "./components/AppShell"
import AtualizacaoBanner from "./components/AtualizacaoBanner"
import BuscarIgreja from "./pages/BuscarIgreja"
import Login     from "./pages/Login"
import Register  from "./pages/Register"
import CadastroVisitante from "./pages/CadastroVisitante"
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade"
import EsqueciSenha from "./pages/EsqueciSenha"
import Home      from "./pages/Home"
import Noticia   from "./pages/Noticia"
import AoVivo    from "./pages/AoVivo"
import Midia     from "./pages/Midia"
import Igreja    from "./pages/Igreja"
import Horarios  from "./pages/Horarios"
import Perfil    from "./pages/Perfil"
import Notificacoes from "./pages/Notificacoes"
import MinhasEscalas from "./pages/MinhasEscalas"
import GerenciarEscalas from "./pages/GerenciarEscalas"
import SolicitarOracao from "./pages/SolicitarOracao"
import MinhasOracoes from "./pages/MinhasOracoes"
import MinhasReunioes from "./pages/MinhasReunioes"
import GerenciarReunioes from "./pages/GerenciarReunioes"
import TrocarSenha from "./pages/TrocarSenha"
import MinhaCelula from "./pages/MinhaCelula"
import GerenciarCelulas from "./pages/GerenciarCelulas"
import Eventos from "./pages/Eventos"
import EventoDetalhe from "./pages/EventoDetalhe"
import GerenciarPresencaEvento from "./pages/GerenciarPresencaEvento"
import BemEstar from "./pages/BemEstar"

const queryClient = new QueryClient()

const ROTAS_LIVRES_VISITANTE = ["/home", "/ao-vivo", "/midia", "/eventos"]

function AppRoutes() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  usePushNotifications(!!user)

  const { data: perfil } = useQuery({
    queryKey: ["meu-perfil"],
    queryFn: () => perfilApi.meuPerfil().then(r => (r.data as any).data ?? r.data),
    enabled: !!user,
  })

  const isVisitante = perfil?.tipoMembro === "Visitante"

  useEffect(() => {
    const onPushNavigate = (e: Event) => {
      const rota = (e as CustomEvent<string>).detail
      if (rota) navigate(rota)
    }
    window.addEventListener("push-navigate", onPushNavigate)
    return () => window.removeEventListener("push-navigate", onPushNavigate)
  }, [navigate])

  useEffect(() => {
    if (!user || !isVisitante) return
    const permitido = ROTAS_LIVRES_VISITANTE.includes(location.pathname) || location.pathname.startsWith("/noticia/") || location.pathname.startsWith("/eventos/")
    if (!permitido) navigate("/home", { replace: true })
  }, [user, isVisitante, location.pathname, navigate])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen text-gray-400">Carregando...</div>
  )

  return (
    <Routes>
      {!user ? (
        <>
          <Route path="/"          element={<BuscarIgreja />} />
          <Route path="/login"     element={<Login />} />
          <Route path="/register"  element={<Register />} />
          <Route path="/visitante" element={<CadastroVisitante />} />
          <Route path="/politica-de-privacidade" element={<PoliticaPrivacidade />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </>
      ) : (
        <>
          <Route path="/home"        element={<AppShell><Home />   <TabBar /></AppShell>} />
          <Route path="/noticia/:id" element={<AppShell><Noticia /><TabBar /></AppShell>} />
          <Route path="/ao-vivo"     element={<AppShell><AoVivo /> <TabBar /></AppShell>} />
          <Route path="/midia"       element={<AppShell><Midia />  <TabBar /></AppShell>} />
          <Route path="/igreja"      element={<AppShell><Igreja /> <TabBar /></AppShell>} />
          <Route path="/eventos"     element={<AppShell><Eventos /> <TabBar /></AppShell>} />
          <Route path="/eventos/:id" element={<AppShell><EventoDetalhe /></AppShell>} />
          <Route path="/eventos/gerenciar-presenca" element={<AppShell><GerenciarPresencaEvento /></AppShell>} />
          <Route path="/horarios"    element={<AppShell><Horarios /> <TabBar /></AppShell>} />
          <Route path="/perfil"         element={<AppShell><Perfil /> <TabBar /></AppShell>} />
          <Route path="/notificacoes"   element={<AppShell><Notificacoes /></AppShell>} />
          <Route path="/escalas"           element={<AppShell><MinhasEscalas /></AppShell>} />
          <Route path="/escalas/gerenciar" element={<AppShell><GerenciarEscalas /></AppShell>} />
          <Route path="/oracao"   element={<AppShell><SolicitarOracao /></AppShell>} />
          <Route path="/bem-estar" element={<AppShell><BemEstar /></AppShell>} />
          <Route path="/oracoes"  element={<AppShell><MinhasOracoes /></AppShell>} />
          <Route path="/reunioes"           element={<AppShell><MinhasReunioes /></AppShell>} />
          <Route path="/reunioes/gerenciar" element={<AppShell><GerenciarReunioes /></AppShell>} />
          <Route path="/trocar-senha"       element={<AppShell><TrocarSenha /></AppShell>} />
          <Route path="/celulas"           element={<AppShell><MinhaCelula /></AppShell>} />
          <Route path="/celulas/gerenciar" element={<AppShell><GerenciarCelulas /></AppShell>} />
          <Route path="*"            element={<Navigate to="/home" replace />} />
        </>
      )}
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
            <AtualizacaoBanner />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
