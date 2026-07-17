import { useQuery } from "@tanstack/react-query"
import { useNavigate, useParams } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { conteudoApi } from "../api"

const URL_REGEX = /(https?:\/\/[^\s]+)/g

// Divide o texto nos trechos que são link e devolve os links como <a> clicável,
// preservando o resto do texto igual estava.
function linkify(texto: string) {
  return texto.split(URL_REGEX).map((parte, i) =>
    /^https?:\/\//.test(parte) ? (
      <a key={i} href={parte} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 underline break-all">
        {parte}
      </a>
    ) : (
      parte
    )
  )
}

export default function Noticia() {
  const { id } = useParams()
  const { tenantId } = useAuth()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ["noticia", id],
    queryFn: () => conteudoApi.noticia(tenantId!, Number(id)).then(r => r.data),
    enabled: !!tenantId && !!id,
  })

  if (isLoading) return <p className="text-center mt-20 text-gray-400 dark:text-gray-500">Carregando...</p>

  return (
    <div className="pb-16 dark:bg-gray-900 min-h-screen">
      <button onClick={() => navigate(-1)} className="p-4 text-indigo-600 text-sm">← Voltar</button>
      {data?.imagemUrl && <img src={data.imagemUrl} className="w-full h-56 object-cover" />}
      <div className="p-5">
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
          {data?.publicadoEm ? new Date(data.publicadoEm.endsWith("Z") ? data.publicadoEm : data.publicadoEm + "Z").toLocaleDateString("pt-BR", { dateStyle: "long" }) : ""}
        </p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{data?.titulo}</h1>
        {data?.subtitulo && <p className="text-gray-500 dark:text-gray-400 italic mb-4">{data.subtitulo}</p>}
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{data?.conteudo ? linkify(data.conteudo) : null}</p>
      </div>
    </div>
  )
}
