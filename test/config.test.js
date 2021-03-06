jest.setTimeout(60000)

const { join } = require('path')
const { remove } = require('fs-extra')
const { Nuxt, Builder, loadNuxtConfig } = require('nuxt')
const request = require('request-promise-native')
const getPort = require('get-port')
const logger = require('@/logger')

logger.mockTypes(() => jest.fn())

let nuxt, port

const url = path => `http://localhost:${port}${path}`
const get = path => request(url(path))

describe('config', () => {
  beforeAll(async () => {
    const config = await loadNuxtConfig({
      configFile: 'example/nuxt.config.js'
    })
    config.dev = false
    config.modules = [require(('@/module'))]
    Object.assign(config.tailwindcss, {
      configPath: 'custom/tailwind.js',
      cssPath: 'custom/tailwind.css'
    })
    nuxt = new Nuxt(config)
    await nuxt.ready()
    await new Builder(nuxt).build()
    port = await getPort()
    await nuxt.listen(port)
  })

  afterAll(async () => {
    await nuxt.close()
    await remove(join(nuxt.options.srcDir, 'custom'))
  })

  beforeEach(() => {
    logger.clear()
  })

  test('render', async () => {
    const html = await get('/')
    expect(html).toContain('Get the coolest t-shirts from our brand new store')
    expect(html).not.toContain('.bg-pink-700')
  })

  test('custom paths', () => {
    expect(logger.success).toHaveBeenNthCalledWith(1, `~/${nuxt.options.tailwindcss.configPath} created`)
    expect(logger.success).toHaveBeenNthCalledWith(2, `~/${nuxt.options.tailwindcss.cssPath} created`)
  })

  test('include custom tailwind.css file in project css', () => {
    expect(nuxt.options.css).toHaveLength(1)
    expect(nuxt.options.css).toContain(join(nuxt.options.srcDir, nuxt.options.tailwindcss.cssPath))
  })
})
