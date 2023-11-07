import type { LoaderArgs } from 'pulsar/loader';
import { useLoaderData } from 'pulsar/loader';
import invariant from 'tiny-invariant';
import { getContact } from '../../../data';

export async function loader({ params, json }: LoaderArgs) {
	invariant(params.contactId, 'Missing contactId param');
	const contact = await getContact(params.contactId);
	if (!contact) {
		throw new Response('Not Found', { status: 404 });
	}
	return json({ contact });
}

export default function Contact() {
	const { contact } = useLoaderData<typeof loader>();

	return (
		<div id="contact">
			<div>
				<img
					alt={`${contact.first} ${contact.last} avatar`}
					key={contact.avatar}
					src={contact.avatar}
				/>
			</div>

			<div>
				<h1>
					{contact.first || contact.last ? (
						<>
							{contact.first} {contact.last}
						</>
					) : (
						<i>No Name</i>
					)}
				</h1>

				{contact.twitter ? (
					<p>
						<a href={`https://twitter.com/${contact.twitter}`}>
							{contact.twitter}
						</a>
					</p>
				) : null}

				{contact.notes ? <p>{contact.notes}</p> : null}
			</div>
		</div>
	);
}
