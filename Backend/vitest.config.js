export default {
  test: {
    environment: 'node',
    // env is applied to process.env BEFORE any module (incl. the controller's
    // module-level `new Razorpay()`) is imported — setupFiles run too late for that.
    // These must be set so the Razorpay client initializes and the HMAC secret
    // used by verifyPayment matches what our tests sign with.
    env: {
      NODE_ENV: 'test',
      RAZORPAY_KEY_ID: 'rzp_test_key_id',
      RAZORPAY_KEY_SECRET: 'test_hmac_secret_key_for_vitest',
      MONGO_URI: 'mongodb://localhost:27017/test_db',
      PORT: '5001',
    },
  },
}
