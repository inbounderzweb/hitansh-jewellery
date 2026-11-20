'use client';

import { useActionState } from 'react';
import { login, type LoginState } from '../actions/auth';

export default function LoginForm({ next }: { next: string }) {
	const [state, action, pending] = useActionState<LoginState, FormData>(
		login,
		{},
	);
	return (
		<form action={action} className="a-form a-login__form">
			<input type="hidden" name="next" value={next} />
			<div className="a-field">
				<label htmlFor="email">Email</label>
				<input
					id="email"
					name="email"
					type="email"
					autoComplete="username"
					defaultValue={state.email}
					required
				/>
			</div>
			<div className="a-field">
				<label htmlFor="password">Password</label>
				<input
					id="password"
					name="password"
					type="password"
					autoComplete="current-password"
					required
				/>
			</div>
			{state.error && (
				<p className="a-alert" role="alert">
					{state.error}
				</p>
			)}
			<button
				type="submit"
				className="a-btn a-btn--gold"
				disabled={pending}
			>
				{pending ? 'Signing in…' : 'Sign in'}
			</button>
		</form>
	);
}
