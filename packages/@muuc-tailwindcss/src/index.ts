import fs from 'node:fs'
import path from 'node:path'
import plugin from 'tailwindcss/plugin'
import postcss from 'postcss'
import fg from 'fast-glob'
import * as sass from 'sass'

interface Options {
  /**
   * Css file paths or glob patterns, will pass to fast-glob
   */
  source: string | string[]
  /**
   * The fast-glob ignore patterns
   * @default []
   */
  ignore?: string[]
  /**
   * Prefix of the selector
   * @default 'ui'
   */
  prefix?: string
  /**
   * Namespace of the UI library
   * @default ''
   */
  namespace?: string
  /**
   * Selector processing function, use to replace the selector namespace
   */
  processSelector?: (selector: string, namespace?: string) => string
}

export default plugin.withOptions<Options>((options) => {
  const { source, ignore = [], prefix = 'ui', namespace = '', processSelector } = options ?? {}

  const fileNameToSelectorsMap = fg
    .sync(source, { ignore })
    .reduce(
      (selectorMap, filePath) => {
        let fileContent
        if (filePath.endsWith('.scss') || filePath.endsWith('.sass')) {
          const result = sass.compile(filePath)
          fileContent = result.css
        }
        else {
          fileContent = fs.readFileSync(filePath, 'utf-8')
        }

        const { name: fileName } = path.parse(filePath)
        const root = postcss.parse(fileContent)
        const selectors: string[] = []
        root.walkRules((rule) => {
          selectors.push(...rule.selector.split(/\s*,\s*/))
        })
        return { ...selectorMap, [fileName]: [...new Set(selectors)] }
      },
      {} as Record<string, string[]>,
    )

  const getSelectorName = (selector: string) => {
    let newSelector = selector.replace(/\[class\*=(.*)\]/g, `$1`) // extract classes selectors

    if (namespace) {
      newSelector = newSelector.replace(RegExp(`([a-zA-Z]+)\\.${namespace}-`, 'g'), `$1.${prefix || namespace}-`)
        .replace(RegExp(`\\.${namespace}-`, 'g'), `${prefix || namespace}-`)
    }

    return newSelector.replace(/^\.|(\s+|\+|~|>)\./g, '$1')
      // .replace(/\./g, '_') // let dot go
      .replace(/::?/g, `!`) // pseudo classes and pseudo elements
      .replace(/\s+/g, '|') // join descendant selectors
  }

  return ({ addVariant }) => {
    Object.values(fileNameToSelectorsMap).forEach((selectors) => {
      selectors.forEach((selector) => {
        const newSelector = processSelector?.(selector, namespace)
            ?? (namespace ? selector.replace(/el-/g, `${namespace}-`) : selector)
        const name = getSelectorName(newSelector)
        addVariant(name, [`&${newSelector}`, `& ${newSelector}`])
      })
    })
  }
})
