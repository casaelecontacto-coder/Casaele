import { google } from 'googleapis'

const SCOPES = ['https://www.googleapis.com/auth/drive.file']

let driveClient = null

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

  driveClient = google.drive({ version: 'v3', auth })
  return driveClient
}

const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || null

export { getDriveClient, DRIVE_FOLDER_ID }
