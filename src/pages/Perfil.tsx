import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "../contexts/AuthContext"
import { perfilApi } from "../api"

const STATUS_COLOR: Record<string, string> = { Ativo: "#16A34A", Pendente: "#D97706", Bloqueado: "#DC2626" }

interface MeuPerfil {
  nome: string
  email: string
  celular?: string
  fotoUrl?: string
  status: string
  nomeMembro?: string
  tipoMembro?: string
  statusMembro?: string
  dataNascimento?: string
  dataBatismo?: string
  dataMembro?: string
  funcaoFamilia?: string
  nomeFamilia?: string
  cidade?: string
  uf?: string
}

function fmtData(s?: string) {
  if (!s) return null
  const [ano, mes, dia] = s.split("-")
  return `${dia}/${mes}/${ano}`
}

export default function Perfil() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const { data: perfil } = useQuery({
    queryKey: ["meu-perfil"],
    queryFn: () => perfilApi.meuPerfil().then(r => r.data as MeuPerfil),
  })

  const handleLogout = () => {
    if (confirm("Deseja sair da sua conta?")) { logout(); navigate("/") }
  }

  const cor = STATUS_COLOR[user?.status ?? ""] ?? "#6B7280"

  return (
    <div className="pb-16">
      <div className="bg-indigo-600 flex flex-col items-center py-10 px-6">
        {perfil?.fotoUrl ? (
          <img src={perfil.fotoUrl} className="w-20 h-20 rounded-full object-cover mb-3 border-2 border-white" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-indigo-500 flex items-center justify-center text-white text-4xl font-bold mb-3">
            {user?.nome?.charAt(0).toUpperCase() ?? "?"}
          </div>
        )}
        <p className="text-white text-xl font-bold">{user?.nome}</p>
        <p className="text-indigo-200 text-sm mt-1">{user?.email}</p>
        <span className="mt-3 px-3 py-1 rounded-full text-xs font-bold"
          style={{ color: cor, backgroundColor: cor + "33" }}>
          {user?.status}
        </span>
      </div>

      <div className="p-4 space-y-3">
        {user?.status === "Pendente" && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 text-sm text-yellow-800">
            ⏳ Seu vínculo com a igreja está pendente de confirmação pelo administrador.
          </div>
        )}

        {perfil?.nomeMembro && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-2">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Dados do Membro</p>

            <InfoRow label="Nome" value={perfil.nomeMembro} />
            {perfil.tipoMembro && <InfoRow label="Tipo" value={perfil.tipoMembro} />}
            {perfil.statusMembro && <InfoRow label="Status" value={perfil.statusMembro} />}
            {perfil.celular && <InfoRow label="Celular" value={perfil.celular} />}
            {fmtData(perfil.dataNascimento) && <InfoRow label="Nascimento" value={fmtData(perfil.dataNascimento)!} />}
            {fmtData(perfil.dataBatismo) && <InfoRow label="Batismo" value={fmtData(perfil.dataBatismo)!} />}
            {fmtData(perfil.dataMembro) && <InfoRow label="Membro desde" value={fmtData(perfil.dataMembro)!} />}
            {perfil.nomeFamilia && <InfoRow label="Família" value={perfil.nomeFamilia} />}
            {perfil.funcaoFamilia && <InfoRow label="Função na Família" value={perfil.funcaoFamilia} />}
            {(perfil.cidade || perfil.uf) && <InfoRow label="Cidade" value={[perfil.cidade, perfil.uf].filter(Boolean).join("/")} />}
          </div>
        )}

        {!perfil?.nomeMembro && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-500">
            Sua conta ainda não está vinculada a um membro cadastrado.
          </div>
        )}

        <button onClick={() => navigate("/trocar-senha")}
          className="w-full bg-white border border-gray-200 rounded-xl p-4 text-left shadow-sm font-semibold text-gray-700">
          🔒 Trocar Senha
        </button>

        <button onClick={handleLogout}
          className="w-full bg-white border border-red-200 rounded-xl p-4 text-left shadow-sm font-semibold text-red-600">
          🚪 Sair
        </button>

        <p className="text-center text-xs text-gray-300 pt-2">Versão {__APP_VERSION__}</p>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm border-b border-gray-50 pb-1.5 last:border-0">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-800 font-medium text-right">{value}</span>
    </div>
  )
}
