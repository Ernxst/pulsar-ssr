import { redirect } from 'pulsar';
import { LiveReload } from 'pulsar/components';
import { type ActionFunctionArgs, useActionData } from 'pulsar/actions';

const inputClassName =
	'w-full rounded border border-gray-500 px-2 py-1 text-lg';

export default function NewPost() {
	const errors = useActionData<typeof actions>('default');

	return (
		<>
			<LiveReload />
			<form formaction="default">
				<p>
					<label>
						Post Title:{' '}
						{errors?.title ? (
							<em class="text-red-600">
								{errors.title}
							</em>
						) : null}
						<input type="text" name="title" class={inputClassName} />
					</label>
				</p>
				<p>
					<label>
						Post Slug:{' '}
						{errors?.slug ? (
							<em class="text-red-600">
								{errors.slug}
							</em>
						) : null}
						<input type="text" name="slug" class={inputClassName} />
					</label>
				</p>
				<p>
					<label for="markdown">
						Markdown:{' '}
						{errors?.markdown ? (
							<em class="text-red-600">
								{errors.markdown}
							</em>
						) : null}
					</label>
					<br />
					<textarea
						id="markdown"
						rows={20}
						name="markdown"
						class={`${inputClassName} font-mono`}
					/>
				</p>
				<p class="text-right">
					<button
						type="submit"
						class="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400 disabled:bg-blue-300"
					>
						Create Post
					</button>
				</p>
			</form>
		</>
	);
}

export const actions = {
	async default({ request, json }: ActionFunctionArgs) {
		const formData = await request.formData();

		const title = formData.get('title');
		const slug = formData.get('slug');
		const markdown = formData.get('markdown');

		const errors = {
			title: title ? null : 'Title is required',
			slug: slug ? null : 'Slug is required',
			markdown: markdown ? null : 'Markdown is required',
		};

		const hasErrors = Object.values(errors).some(Boolean);
		if (hasErrors) {
			// TODO: Fix this is redirecting to the new route - (some native HTML issue)
			return json(errors, { status: 400 });
		}

		// await createPost({ title, slug, markdown });

		throw redirect('/welcome');
	},
};
