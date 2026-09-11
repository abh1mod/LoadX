const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || ''
});

const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

/**
 * Uploads a buffer to Cloudinary or falls back to data URI if credentials are not configured.
 * @param {Buffer} buffer
 * @param {string} originalName
 * @param {string} mimetype
 * @param {string} folder
 * @returns {Promise<{ url: string, publicId: string }>}
 */
const uploadBuffer = async (buffer, originalName, mimetype, folder = 'freightbid/docs') => {
  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const resourceType = mimetype === 'application/pdf' ? 'raw' : 'auto';
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          use_filename: true,
          unique_filename: true
        },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            url: result.secure_url || result.url,
            publicId: result.public_id
          });
        }
      );
      uploadStream.end(buffer);
    });
  }

  // Fallback: Generate a high-fidelity data URI so documents can be viewed directly in iframe/new tab without external Cloudinary setup
  const base64Data = buffer.toString('base64');
  const dataUri = `data:${mimetype};base64,${base64Data}`;
  return {
    url: dataUri,
    publicId: `local_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  };
};

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  uploadBuffer
};
