import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['x-access-token'];

  if (authHeader === undefined)
    return res.status(403).json({
      error: 'Unauthorized. Please log in!',
    });

  const [_, token] = authHeader.split(' ');
  if (token === undefined)
    return res.status(403).json({
      error: 'Unauthorized. Please log in!',
    });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(403).json({
        error: err.message,
      });
      return;
    }

    req.decoded = decoded;
    req.token = token;
    next();
  });
};
