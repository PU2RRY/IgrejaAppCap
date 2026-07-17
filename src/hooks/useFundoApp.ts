import { useQuery } from "@tanstack/react-query"
import { appConfigApi } from "../api"

export function useFundoApp() {
  const { data } = useQuery({
    queryKey: ["app-config"],
    queryFn: () => appConfigApi.obter().then(r => r.data as { fundoLoginUrl?: string | null }),
    staleTime: 5 * 60 * 1000,
  })
  return data?.fundoLoginUrl ?? null
}
