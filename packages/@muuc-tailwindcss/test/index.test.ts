import path from 'node:path'
import tailwindcss from 'tailwindcss'
import postcss from 'postcss'
import { describe, expect, it } from 'vitest'
import prettier from '@prettier/sync'
import { findUpSync } from 'find-up'
import fg from 'fast-glob'

import muuc from '../src'

const html = String.raw
const css = String.raw

function format(input: string) {
  return prettier.format(input.replace(/\n/g, ''), {
    parser: 'css',
    printWidth: 200,
  })
}

expect.extend({
  toMatchFormattedCss(received: string, expected: string) {
    const options = {
      comment: 'stripped(received) === stripped(expected)',
      isNot: this.isNot,
      promise: this.promise,
    }

    const formattedReceived = format(received)
    const formattedExpected = format(expected)

    const pass = formattedReceived === formattedExpected

    const message = pass
      ? () => {
          return `${this.utils.matcherHint('toMatchFormattedCss', undefined, undefined, options)}`
            + '\n\n'
            + `Expected: not ${this.utils.printExpected(formattedReceived)}\n`
            + `Received: ${this.utils.printReceived(formattedExpected)}`
        }
      : () => {
          const actual = formattedReceived
          const expected = formattedExpected

          const diffString = this.utils.diff(expected, actual, {
            expand: this.expand,
          })
          return (
            `${this.utils.matcherHint('toMatchFormattedCss', undefined, undefined, options)}`
              + '\n\n'
              + `${diffString && diffString.includes('- Expect')
                ? `Difference:\n\n${diffString}`
                : `Expected: ${this.utils.printExpected(expected)}\n`
                  + `Received: ${this.utils.printReceived(actual)}`}`
          )
        }
    return { actual: received, message, pass }
  },
})

function run(input: string, config: any, plugin = tailwindcss) {
  const { currentTestName } = expect.getState()

  return postcss(plugin(config)).process(input, {
    from: `${path.resolve(__filename)}?test=${currentTestName}`,
  })
}

describe('muuc', () => {
  it('should generate css for source files classes', async () => {
    const config = {
      content: [{ raw: html`<Input class="el-input__wrapper:border"></Input>` }],
      plugins: [muuc({
        source: findUpSync('node_modules/element-plus/theme-chalk/el-input.css')!,
      })],
    }

    return run('@tailwind utilities', config).then((result) => {
      expect(result.css).toMatchFormattedCss(css`
        .el-input__wrapper\:border.el-input__wrapper {
          border-width: 1px;
        }
        .el-input__wrapper\:border .el-input__wrapper {
          border-width: 1px;
        }
      `)
    })
  })

  it('should generate css for pseudo element', async () => {
    const config = {
      content: [{ raw: html`<Input class="el-input__inner!placeholder:text-orange-500"></Input>` }],
      plugins: [muuc({
        source: findUpSync('node_modules/element-plus/theme-chalk/el-input.css')!,
      })],
    }

    return run('@tailwind utilities', config).then((result) => {
      expect(result.css).toMatchFormattedCss(css`
        .el-input__inner\!placeholder\:text-orange-500.el-input__inner::placeholder {
          --tw-text-opacity: 1;
          color: rgb(249 115 22 / var(--tw-text-opacity));
        }
        .el-input__inner\!placeholder\:text-orange-500 .el-input__inner::placeholder {
          --tw-text-opacity: 1;
          color: rgb(249 115 22 / var(--tw-text-opacity));
        }
      `)
    })
  })

  it('should generate css for pseudo classes', async () => {
    const config = {
      content: [{ raw: html`<Input class="el-input__inner!focus:text-red-500"></Input>` }],
      plugins: [muuc({
        source: findUpSync('node_modules/element-plus/theme-chalk/el-input.css')!,
      })],
    }

    return run('@tailwind utilities', config).then((result) => {
      expect(result.css).toMatchFormattedCss(css`
        .el-input__inner\!focus\:text-red-500.el-input__inner:focus {
          --tw-text-opacity: 1;
          color: rgb(239 68 68 / var(--tw-text-opacity));
        }
        .el-input__inner\!focus\:text-red-500 .el-input__inner:focus {
          --tw-text-opacity: 1;
          color: rgb(239 68 68 / var(--tw-text-opacity));
        }
      `)
    })
  })

  it('should generate css for class.class selector', async () => {
    const config = {
      content: [{ raw: html`<Input class="el-input__wrapper.is-focus:shadow"></Input>` }],
      plugins: [muuc({
        source: findUpSync('node_modules/element-plus/theme-chalk/el-input.css')!,
      })],
    }

    return run('@tailwind utilities', config).then((result) => {
      expect(result.css).toMatchFormattedCss(css`
        .el-input__wrapper\.is-focus\:shadow.el-input__wrapper.is-focus {
          --tw-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
          --tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);
          box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
        }
        .el-input__wrapper\.is-focus\:shadow .el-input__wrapper.is-focus {
          --tw-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
          --tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);
          box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
        }
      `)
    })
  })

  it('should generate css for element.class selector', async () => {
    const config = {
      content: [{ raw: html`<Input class="el-input-group__append|button.el-button:bg-red-500"></Input>` }],
      plugins: [muuc({
        source: findUpSync('node_modules/element-plus/theme-chalk/el-input.css')!,
      })],
    }

    return run('@tailwind utilities', config).then((result) => {
      expect(result.css).toMatchFormattedCss(css`
        .el-input-group__append\|button\.el-button\:bg-red-500.el-input-group__append button.el-button {
          --tw-bg-opacity: 1;
          background-color: rgb(239 68 68 / var(--tw-bg-opacity));
        }
        .el-input-group__append\|button\.el-button\:bg-red-500 .el-input-group__append button.el-button {
          --tw-bg-opacity: 1;
          background-color: rgb(239 68 68 / var(--tw-bg-opacity));
        }
      `)
    })
  })

  it('should generate css for descendant selector', async () => {
    const config = {
      content: [{ raw: html`<Input class="el-input--large|el-input__inner:text-orange-500"></Input>` }], // change placeholder color to black
      plugins: [muuc({
        source: findUpSync('node_modules/element-plus/theme-chalk/el-input.css')!,
      })],
    }

    return run('@tailwind utilities', config).then((result) => {
      expect(result.css).toMatchFormattedCss(css`
        .el-input--large\|el-input__inner\:text-orange-500.el-input--large .el-input__inner {
          --tw-text-opacity: 1;
          color: rgb(249 115 22 / var(--tw-text-opacity));
        }
        .el-input--large\|el-input__inner\:text-orange-500 .el-input--large .el-input__inner {
          --tw-text-opacity: 1;
          color: rgb(249 115 22 / var(--tw-text-opacity));
        }
      `)
    })
  })

  it('should generate css for child selector', async () => { // > arbitrary
    const config = {
      content: [{ raw: html`<Input class="el-input-group--prepend>el-input__wrapper:border-none"></Input>` }], // >
      plugins: [muuc({
        source: findUpSync('node_modules/element-plus/theme-chalk/el-input.css')!,
      })],
    }

    return run('@tailwind utilities', config).then((result) => {
      expect(result.css).toMatchFormattedCss(css`
        .el-input__wrapper\:border-none.el-input__wrapper {
          border-style: none;
        }
        .el-input__wrapper\:border-none .el-input__wrapper {
          border-style: none;
        }
        .el-input-group--prepend\>el-input__wrapper\:border-none.el-input-group--prepend>.el-input__wrapper {
          border-style: none;
        }
        .el-input-group--prepend\>el-input__wrapper\:border-none .el-input-group--prepend>.el-input__wrapper {
          border-style: none;
        }
      `)
    })
  })

  // it('should generate css for sibling selector', async () => { // ~
  //   const config = {
  //     content: [{ raw: html`<Input class="el-input--large|el-input__inner:text-orange-500"></Input>` }], // change placeholder color to black
  //     plugins: [muuc({
  //       source: findUpSync('node_modules/element-plus/theme-chalk/el-input.css')!,
  //       ignore: ['**/el-var.css'],
  //     })],
  //   }

  //   return run('@tailwind utilities', config).then((result) => {
  //     expect(result.css).toMatchFormattedCss(css`
  //       .el-input--large\|el-input__inner\:text-orange-500.el-input--large .el-input__inner {
  //           --tw-text-opacity: 1;
  //           color: rgb(249 115 22 / var(--tw-text-opacity));
  //       }
  //       .el-input--large\|el-input__inner\:text-orange-500 .el-input--large .el-input__inner {
  //           --tw-text-opacity: 1;
  //           color: rgb(249 115 22 / var(--tw-text-opacity));
  //       }
  //     `)
  //   })
  // })

  it('should generate css for next sibling selector', async () => { // +
    const config = {
      content: [{ raw: html`<Input class="el-button+el-button:text-orange-500"></Input>` }], // change placeholder color to black
      plugins: [muuc({
        source: findUpSync('node_modules/element-plus/theme-chalk/el-button.css')!,
      })],
    }

    return run('@tailwind utilities', config).then((result) => {
      expect(result.css).toMatchFormattedCss(css`
        .el-button\+el-button\:text-orange-500.el-button+.el-button {
          --tw-text-opacity: 1;
          color: rgb(249 115 22 / var(--tw-text-opacity));
        }
        .el-button\+el-button\:text-orange-500 .el-button+.el-button {
          --tw-text-opacity: 1;
          color: rgb(249 115 22 / var(--tw-text-opacity));
        }
      `)
    })
  })
})

describe('support glob path', () => {
  const themeDir = findUpSync('node_modules/element-plus/theme-chalk', { type: 'directory' })!
  const source = fg
    .sync('*.css', { cwd: themeDir })
    .filter(fileName => fileName.startsWith('el-'))
    .map(fileName => path.join(themeDir, fileName))

  it('should generate css for source files', async () => {
    const config = {
      content: [{ raw: html`<div class="lui-input__wrapper:border"></div>` }],
      plugins: [muuc({
        source,
        ignore: ['**/el-var.css'],
        namespace: 'ep',
        prefix: 'lui',
      })],
    }

    return run('@tailwind utilities', config).then((result) => {
      expect(result.css).toMatchFormattedCss(css`
        .lui-input__wrapper\:border.ep-input__wrapper {
          border-width: 1px;
        }
        .lui-input__wrapper\:border .ep-input__wrapper {
          border-width: 1px;
        }
      `)
    })
  })

  it('should generate css for pseudo classes', async () => {
    const config = {
      content: [{ raw: html`<Input class="lui-input__inner!focus:text-red-500"></Input>` }],
      plugins: [muuc({
        source,
        namespace: 'ep',
        prefix: 'lui',
      })],
    }

    return run('@tailwind utilities', config).then((result) => {
      expect(result.css).toMatchFormattedCss(css`
        .lui-input__inner\!focus\:text-red-500.ep-input__inner:focus {
          --tw-text-opacity: 1;
          color: rgb(239 68 68 / var(--tw-text-opacity));
        }
        .lui-input__inner\!focus\:text-red-500 .ep-input__inner:focus {
          --tw-text-opacity: 1;
          color: rgb(239 68 68 / var(--tw-text-opacity));
        }
      `)
    })
  })

  it('should generate css for class.class selector', async () => {
    const config = {
      content: [{ raw: html`<Input class="lui-input__wrapper.is-focus:shadow"></Input>` }],
      plugins: [muuc({
        source,
        namespace: 'ep',
        prefix: 'lui',
      })],
    }

    return run('@tailwind utilities', config).then((result) => {
      expect(result.css).toMatchFormattedCss(css`
        .lui-input__wrapper\.is-focus\:shadow.ep-input__wrapper.is-focus {
          --tw-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
          --tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);
          box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
        }
        .lui-input__wrapper\.is-focus\:shadow .ep-input__wrapper.is-focus {
          --tw-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
          --tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);
          box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
        }
      `)
    })
  })
})

describe('custom namespace', () => {
  it('should generate css for source files', async () => {
    const config = {
      content: [{ raw: html`<div class="ui-input__wrapper:border"></div>` }],
      plugins: [muuc({
        source: findUpSync('node_modules/element-plus/theme-chalk/el-input.css')!,
        namespace: 'ep',
      })],
    }

    return run('@tailwind utilities', config).then((result) => {
      expect(result.css).toMatchFormattedCss(css`
        .ui-input__wrapper\:border.ep-input__wrapper {
          border-width: 1px;
        }
        .ui-input__wrapper\:border .ep-input__wrapper {
          border-width: 1px;
        }
      `)
    })
  })

  it('should generate css for pseudo classes', async () => {
    const config = {
      content: [{ raw: html`<Input class="ui-input__inner!focus:text-red-500"></Input>` }],
      plugins: [muuc({
        source: findUpSync('node_modules/element-plus/theme-chalk/el-input.css')!,
        namespace: 'ep',
      })],
    }

    return run('@tailwind utilities', config).then((result) => {
      expect(result.css).toMatchFormattedCss(css`
        .ui-input__inner\!focus\:text-red-500.ep-input__inner:focus {
          --tw-text-opacity: 1;
          color: rgb(239 68 68 / var(--tw-text-opacity));
        }
        .ui-input__inner\!focus\:text-red-500 .ep-input__inner:focus {
          --tw-text-opacity: 1;
          color: rgb(239 68 68 / var(--tw-text-opacity));
        }
      `)
    })
  })

  it('should generate css for class.class selector', async () => {
    const config = {
      content: [{ raw: html`<Input class="ui-input__wrapper.is-focus:shadow"></Input>` }],
      plugins: [muuc({
        source: findUpSync('node_modules/element-plus/theme-chalk/el-input.css')!,
        namespace: 'ep',
      })],
    }

    return run('@tailwind utilities', config).then((result) => {
      expect(result.css).toMatchFormattedCss(css`
        .ui-input__wrapper\.is-focus\:shadow.ep-input__wrapper.is-focus {
          --tw-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
          --tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);
          box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
        }
        .ui-input__wrapper\.is-focus\:shadow .ep-input__wrapper.is-focus {
          --tw-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
          --tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);
          box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
        }
      `)
    })
  })
})

describe('custom prefix', () => {
  it('should generate css for source files', async () => {
    const config = {
      content: [{ raw: html`<div class="lui-input__wrapper:border"></div>` }],
      plugins: [muuc({
        source: findUpSync('node_modules/element-plus/theme-chalk/el-input.css')!,
        namespace: 'ep',
        prefix: 'lui',
      })],
    }

    return run('@tailwind utilities', config).then((result) => {
      expect(result.css).toMatchFormattedCss(css`
        .lui-input__wrapper\:border.ep-input__wrapper {
          border-width: 1px;
        }
        .lui-input__wrapper\:border .ep-input__wrapper {
          border-width: 1px;
        }
      `)
    })
  })

  it('should generate css for pseudo classes', async () => {
    const config = {
      content: [{ raw: html`<Input class="lui-input__inner!focus:text-red-500"></Input>` }],
      plugins: [muuc({
        source: findUpSync('node_modules/element-plus/theme-chalk/el-input.css')!,
        namespace: 'ep',
        prefix: 'lui',
      })],
    }

    return run('@tailwind utilities', config).then((result) => {
      expect(result.css).toMatchFormattedCss(css`
        .lui-input__inner\!focus\:text-red-500.ep-input__inner:focus {
          --tw-text-opacity: 1;
          color: rgb(239 68 68 / var(--tw-text-opacity));
        }
        .lui-input__inner\!focus\:text-red-500 .ep-input__inner:focus {
          --tw-text-opacity: 1;
          color: rgb(239 68 68 / var(--tw-text-opacity));
        }
      `)
    })
  })

  it('should generate css for class.class selector', async () => {
    const config = {
      content: [{ raw: html`<Input class="lui-input__wrapper.is-focus:shadow"></Input>` }],
      plugins: [muuc({
        source: findUpSync('node_modules/element-plus/theme-chalk/el-input.css')!,
        namespace: 'ep',
        prefix: 'lui',
      })],
    }

    return run('@tailwind utilities', config).then((result) => {
      expect(result.css).toMatchFormattedCss(css`
        .lui-input__wrapper\.is-focus\:shadow.ep-input__wrapper.is-focus {
          --tw-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
          --tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);
          box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
        }
        .lui-input__wrapper\.is-focus\:shadow .ep-input__wrapper.is-focus {
          --tw-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
          --tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);
          box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
        }
      `)
    })
  })
})

describe('custom processSelector', () => {
  it('should generate css for source files', async () => {
    const config = {
      content: [{ raw: html`<div class="ui-input__wrapper:border"></div>` }],
      plugins: [muuc({
        source: findUpSync('node_modules/element-plus/theme-chalk/el-input.css')!,
        namespace: 'ep',
        processSelector(selector, namespace) {
          return selector.replace(/el-/g, `${namespace!}-`)
        },
      })],
    }

    return run('@tailwind utilities', config).then((result) => {
      expect(result.css).toMatchFormattedCss(css`
        .ui-input__wrapper\:border.ep-input__wrapper {
          border-width: 1px;
        }
        .ui-input__wrapper\:border .ep-input__wrapper {
          border-width: 1px;
        }
      `)
    })
  })

  it('should generate css for pseudo classes', async () => {
    const config = {
      content: [{ raw: html`<Input class="ui-input__inner!focus:text-red-500"></Input>` }],
      plugins: [muuc({
        source: findUpSync('node_modules/element-plus/theme-chalk/el-input.css')!,
        namespace: 'ep',
        processSelector(selector, namespace) {
          return selector.replace(/el-/g, `${namespace!}-`)
        },
      })],
    }

    return run('@tailwind utilities', config).then((result) => {
      expect(result.css).toMatchFormattedCss(css`
        .ui-input__inner\!focus\:text-red-500.ep-input__inner:focus {
          --tw-text-opacity: 1;
          color: rgb(239 68 68 / var(--tw-text-opacity));
        }
        .ui-input__inner\!focus\:text-red-500 .ep-input__inner:focus {
          --tw-text-opacity: 1;
          color: rgb(239 68 68 / var(--tw-text-opacity));
        }
      `)
    })
  })

  it('should generate css for class.class selector', async () => {
    const config = {
      content: [{ raw: html`<Input class="ui-input__wrapper.is-focus:shadow"></Input>` }],
      plugins: [muuc({
        source: findUpSync('node_modules/element-plus/theme-chalk/el-input.css')!,
        namespace: 'ep',
        processSelector(selector, namespace) {
          return selector.replace(/el-/g, `${namespace!}-`)
        },
      })],
    }

    return run('@tailwind utilities', config).then((result) => {
      expect(result.css).toMatchFormattedCss(css`
        .ui-input__wrapper\.is-focus\:shadow.ep-input__wrapper.is-focus {
          --tw-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
          --tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);
          box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
        }
        .ui-input__wrapper\.is-focus\:shadow .ep-input__wrapper.is-focus {
          --tw-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
          --tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);
          box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
        }
      `)
    })
  })
})

describe('support scss/sass files', () => {
  it('should generate css for source files', async () => {
    const config = {
      content: [{ raw: html`<div class="lui-input__wrapper:border"></div>` }],
      plugins: [muuc({
        source: findUpSync('node_modules/element-plus/theme-chalk/src/input.scss')!,
        namespace: 'ep',
        prefix: 'lui',
      })],
    }

    return run('@tailwind utilities', config).then((result) => {
      expect(result.css).toMatchFormattedCss(css`
        .lui-input__wrapper\:border.ep-input__wrapper {
          border-width: 1px;
        }
        .lui-input__wrapper\:border .ep-input__wrapper {
          border-width: 1px;
        }
      `)
    })
  })

  it('should generate css for pseudo classes', async () => {
    const config = {
      content: [{ raw: html`<Input class="lui-input__inner!focus:text-red-500"></Input>` }],
      plugins: [muuc({
        source: findUpSync('node_modules/element-plus/theme-chalk/src/input.scss')!,
        namespace: 'ep',
        prefix: 'lui',
      })],
    }

    return run('@tailwind utilities', config).then((result) => {
      expect(result.css).toMatchFormattedCss(css`
        .lui-input__inner\!focus\:text-red-500.ep-input__inner:focus {
          --tw-text-opacity: 1;
          color: rgb(239 68 68 / var(--tw-text-opacity));
        }
        .lui-input__inner\!focus\:text-red-500 .ep-input__inner:focus {
          --tw-text-opacity: 1;
          color: rgb(239 68 68 / var(--tw-text-opacity));
        }
      `)
    })
  })

  it('should generate css for class.class selector', async () => {
    const config = {
      content: [{ raw: html`<Input class="lui-input__wrapper.is-focus:shadow"></Input>` }],
      plugins: [muuc({
        source: findUpSync('node_modules/element-plus/theme-chalk/src/input.scss')!,
        namespace: 'ep',
        prefix: 'lui',
      })],
    }

    return run('@tailwind utilities', config).then((result) => {
      expect(result.css).toMatchFormattedCss(css`
        .lui-input__wrapper\.is-focus\:shadow.ep-input__wrapper.is-focus {
          --tw-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
          --tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);
          box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
        }
        .lui-input__wrapper\.is-focus\:shadow .ep-input__wrapper.is-focus {
          --tw-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
          --tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);
          box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
        }
      `)
    })
  })
})
