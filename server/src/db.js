const dns = require('dns');
const mongoose = require('mongoose');

mongoose.set('strictQuery', true);

/** mongodb+srv — Windows/일부 ISP DNS에서 SRV(querySrv) 조회가 거부되는 경우 대비 */
function configureDnsForSrv(uri) {
  if (!uri.startsWith('mongodb+srv://')) return;

  const custom = process.env.MONGODB_DNS_SERVERS;
  if (custom && String(custom).trim()) {
    dns.setServers(
      String(custom)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    );
    return;
  }

  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
}

const DEFAULT_LOCAL_MONGODB_URI = 'mongodb://127.0.0.1:27017/shoping-mall';

/**
 * MONGODB_ATLAS_URL이 있으면 Atlas 우선, 없을 때만 로컬(MONGODB_URI) 사용
 * @returns {{ uri: string, source: 'atlas' | 'local' }}
 */
function resolveMongoUri() {
  const atlas =
    (typeof process.env.MONGODB_ATLAS_URL === 'string' && process.env.MONGODB_ATLAS_URL.trim()) ||
    (typeof process.env.MONGODB_ALTAS_URL === 'string' && process.env.MONGODB_ALTAS_URL.trim()) ||
    '';

  if (atlas) {
    return { uri: atlas, source: 'atlas' };
  }

  const local =
    (typeof process.env.MONGODB_URI === 'string' && process.env.MONGODB_URI.trim()) ||
    DEFAULT_LOCAL_MONGODB_URI;

  return { uri: local, source: 'local' };
}

async function connectDB(uri) {
  if (!uri || typeof uri !== 'string') {
    throw new Error(
      'MongoDB URI가 비어 있습니다. server/.env 에 MONGODB_ATLAS_URL 또는 MONGODB_URI 를 설정하세요.'
    );
  }

  try {
    configureDnsForSrv(uri);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15_000,
    });
  } catch (err) {
    const hint =
      '\n가능한 원인: MongoDB가 실행 중이 아님(로컬 27017), 방화벽, 잘못된 URI.\n' +
      '로컬 개발: 프로젝트 루트에서 `docker compose up -d` 로 Mongo를 띄운 뒤 다시 시도하세요.';
    throw new Error(`${err.message}${hint}`);
  }
}

module.exports = { connectDB, mongoose, resolveMongoUri, DEFAULT_LOCAL_MONGODB_URI };
