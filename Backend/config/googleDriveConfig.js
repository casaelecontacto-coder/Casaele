import { google } from 'googleapis'

const SCOPES = ['https://www.googleapis.com/auth/drive.file']

let driveClient = null
// The OAuth2Client itself, kept alongside driveClient so a fresh access
// token can be minted (getDriveAccessToken below) without re-reading env
// vars or re-authing on every call. google-auth-library caches the token
// internally and only round-trips to Google when it's actually expired.
let authClient = null

function getDriveClient() {
  if (driveClient) return driveClient

  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    console.warn('[GoogleDrive] Missing Google Drive OAuth2 env vars (GOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_CLIENT_SECRET, GOOGLE_DRIVE_REFRESH_TOKEN)')
    return null
  }

  const auth = new google.auth.OAuth2(clientId, clientSecret)
  auth.setCredentials({ refresh_token: refreshToken })

  authClient = auth
  driveClient = google.drive({ version: 'v3', auth })
  return driveClient
}

// A short-lived access token for the configured Drive account, or null if
// Drive isn't configured. Used to build a signed `alt=media` URL so the
// browser can download/stream a file directly from Google instead of
// proxying the bytes through this server.
async function getDriveAccessToken() {
  getDriveClient() // ensures authClient is built (no-op if already built)
  if (!authClient) return null
  const { token } = await authClient.getAccessToken()
  return token || null
}

const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || null

export { getDriveClient, getDriveAccessToken, DRIVE_FOLDER_ID }
