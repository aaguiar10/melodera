import { Vibrant } from 'node-vibrant/node'

export type PaletteColors = {
  vibrant?: string
  muted?: string
  darkVibrant?: string
  darkMuted?: string
  lightVibrant?: string
  lightMuted?: string
  [name: string]: string | undefined
}

function camelCase (paletteName: string) {
  return paletteName
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word: string, index: number) {
      return index === 0 ? word.toLowerCase() : word.toUpperCase()
    })
    .replace(/\s+/g, '')
}

export async function getPalette (src: string) {
  const palette = await Vibrant.from(src).getPalette()
  const setPaletteColor = (acc: PaletteColors, paletteName: string) => {
    const color = palette[paletteName]?.hex
    const name = camelCase(paletteName)
    return { ...acc, [name]: color }
  }

  return Object.keys(palette).reduce<PaletteColors>(setPaletteColor, {})
}
