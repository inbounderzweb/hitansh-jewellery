'use client';

import { openInConfigurator } from '@/lib/scroll';

type Props = {
	gem?: string;
	metal?: string;
	className?: string;
	children: React.ReactNode;
	label?: string;
};

/** Opens the 3D studio with an optional gemstone/metal pre-selectd. */
export default function ConfigureButton({
	gem,
	metal,
	className = 'btn btn--gold',
	children,
	label,
}: Props) {
	return (
		<button
			type="button"
			className={className}
			aria-label={label}
			onClick={() => openInConfigurator(gem, metal)}
		>
			{children}
		</button>
	);
}
