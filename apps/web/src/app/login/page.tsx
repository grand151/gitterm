import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {

	return (
		<div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
			<div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
				<div className="w-full max-w-md space-y-8">
					<div className="text-center">
						<h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
							Let's get started
						</h1>
						<p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
							Sign in to access your terminal workspace
						</p>
					</div>

					<AuthForm />
				</div>
			</div>
		</div>
	);
}
