import type { LoaderArgs } from 'pulsar/loader';
import { useLoaderData } from 'pulsar/loader';
import * as data from '../../data';
import appStylesHref from '../../app.css?url';

export async function loader({ request, json }: LoaderArgs) {
	const url = new URL(request.url);
	const q = url.searchParams.get('q');
	const contacts = await data.getContacts(q);
	return json({ contacts });
}

export default function App() {
	const { contacts } = useLoaderData<typeof loader>();

	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="stylesheet" href={appStylesHref} />
			</head>
			<body>
				<div id="sidebar">
					<h1>Remix Contacts</h1>
					<nav>
						{contacts.length
? (
							<ul>
								{contacts.map((contact) => (
									<li key={contact.id}>
										<a
											className={({ isActive, isPending }) =>
												isActive ? 'active' : isPending ? 'pending' : ''
											}
											href={`/contacts/${contact.id}`}
										>
											{contact.first || contact.last
? (
												<>
													{contact.first} {contact.last}
												</>
											)
: (
												<i>No Name</i>
											)}{' '}
											{contact.favorite ? <span>★</span> : null}
										</a>
									</li>
								))}
							</ul>
						)
: (
							<p>
								<i>No contacts</i>
							</p>
						)}
					</nav>
				</div>
			</body>
		</html>
	);
}
