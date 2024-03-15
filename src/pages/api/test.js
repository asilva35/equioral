export default async function handler(req, res) {
  try {
    res.status(200).json({ response: 'ok' });
  } catch (error) {
    console.error('Error getting token or session:', error);
  }
}
