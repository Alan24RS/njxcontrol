#!/usr/bin/env node

/**
 * Cross-platform database reset script
 * Automatically detects the OS and runs the appropriate script
 */

const { spawn } = require('child_process')
const path = require('path')
const os = require('os')

const platform = os.platform()
const scriptsDir = path.join(__dirname)

let command, args, shell

if (platform === 'win32') {
  // Windows: use PowerShell script
  command = 'powershell.exe'
  args = [
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    path.join(scriptsDir, 'reset-local-db.ps1')
  ]
  shell = false
} else {
  // Unix-like (Linux, macOS): use bash script
  command = 'bash'
  args = [path.join(scriptsDir, 'reset-local-db.sh')]
  shell = false
}

console.log(`🖥️  Detected platform: ${platform}`)
console.log(`📝 Running: ${command} ${args.join(' ')}\n`)

const child = spawn(command, args, {
  stdio: 'inherit',
  shell,
  cwd: path.join(__dirname, '..')
})

child.on('error', (error) => {
  console.error(`❌ Error executing script: ${error.message}`)
  process.exit(1)
})

child.on('close', (code) => {
  if (code !== 0) {
    console.error(`\n❌ Script exited with code ${code}`)
    process.exit(code)
  }
  process.exit(0)
})
