import { api, pub } from "./client"

export const igrejasApi = {
  buscar: (termo?: string) => pub.get("/app/igrejas", { params: termo ? { termo } : {} }),
}

export const appConfigApi = {
  obter: () => pub.get<{ fundoLoginUrl?: string | null }>("/public/app-config"),
}

export const appAuthApi = {
  registrar: (tenantId: string, data: {
    nome: string; email: string; senha: string; celular?: string; dataNascimento?: string; aceitouTermos: boolean
    sexo?: string; cpf?: string; dataBatismo?: string; fotoUrl?: string
    cep?: string; endereco?: string; numero?: string; complemento?: string; bairro?: string; cidade?: string; uf?: string
  }) =>
    pub.post(`/app/igrejas/${tenantId}/registrar`, data),
  login: (tenantId: string, data: { email: string; senha: string }) =>
    pub.post(`/app/igrejas/${tenantId}/login`, data),
  refresh: (refreshToken: string) => pub.post("/app/refresh", { refreshToken }),
  registrarVisitante: (tenantId: string, data: { nome: string; celular?: string; email?: string; aceitouTermos: boolean }) =>
    pub.post(`/app/igrejas/${tenantId}/visitantes`, data),
  solicitarResetSenha: (tenantId: string, email: string) =>
    pub.post(`/app/igrejas/${tenantId}/esqueci-senha/solicitar`, { email }),
  confirmarResetSenha: (tenantId: string, data: { email: string; codigo: string; novaSenha: string }) =>
    pub.post(`/app/igrejas/${tenantId}/esqueci-senha/confirmar`, data),
}

export const conteudoApi = {
  noticias:      (tenantId: string)              => pub.get(`/app/igrejas/${tenantId}/noticias`),
  noticia:       (tenantId: string, id: number)  => pub.get(`/app/igrejas/${tenantId}/noticias/${id}`),
  midias:        (tenantId: string, cat?: string) => pub.get(`/app/igrejas/${tenantId}/midias`, { params: cat ? { categoria: cat } : {} }),
  institucional: (tenantId: string)              => pub.get(`/app/igrejas/${tenantId}/institucional`),
}

export const perfilApi = {
  atualizarFcm: (fcmToken: string) => api.put("/app/meu-perfil/fcm-token", { fcmToken }),
  meuPerfil: () => api.get("/app/meu-perfil"),
  atualizarFoto: (fotoUrl: string) => api.put("/app/meu-perfil/foto", { fotoUrl }),
  trocarSenha: (senhaAtual: string, senhaNova: string) =>
    api.put("/app/meu-perfil/senha", { senhaAtual, senhaNova }),
}

export const bemEstarApi = {
  emocoes: () => api.get("/app/bem-estar/emocoes"),
  status: () => api.get("/app/bem-estar/status"),
  registrar: (emocao: string, nota?: string) => api.post("/app/bem-estar", { emocao, nota: nota || null }),
}

export const oracoesApi = {
  tipos: () => api.get("/app/oracoes/tipos"),
  solicitar: (data: { idTipoOracao: number | null; descricao: string }) => api.post("/app/oracoes", data),
  minhas: () => api.get("/app/oracoes/minhas"),
  paraResponsavel: () => api.get("/app/oracoes/para-responsavel"),
  atualizarStatus: (id: number, status: "Pendente" | "EmOracao" | "Respondida") =>
    api.put(`/app/oracoes/${id}/status`, { status }),
}

export const reunioesApi = {
  tenhoAcesso: () => api.get("/app/reunioes/tenho-acesso"),
  tipos: () => api.get("/app/reunioes/tipos"),
  minhas: () => api.get("/app/reunioes/minhas"),
  gruposQueLidero: () => api.get("/app/reunioes/grupos-que-lidero"),
  membrosDoGrupo: (tipo: string, id: number) => api.get(`/app/reunioes/grupo/${tipo}/${id}/membros`),
  porGrupo: (tipo: string, id: number) => api.get(`/app/reunioes/grupo/${tipo}/${id}`),
  criar: (data: { idTipoReuniao: number; idDepartamento?: number; idMinisterio?: number; titulo: string; dataReuniao: string; horario?: string; localReuniao?: string; observacao?: string; idsMembros: number[] }) =>
    api.post("/app/reunioes", data),
  atualizar: (id: number, data: { titulo: string; dataReuniao: string; horario?: string; localReuniao?: string; observacao?: string; idsMembros: number[] }) =>
    api.put(`/app/reunioes/${id}`, data),
  excluir: (id: number) => api.delete(`/app/reunioes/${id}`),
  responder: (id: number, status: "Confirmado" | "Recusado") => api.put(`/app/reunioes/${id}/responder`, { status }),
}

export const membrosApi = {
  buscar: (nome: string) => api.get("/membros", { params: { nome, pageSize: 8 } }),
}

export const celulasApi = {
  tenhoAcesso: () => api.get("/app/celulas/tenho-acesso"),
  possoGerenciar: () => api.get("/app/celulas/posso-gerenciar"),
  minhas: () => api.get("/app/celulas/minhas"),
  todas: () => api.get("/app/celulas"),
  obter: (id: number) => api.get(`/app/celulas/${id}`),
  criar: (data: { nome: string; idLider?: number; idAnfitriao?: number; diaSemana?: string; horario?: string; cep?: string; endereco?: string; numero?: string; complemento?: string; bairro?: string; cidade?: string; uf?: string; capacidade?: number }) =>
    api.post("/app/celulas", data),
  atualizar: (id: number, data: any) => api.put(`/app/celulas/${id}`, { ...data, ativo: true }),
  excluir: (id: number) => api.delete(`/app/celulas/${id}`),
  adicionarMembro: (id: number, idMembro: number) => api.post(`/app/celulas/${id}/membros`, { idMembro }),
  removerMembro: (id: number, idMembro: number) => api.delete(`/app/celulas/${id}/membros/${idMembro}`),
}

export const eventosApi = {
  listar: () => api.get("/app/eventos"),
  obter: (id: number) => api.get(`/app/eventos/${id}`),
  inscrever: (id: number) => api.post(`/app/eventos/${id}/inscrever`),
  cancelar: (id: number) => api.delete(`/app/eventos/${id}/inscrever`),
  organizo: () => api.get("/app/eventos/organizo"),
  listarInscricoes: (id: number) => api.get(`/app/eventos/${id}/inscricoes`),
  atualizarPresenca: (id: number, idInscricao: number, presente: boolean) =>
    api.put(`/app/eventos/${id}/inscricoes/${idInscricao}/presenca`, { presente }),
}

export const escalasApi = {
  tenhoAcesso: () => api.get("/app/escalas/tenho-acesso"),
  minhas: () => api.get("/app/escalas/minhas"),
  ministeriosQueLidero: () => api.get("/app/escalas/ministerios-que-lidero"),
  membrosDoMinisterio: (idMinisterio: number) => api.get(`/app/escalas/ministerio/${idMinisterio}/membros`),
  porMinisterio: (idMinisterio: number) => api.get(`/app/escalas/ministerio/${idMinisterio}`),
  criar: (data: { idMinisterio: number; titulo: string; dataEvento: string; observacoes?: string; idsMembros: number[] }) =>
    api.post("/app/escalas", data),
  atualizar: (id: number, data: { titulo: string; dataEvento: string; observacoes?: string; idsMembros: number[] }) =>
    api.put(`/app/escalas/${id}`, data),
  excluir: (id: number) => api.delete(`/app/escalas/${id}`),
  responder: (id: number, status: "Confirmado" | "Recusado") =>
    api.put(`/app/escalas/${id}/responder`, { status }),
}
