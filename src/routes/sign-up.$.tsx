import { createFileRoute } from "@tanstack/solid-router";
import { SignUp } from "@/lib/auth-client";

export const Route = createFileRoute("/sign-up/$")({ component: Page });
function Page() {
  return (
    <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg
              class="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p class="text-gray-600">Join DTR System to start tracking time</p>
        </div>
        <SignUp />
      </div>
    </div>
  );
}
