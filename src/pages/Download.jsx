import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiDownload, FiFile, FiAlertCircle, FiCheckCircle, FiClock, FiX } from 'react-icons/fi';
import Spinner from '../components/Common/Spinner';

const Download = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [downloadRecord, setDownloadRecord] = useState(null);
  const [error, setError] = useState(null);
  const [downloadingFile, setDownloadingFile] = useState(null);
  const [downloadMessage, setDownloadMessage] = useState('');

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  // Verify token and load download information
  useEffect(() => {
    const verifyToken = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${apiBaseUrl}/api/digital-downloads/verify/${token}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Invalid or expired download link');
        }

        const data = await response.json();
        setDownloadRecord(data);
        setError(null);
      } catch (err) {
        console.error('Token verification error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      verifyToken();
    }
  }, [token, apiBaseUrl]);

  // Handle file download
  const handleDownload = async (file) => {
    try {
      setDownloadingFile(file.fileName);
      setDownloadMessage('');

      // Track download and get signed URL
      const response = await fetch(`${apiBaseUrl}/api/digital-downloads/track/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.fileName,
          fileUrl: file.fileUrl
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Download failed');
      }

      const data = await response.json();

      // Open signed URL in new tab to download
      window.open(data.signedUrl, '_blank');

      // Update download count in UI
      setDownloadRecord(prev => ({
        ...prev,
        downloadCount: prev.downloadCount + 1,
        downloadsRemaining: prev.downloadsRemaining - 1,
        status: prev.downloadCount + 1 >= prev.maxDownloads ? 'exhausted' : prev.status
      }));

      setDownloadMessage(`✓ Download started for ${file.fileName}`);
      setTimeout(() => setDownloadMessage(''), 5000);

    } catch (err) {
      console.error('Download error:', err);
      alert(`Download failed: ${err.message}`);
    } finally {
      setDownloadingFile(null);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner />
          <p className="mt-4 text-gray-600">Verifying download link...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <FiX className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Download Link</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const isExpired = downloadRecord.status === 'expired' || new Date(downloadRecord.expiresAt) < new Date();
  const isExhausted = downloadRecord.status === 'exhausted' || downloadRecord.downloadsRemaining <= 0;
  const canDownload = !isExpired && !isExhausted;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {downloadRecord.productName}
              </h1>
              <p className="text-gray-600">
                Order #{downloadRecord.orderId}
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-lg">
              <FiCheckCircle className="w-5 h-5 text-red-600" />
              <span className="font-semibold text-red-600">{downloadRecord.files.length} Files</span>
            </div>
          </div>
        </div>

        {/* Download Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Download Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Downloads Remaining */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <FiDownload className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Downloads Remaining</p>
                <p className="text-2xl font-bold text-gray-900">
                  {downloadRecord.downloadsRemaining} / {downloadRecord.maxDownloads}
                </p>
              </div>
            </div>

            {/* Expiry Date */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FiClock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Valid Until</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(downloadRecord.expiresAt)}
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${
                canDownload ? 'bg-green-50' : 'bg-gray-100'
              }`}>
                <FiCheckCircle className={`w-6 h-6 ${
                  canDownload ? 'text-green-600' : 'text-gray-400'
                }`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className={`text-lg font-semibold ${
                  canDownload ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {isExpired ? 'Expired' : isExhausted ? 'Limit Reached' : 'Active'}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Warning Messages */}
        {!canDownload && (
          <div className={`rounded-lg p-4 mb-6 flex items-start gap-3 ${
            isExpired ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <FiAlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              isExpired ? 'text-red-600' : 'text-yellow-600'
            }`} />
            <div className="flex-1">
              <p className={`font-semibold ${
                isExpired ? 'text-red-900' : 'text-yellow-900'
              }`}>
                {isExpired ? 'Download Link Expired' : 'Download Limit Reached'}
              </p>
              <p className={`text-sm mt-1 ${
                isExpired ? 'text-red-700' : 'text-yellow-700'
              }`}>
                {isExpired
                  ? `This download link expired on ${formatDate(downloadRecord.expiresAt)}. Please contact support if you need access to these files.`
                  : `You have used all ${downloadRecord.maxDownloads} available downloads for this product. Please contact support if you need additional downloads.`
                }
              </p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {downloadMessage && (
          <div className="rounded-lg p-4 mb-6 bg-green-50 border border-green-200 flex items-center gap-3">
            <FiCheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800">{downloadMessage}</p>
          </div>
        )}

        {/* Files List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Files</h2>
          <div className="space-y-3">
            {downloadRecord.files.map((file, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-4 border rounded-lg ${
                  canDownload
                    ? 'border-gray-200 hover:border-red-300 bg-white'
                    : 'border-gray-200 bg-gray-50'
                } transition-colors`}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="p-2 bg-red-50 rounded-lg flex-shrink-0">
                    <FiFile className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {file.fileName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {file.fileType.toUpperCase()} • {formatFileSize(file.fileSize)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(file)}
                  disabled={!canDownload || downloadingFile === file.fileName}
                  className={`ml-4 flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors flex-shrink-0 ${
                    canDownload
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {downloadingFile === file.fileName ? (
                    <>
                      <Spinner size="sm" />
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <>
                      <FiDownload className="w-4 h-4" />
                      <span>Download</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-900 mb-1">Security Notice</p>
              <p className="text-sm text-yellow-700">
                This download link is personalized for you and should not be shared. All downloads are tracked and logged. If you experience any issues, please contact support at {' '}
                <a href="mailto:support@casadeele.com" className="underline font-medium">
                  support@casadeele.com
                </a>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Download;
