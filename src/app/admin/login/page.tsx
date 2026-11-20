import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { isDbConfigured } from '@/lib/db/mongo';
import LoginForm from './LoginForm';

export const metadata = { title: 'Sign in' };

type Props = { searchParams: Promise<{ next?: string }> };

export default async function LoginPage({ searchParams }: Props) {
	if (await getSession()) redirect('/admin');
	const { next } = await searchParams;
	const configured = isDbConfigured();

	return (
		<main id="main-content" className="a-login">
			<div className="a-login__panel">
				<Image
					src="/brand/hitansh-logo.png"
					alt="Hitansh"
					width={48}
					height={48}
					className="a-login__logo"
				/>
				<p className="a-eyebrow">Hitansh Fine Jewellery</p>
				<h1 className="a-login__title">Catalogue admin</h1>
				{configured ? (
					<LoginForm next={typeof next === 'string' ? next : ''} />
				) : (
					<p className="a-alert" role="alert">
						The admin panel needs a database. Set{' '}
						<code>MONGODB_URI</code> in the environment, then create
						an account with <code>npm run admin:create</code>.
					</p>
				)}
			</div>
		</main>
	);
}
