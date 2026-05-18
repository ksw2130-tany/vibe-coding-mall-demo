const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB, mongoose, resolveMongoUri } = require('./db');
const userRouter = require('./routes/user.routes');
const productRouter = require('./routes/product.routes');
const cartRouter = require('./routes/cart.routes');
const orderRouter = require('./routes/order.routes');
const reviewRouter = require('./routes/review.routes');

const app = express();
app.set('etag', false);
const PORT = Number(process.env.PORT) || 5000;

/** CORS — 클라이언트(다른 포트/도메인)에서 API 호출 허용 */
const corsOptions = (() => {
  const raw = process.env.CORS_ORIGIN
  if (raw && String(raw).trim()) {
    const list = String(raw)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    return {
      origin: list.includes('*') ? true : list,
      credentials: true,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      optionsSuccessStatus: 204,
    }
  }
  return {
    origin: true,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  }
})()

app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  next();
});
/** 사용자 API — CRUD, 회원가입(POST /), 로그인(POST /login) */
app.use('/api/users', userRouter);
app.use('/api/products', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', orderRouter);
app.use('/api/reviews', reviewRouter);

app.get('/api/health', (_req, res) => {
  const dbOk = mongoose.connection.readyState === 1;
  res.json({ ok: true, mongodb: dbOk ? 'connected' : 'disconnected' });
});

async function main() {
  const { uri: mongoUri, source: mongoSource } = resolveMongoUri();

  await connectDB(mongoUri);
  console.log(
    mongoSource === 'atlas'
      ? 'MongoDB connected (Atlas — MONGODB_ATLAS_URL)'
      : 'MongoDB connected (local — MONGODB_URI)'
  );

  if (!process.env.JWT_SECRET || !String(process.env.JWT_SECRET).trim()) {
    console.warn('[WARN] JWT_SECRET이 비어 있습니다. 로그인 시 토큰 발급이 실패합니다. server/.env 를 확인하세요.');
  }

  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
