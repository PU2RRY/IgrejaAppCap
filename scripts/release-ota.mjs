// Empacota o build web atual (dist/) num zip e atualiza o manifesto de atualização OTA
// (latest.json) na pasta public/app-updates do IgrejaFront — que já é publicada junto
// com o site normal do IgrejaFront, sem precisar de nenhuma infraestrutura nova.
//
// Uso: node scripts/release-ota.mjs [versao]
// Se a versão não for informada, usa a versão do package.json.

import AdmZip from "adm-zip"
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const raizApp = join(__dirname, "..")
const raizFront = join(__dirname, "..", "..", "IgrejaFront")

const pkg = JSON.parse(readFileSync(join(raizApp, "package.json"), "utf-8"))
const versao = process.argv[2] || pkg.version

const distDir = join(raizApp, "dist")
if (!existsSync(distDir)) {
  console.error("Pasta dist/ não encontrada. Rode `npm run build` antes de gerar o pacote OTA.")
  process.exit(1)
}

const pastaDestino = join(raizFront, "public", "app-updates")
mkdirSync(pastaDestino, { recursive: true })

const nomeZip = `bundle-${versao}.zip`
const caminhoZip = join(pastaDestino, nomeZip)

const zip = new AdmZip()
zip.addLocalFolder(distDir)
zip.writeZip(caminhoZip)

const manifesto = {
  versao,
  url: `https://mixdoreino.com.br/app-updates/${nomeZip}`,
}
writeFileSync(join(pastaDestino, "latest.json"), JSON.stringify(manifesto, null, 2))

console.log(`Pacote OTA gerado: ${caminhoZip}`)
console.log(`Manifesto atualizado: ${join(pastaDestino, "latest.json")}`)
console.log(`\nPróximo passo: rode "npm run build" no IgrejaFront e suba o dist/ dele pro servidor,`)
console.log(`como já faz normalmente — o app-updates/ vai junto automaticamente.`)
