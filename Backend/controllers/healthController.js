export function getHealthStatus(req, res) {
  const isDbConnected = req.app.get('isDbConnected') === true
  if (isDbConnected) {
    return res.send('Backend is running and DB is connected!')
  }
  return res.send('Backend is running but DB is not connected.')
}


