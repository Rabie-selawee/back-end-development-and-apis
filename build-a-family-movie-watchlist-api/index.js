import express from 'express';
import jwt from 'jsonwebtoken';
import { authenticate } from './middleware/authenticate.js';
import { authorizeModification } from './middleware/authorize.js';
import { 
  findByUsername, 
  getWatchlist, 
  addMovie, 
  updateMovie, 
  deleteMovie 
} from './utils/db.js';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'secret-key';

// 1. Auth Login Route
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const user = findByUsername(username);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // دعم كلاً من _password و password للمطابقة التامة
  const validPassword = user._password || user.password;
  if (validPassword !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    SECRET_KEY,
    { expiresIn: '1h' }
  );

  return res.status(200).json({ token });
});

// 2. Watchlist Routes

// GET /api/watchlist/:userId
app.get('/api/watchlist/:userId', authenticate, (req, res) => {
  const userId = Number(req.params.userId);
  const watchlist = getWatchlist(userId);
  
  if (watchlist === null) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.status(200).json(watchlist);
});

// POST /api/watchlist/:userId/movies
app.post('/api/watchlist/:userId/movies', authenticate, authorizeModification, (req, res) => {
  const userId = Number(req.params.userId);
  const movie = addMovie(userId, req.body);
  
  if (!movie) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.status(201).json(movie);
});

// PUT /api/watchlist/:userId/movies/:movieId
app.put('/api/watchlist/:userId/movies/:movieId', authenticate, authorizeModification, (req, res) => {
  const userId = Number(req.params.userId);
  const movieId = Number(req.params.movieId);
  
  const updatedMovie = updateMovie(userId, movieId, req.body);
  if (!updatedMovie) {
    return res.status(404).json({ error: 'Movie or User not found' });
  }
  return res.status(200).json(updatedMovie);
});

// DELETE /api/watchlist/:userId/movies/:movieId
app.delete('/api/watchlist/:userId/movies/:movieId', authenticate, authorizeModification, (req, res) => {
  const userId = Number(req.params.userId);
  const movieId = Number(req.params.movieId);
  
  const result = deleteMovie(userId, movieId);
  if (!result) {
    return res.status(404).json({ error: 'Movie or User not found' });
  }
  return res.status(200).json({ message: 'Movie deleted successfully' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});

export default app;