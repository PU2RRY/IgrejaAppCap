import { useNavigate } from "react-router-dom"

export default function PoliticaPrivacidade() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-6">
      <button onClick={() => navigate(-1)} className="text-indigo-600 text-sm mb-4">← Voltar</button>
      <h2 className="text-2xl font-bold mb-4">Política de Privacidade</h2>
      <div className="bg-white rounded-2xl p-6 shadow-sm text-sm text-gray-700 space-y-3">
        <p>
          Este é um texto provisório. O conteúdo definitivo desta política precisa ser revisado
          por um advogado antes da publicação, cobrindo pelo menos: quais dados são coletados,
          para qual finalidade, por quanto tempo são mantidos, com quem são compartilhados
          (ex.: processador de pagamentos Asaas) e como o titular pode exercer seus direitos
          previstos na LGPD (acesso, correção e exclusão dos dados).
        </p>
        <p>
          Para solicitar a exclusão ou correção dos seus dados, entre em contato com a
          administração desta igreja pelo app ou pessoalmente.
        </p>
      </div>
    </div>
  )
}
