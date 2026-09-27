import { Readable } from 'stream'
import { getDriveClient, getDriveAccessToken, DRIVE_FOLDER_ID } from '../config/googleDriveConfig.js'

/**
 * Upload a file buffer to Google Drive
 * @param {Buffer} buffer - File buffer
 * @param {string} fileName - Original file name
 * @param {string} mimeType - MIME type of the file
 * @returns {{ fileId: string, fileName: string }}
 */
export async function uploadFileToDrive(buffer, fileName, mimeType) {
  const drive = getDriveClient()
  if (!drive) {
    throw new Error('Google Drive is not configured. Set GOOGLE_DRIVE_CLIENT_EMAIL, GOOGLE_DRIVE_PRIVATE_KEY, and GOOGLE_DRIVE_FOLDER_ID env vars.')
  }

  if (!DRIVE_FOLDER_ID) {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID is not set.')
  }

  const fileMetadata = {
    name: fileName,
    parents: [DRIVE_FOLDER_ID]
  }

  const media = {
    mimeType,
    body: Readable.from(buffer)
  }

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id, name, size'
  })

  console.log('[GoogleDrive] File uploaded:', response.data.id, response.data.name)

  return {
    fileId: response.data.id,
    fileName: response.data.name
  }
}

/**
 * Get a readable stream for a file from Google Drive
 * @param {string} fileId - Google Drive file ID
 * @returns {{ stream: ReadableStream, mimeType: string, size: number }}
 */
export async function getFileStreamFromDrive(fileId) {
  const drive = getDriveClient()
  if (!drive) {
    throw new Error('Google Drive is not configured.')
  }

  // Get file metadata first for mimeType and size
  const metadata = await drive.files.get({
    fileId,
    fields: 'name, mimeType, size'
  })

  // Get file content as stream
  const response = await drive.files.get({
    fileId,
    alt: 'media'
  }, {
    responseType: 'stream'
  })

  return {
    stream: response.data,
    mimeType: metadata.data.mimeType || 'application/octet-stream',
    size: parseInt(metadata.data.size, 10) || 0,
    fileName: metadata.data.name
  }
}

/**
 * A short-lived URL that downloads the file directly from Google — no
 * metadata round trip, no proxying through our server. The browser (or
 * whatever fetches it) does a plain GET and gets a native, streamed
 * response, unlike getFileStreamFromDrive's piped-through-Node stream.
 * The URL embeds a live OAuth access token (typically ~1hr lifetime); treat
 * it like any other presigned URL — don't log it or persist it anywhere.
 * @param {string} fileId - Google Drive file ID
 * @returns {string}
 */
export async function getSignedDriveUrl(fileId) {
  const token = await getDriveAccessToken()
  if (!token) {
    throw new Error('Google Drive is not configured.')
  }
  return `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&access_token=${encodeURIComponent(token)}`
}

/**
 * Delete a file from Google Drive
 * @param {string} fileId - Google Drive file ID
 */
export async function deleteFileFromDrive(fileId) {
  const drive = getDriveClient()
  if (!drive) {
    throw new Error('Google Drive is not configured.')
  }

  await drive.files.delete({ fileId })
  console.log('[GoogleDrive] File deleted:', fileId)
}
