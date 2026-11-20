import Image from 'next/image';
import { contact } from '@/content/site';
import ConfigureButton from '../ConfigureButton';

export default function Appointment() {
	const subject = encodeURIComponent('Private consultation request');
	return (
		<section
			id="appointment"
			className="appointment"
			aria-labelledby="appointment-title"
		>
			<Image
				className="appointment__watermark"
				src="/brand/hitansh-monogram.png"
				alt=""
				width={444}
				height={510}
			/>
			<div className="container appointment__inner">
				<p className="eyebrow eyebrow--center" data-reveal>
					By appointment
				</p>
				<h2 id="appointment-title" className="display" data-split>
					Book a private <em>consultation</em>
				</h2>
				<p className="lede" data-reveal>
					Talk through stones, metals and proportions with our team,
					or share a design you have created in the 3D studio.
				</p>
				<div className="appointment__actions" data-reveal>
					<a
						className="btn btn--gold"
						href={`mailto:${contact.email}?subject=${subject}`}
					>
						Request an appointment
					</a>
					<ConfigureButton className="btn btn--outline">
						Open the 3D studio
					</ConfigureButton>
				</div>
			</div>
		</section>
	);
}
