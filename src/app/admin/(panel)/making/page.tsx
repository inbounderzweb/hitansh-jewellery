import { getMakingForm } from '@/lib/admin/data';
import MakingForm from '@/components/admin/MakingForm';

export const metadata = { title: 'Making section' };

export default async function MakingPage() {
	const { values, saved, banner } = await getMakingForm();
	return (
		<>
			<header className="a-head">
				<div>
					<p className="a-eyebrow">
						Home page · after the brand story
					</p>
					<h1 className="a-title">Making section</h1>
				</div>
			</header>
			<p className="a-hint">
				One ring turns in the centre, then becomes four rings — one per
				stage of the craft — as visitors scroll.
				{!saved &&
					' These are the built-in settings; save once to manage them here.'}
			</p>
			<MakingForm initial={values} banner={banner} />
		</>
	);
}
