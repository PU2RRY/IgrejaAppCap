import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { perfilApi } from "../api"

export default function TrocarSenha() {
  const navigate = useNavigate()
  const [senhaAtual, setSenhaAtual] = useState("")
  const [senhaNova, setSenhaNova] = useState("")
  const [confirmar, setConfirmar] = useState("")
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  const trocar = useMutation({
    mutationFn: () => perfilApi.trocarSenha(senhaAtual, senhaNova),
    onSuccess: () => setSucesso(true),
    onError: (e: any) => setErro(e.response?.data?.message ?? "Não foi possível trocar a senha."),
  })

  function submit() {
    setErro(null)
    if (senhaNova.length < 6) { setErro("A nova senha deve ter pelo menos 6 caracteres."); return }
    if (senhaNova !== confirmar) { setErro("As senhas não coincidem."); return }
    trocar.mutate()
  }

  if (sucesso) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gray-50 dark:bg-gray-900 text-center">
        <p className="text-6xl mb-4">✅</p>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Senha alterada!</h1>
        <button onClick={() => navigate("/perfil")} className="bg-indigo-600 text-white font-bold px-8 py-3 rounded-xl mt-4">
          Voltar ao Perfil
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-10">
      <div className="bg-gray-900 dark:bg-black px-5 pt-10 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-white text-xl">←</button>
        <h1 className="text-white text-xl font-bold">Trocar Senha</h1>
      </div>

      <div className="p-4 space-y-4">
        {erro && <div className="bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{erro}</div>}

        <div>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Senha atual</label>
          <input type="password" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)}
            className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-xl p-3 mt-1" />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Nova senha</label>
          <input type="password" value={senhaNova} onChange={e => setSenhaNova(e.target.value)}
            className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-xl p-3 mt-1" />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Confirmar nova senha</label>
          <input type="password" value={confirmar} onChange={e => setConfirmar(e.target.value)}
            className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-xl p-3 mt-1" />
        </div>

        <button onClick={submit} disabled={!senhaAtual || !senhaNova || !confirmar || trocar.isPending}
          className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl disabled:opacity-50">
          {trocar.isPending ? "Salvando..." : "Salvar Nova Senha"}
        </button>
      </div>
    </div>
  )
}
