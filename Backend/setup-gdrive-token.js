/**
 * ONE-TIME SETUP: Run to get a Google Drive refresh token.
 * Usage: node setup-gdrive-token.js YOUR_CLIENT_ID YOUR_CLIENT_SECRET
 */
import { google } from 'googleapis'
import http from 'http'
import { URL } from 'url'

const clientId = process.argv[2]
const clientSecret = process.argv[3]

if (!clientId || !clientSecret) {
  console.log('Usage: node setup-gdrive-token.js <CLIENT_ID> <CLIENT_SECRET>')
  process.exit(1)
}

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, 'http://localhost:3333')

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/drive.file']
})

console.log('\n1. Open this URL in your browser:\n')
console.log(authUrl)
console.log('\n2. Sign in and allow access\n')

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:3333')
  const code = url.searchParams.get('code')
  if (!code) { res.writeHead(400); res.end('No code'); return }

  try {
    const { tokens } = await oauth2Client.getToken(code)
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end('<h1>Success! Close this tab.</h1>')
    console.log('\n=== Add these to .env ===\n')
    console.log(`GOOGLE_DRIVE_CLIENT_ID=${clientId}`)
    console.log(`GOOGLE_DRIVE_CLIENT_SECRET=${clientSecret}`)
    console.log(`GOOGLE_DRIVE_REFRESH_TOKEN=${tokens.refresh_token}`)
    server.close()
    process.exit(0)
  } catch (err) {
    res.writeHead(500); res.end('Error: ' + err.message)
    console.error('Error:', err.message)
  }
})

server.listen(3333, () => console.log('Waiting for authorization...'))
