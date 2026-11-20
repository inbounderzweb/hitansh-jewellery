import 'server-only';
import { MongoClient, type Db } from 'mongodb';
import type {
	AdminUserDoc,
	BannerRingDoc,
	CollectionDoc,
	EnquiryDoc,
	HeroSlideDoc,
	MakingDoc,
	MetaDoc,
	ProductDoc,
	RateLimitDoc,
	SessionDoc,
} from './types';

/**
 * MongoDB connection. Configure with `MONGODB_URI` (and optionally
 * `MONGODB_DB`, default "hitansh"). One client is shared per server process;
 * in development it is kept on `globalThis` so hot reloads don't open new
 * connections.
 */

export const isDbConfigured = () => !!process.env.MONGODB_URI;

const globalForMongo = globalThis as unknown as {
	__mongo?: Promise<Db>;
};

async function connect(): Promise<Db> {
	const uri = process.env.MONGODB_URI;
	if (!uri) throw new Error('MONGODB_URI is not set');
	const client = new MongoClient(uri, {
		appName: 'hitansh-site',
		serverSelectionTimeoutMS: 8_000,
	});
	await client.connect();
	const db = client.db(process.env.MONGODB_DB || 'hitansh');
	await ensureIndexes(db);
	return db;
}

export function getDb(): Promise<Db> {
	if (!globalForMongo.__mongo) {
		globalForMongo.__mongo = connect().catch((error) => {
			// Allow a later request to retry instead of caching the failure.
			globalForMongo.__mongo = undefined;
			throw error;
		});
	}
	return globalForMongo.__mongo;
}

export async function collections() {
	const db = await getDb();
	return {
		products: db.collection<ProductDoc>('products'),
		collections: db.collection<CollectionDoc>('collections'),
		enquiries: db.collection<EnquiryDoc>('enquiries'),
		adminUsers: db.collection<AdminUserDoc>('adminUsers'),
		sessions: db.collection<SessionDoc>('sessions'),
		rateLimits: db.collection<RateLimitDoc>('rateLimits'),
		meta: db.collection<MetaDoc>('meta'),
		bannerRings: db.collection<BannerRingDoc>('bannerRings'),
		heroSlides: db.collection<HeroSlideDoc>('heroSlides'),
		homeSections: db.collection<MakingDoc>('homeSections'),
	};
}

async function ensureIndexes(db: Db) {
	await Promise.all([
		db.collection('products').createIndexes([
			{ key: { slug: 1 }, unique: true, name: 'slug_unique' },
			{
				key: { reference: 1 },
				unique: true,
				name: 'reference_unique',
				partialFilterExpression: { reference: { $type: 'string' } },
			},
			{ key: { position: 1 }, name: 'position' },
			{ key: { collectionIds: 1 }, name: 'collectionIds' },
			{ key: { createdAt: -1 }, name: 'createdAt' },
		]),
		db
			.collection('bannerRings')
			.createIndex({ position: 1 }, { name: 'position' }),
		db
			.collection('heroSlides')
			.createIndex({ position: 1 }, { name: 'position' }),
		db.collection('collections').createIndexes([
			{ key: { slug: 1 }, unique: true, name: 'slug_unique' },
			{ key: { position: 1 }, name: 'position' },
		]),
		db.collection('enquiries').createIndexes([
			{ key: { createdAt: -1 }, name: 'createdAt' },
			{ key: { status: 1, createdAt: -1 }, name: 'status_createdAt' },
		]),
		db
			.collection('adminUsers')
			.createIndex({ email: 1 }, { unique: true, name: 'email_unique' }),
		db.collection('sessions').createIndexes([
			{ key: { expiresAt: 1 }, expireAfterSeconds: 0, name: 'ttl' },
			{ key: { userId: 1 }, name: 'userId' },
		]),
		db
			.collection('rateLimits')
			.createIndex(
				{ expiresAt: 1 },
				{ expireAfterSeconds: 0, name: 'ttl' },
			),
	]);
}
