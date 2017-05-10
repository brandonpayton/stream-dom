import fs from 'fs'
import path from 'path'

import {transform} from 'babel-core'
import esprima from 'esprima'
import {assert} from 'chai'

// TODO: Use parser that allows us to test rest properties

// Use package root so package.json `main` is tested
import streamDomTransform from '..'

function getPluginOptions (basePath) {
  try {
    return JSON.parse(fs.readFileSync(path.join(basePath, `options.json`)))
  } catch (err) {
    if (err.code === `ENOENT`) {
      return {}
    } else {
      throw err
    }
  }
}

suite(`babel-plugin-transform-stream-dom-jsx`, function () {
  const fixturesPath = path.join(__dirname, `fixtures`)

  const testTransform = entry => {
    const readOptions = { encoding: `utf8` }
    const rawInput = fs.readFileSync(path.join(entry.path, `actual.js`), readOptions)
    const pluginOptions = getPluginOptions(entry.path)
    const expectedOutputAst = astForCompare(
      fs.readFileSync(path.join(entry.path, `expected.js`), readOptions)
    )
    const actualOutputAst = astForCompare(
      transform(rawInput, {
        plugins: [
          [ streamDomTransform, pluginOptions ]
        ]
      }).code
    )

    assert.deepEqual(actualOutputAst, expectedOutputAst)
  }

  fs.readdirSync(fixturesPath)
    .map(entryName => ({
      name: entryName,
      path: path.join(fixturesPath, entryName)
    }))
    .filter(entry => (
      fs.statSync(entry.path).isDirectory() &&
      !/disabled\./.test(entry.name)
    ))
    .forEach(entry => {
      test(entry.name, testTransform.bind(undefined, entry))
    })
})

function astForCompare (text) {
  return sanitize(esprima.parse(text))

  function sanitize (o) {
    // Remove the `raw` property from AST nodes so assertions don't fail on
    // textual differences like whitespace and quote type
    `raw` in o && (o.raw = ``)

    Object.keys(o).forEach(key => {
      const value = o[key]

      if (Array.isArray(value)) {
        value.forEach(sanitize)
      } else if (typeof value === `object`) {
        sanitize(value)
      }
    })

    return o
  }
}
