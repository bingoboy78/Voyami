#!/usr/bin/env node

const { spawn } = require('node:child_process')
const fs = require('node:fs')

const env = { ...process.env }

;(async() => {
  // Ensure uploads directory exists on volume and is symlinked
  const publicUploads = '/app/public/uploads'
  const persistentUploads = '/data/uploads'

  if (!fs.existsSync(persistentUploads)) {
    fs.mkdirSync(persistentUploads, { recursive: true })
  }

  if (fs.existsSync(publicUploads) && !fs.lstatSync(publicUploads).isSymbolicLink()) {
    try {
      const files = fs.readdirSync(publicUploads)
      for (const file of files) {
        if (file !== '.gitkeep') {
          fs.copyFileSync(`${publicUploads}/${file}`, `${persistentUploads}/${file}`)
        }
      }
    } catch (e) {
      console.error('Error copying files:', e)
    }
    fs.rmSync(publicUploads, { recursive: true, force: true })
  }

  if (!fs.existsSync(publicUploads)) {
    fs.symlinkSync(persistentUploads, publicUploads)
    console.log('Created symlink from /app/public/uploads to /data/uploads')
  }

  // If running the web server then migrate existing database
  if (process.argv.slice(-3).join(' ') === 'npm run start') {
    const url = new URL(process.env.DATABASE_URL)
    const target = url.protocol === 'file:' && url.pathname
    const newDb = target && !fs.existsSync(target)
    await exec('npx prisma db push')
    if (newDb) await exec('npx prisma db seed')
    await exec('npx next build --experimental-build-mode generate')
  }

  // launch application
  await exec(process.argv.slice(2).join(' '))
})()

function exec(command) {
  const child = spawn(command, { shell: true, stdio: 'inherit', env })
  return new Promise((resolve, reject) => {
    child.on('exit', code => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`${command} failed rc=${code}`))
      }
    })
  })
}
