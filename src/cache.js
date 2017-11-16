// Package Dependencies
const fs = require('fs-extra')
const path = require('path')

const FILE_DIR = path.join(__dirname, 'cache')
const FILE_PATH = path.join(FILE_DIR, 'cache.json')

/**
 * @typedef {Object} Cache
 * @property {string} id
 * @property {string} timestamp
 */

/**
 * @returns {Promise.<Cache[]>}
 */
const accessFile = async () => {
  await ensureFile()
  return fs.readJSON(FILE_PATH)
}

/**
 * @param {Cache[]} rows Cache Object
 * @returns {Promise.<void>}
 */
const saveFile = async rows => {
  await ensureFile()
  return fs.writeJSON(FILE_PATH, rows)
}

/**
 * @param {Cache} row Cache Object
 * @returns {Promise.<void>}
 */
const addRow = async row => {
  let json = await accessFile()
  json.push(row)
  return saveFile(json)
}

const ensureFile = async () => {
  await fs.ensureDir(FILE_DIR)
  await fs.ensureFile(FILE_PATH)
  try {
    return await fs.readJSON(FILE_PATH)
  } catch (err) {
    return fs.writeJSON(FILE_PATH, {})
  }
}

module.exports = {
  accessFile,
  saveFile,
  addRow,
}
