#!/usr/bin/env node
/**
 * Create an admin account, or reset an existing account's password.
 *
 *   npm run admin:create -- owner@example.com "Full Name"
 *
 * Reads MONGODB_URI / MONGODB_DB from the environment or from .env.local.
 * The password is typed interactively (never passed on the command line,
 * so it doesn't end up in shell history). Set ADMIN_PASSWORD to script it.
 */
import { existsSync, readFileSync } from 'node:fs';
import { stdin, stdout } from 'node:process';
import { MongoClient } from 'mongodb';
import { PASSWORD_MIN_LENGTH, hashPassword } from '../src/lib/auth/password.ts';

// Minimal .env.local loader (no dependency on dotenv).
for (const file of ['.env.local', '.env']) {
	if (!existsSync(file)) continue;
	for (const line of readFileSync(file, 'utf8').split('\n')) {
		const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
		if (match && process.env[match[1]] === undefined)
			process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
	}
}

function promptHidden(question) {
	return new Promise((resolve) => {
		stdout.write(question);
		let input = '';
		stdin.setRawMode?.(true);
		stdin.resume();
		stdin.setEncoding('utf8');
		const onData = (char) => {
			if (char === '\u0003') process.exit(130);
			if (char === '\r' || char === '\n' || char === '\u0004') {
				stdin.setRawMode?.(false);
				stdin.pause();
				stdin.off('data', onData);
				stdout.write('\n');
				resolve(input);
			} else if (char === '\u007f') input = input.slice(0, -1);
			else input += char;
		};
		stdin.on('data', onData);
	});
}

const [emailArg, ...nameParts] = process.argv.slice(2);
const email = (emailArg ?? '').trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
	console.error('Usage: npm run admin:create -- <email> ["Full Name"]');
	process.exit(1);
}
if (!process.env.MONGODB_URI) {
	console.error('MONGODB_URI is not set (environment or .env.local).');
	process.exit(1);
}

let password = process.env.ADMIN_PASSWORD;
if (!password) {
	password = await promptHidden(`Password for ${email}: `);
	const again = await promptHidden('Repeat password: ');
	if (password !== again) {
		console.error('Passwords do not match.');
		process.exit(1);
	}
}
if (password.length < PASSWORD_MIN_LENGTH) {
	console.error(`Use at least ${PASSWORD_MIN_LENGTH} characters.`);
	process.exit(1);
}

const client = new MongoClient(process.env.MONGODB_URI);
try {
	await client.connect();
	const db = client.db(process.env.MONGODB_DB || 'hitansh');
	const users = db.collection('adminUsers');
	await users.createIndex(
		{ email: 1 },
		{ unique: true, name: 'email_unique' },
	);
	const passwordHash = await hashPassword(password);
	const name = nameParts.join(' ').trim();
	const result = await users.updateOne(
		{ email },
		{
			$set: { passwordHash, ...(name && { name }) },
			$setOnInsert: {
				email,
				createdAt: new Date(),
				...(!name && { name: '' }),
			},
		},
		{ upsert: true },
	);
	if (result.upsertedCount) {
		console.log(`Admin account created for ${email}.`);
	} else {
		// A password reset signs the account out everywhere.
		const user = await users.findOne({ email });
		await db.collection('sessions').deleteMany({ userId: user._id });
		console.log(
			`Password updated for ${email}; existing sessions signed out.`,
		);
	}
} finally {
	await client.close();
}
