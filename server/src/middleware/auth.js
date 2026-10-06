import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import User from '../models/User.js';
import { asyncHandler, HttpError } from '../utils/asyncHandler.js';

export const signToken = (user) =>
  jwt.sign({ sub: String(user._id) }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Please log in to continue.');

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw new HttpError(401, 'Your session has expired. Please log in again.');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new HttpError(401, 'Account not found. Please log in again.');
  req.user = user;
  next();
});
