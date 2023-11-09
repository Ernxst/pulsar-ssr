import type { LoaderFunctionArgs } from 'pulsar/loader';
import { useLoaderData } from 'pulsar/loader';
import invariant from 'tiny-invariant';
import { getContact } from '../../../data';

export async function loader({ params, json, status }: LoaderFunctionArgs) {
	invariant(params.contactId, 'Missing contactId param');
	const contact = await getContact(params.contactId);
	if (!contact) {
		status(404);
		throw new Error(`Could not find user with id "${params.contactId}"`);
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
						<a href={`https://twitter.com/${contact.twitter}`} safe>
							{contact.twitter}
						</a>
					</p>
				) : null}

				{contact.notes ? <p safe>{contact.notes}</p> : null}
			</div>
		</div>
	);
}
