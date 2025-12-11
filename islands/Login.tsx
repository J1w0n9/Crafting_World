import { useEffect } from "preact/hooks";
import { supabase } from "../utils/supabase.ts";
import { useSignal } from "@preact/signals";

export default function Login() {
  const email = useSignal("");
  const password = useSignal("");
  const error = useSignal<string | null>(null);
  const success = useSignal<string | null>(null);
  const loading = useSignal(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_IN") {
          // Redirect to home page after login
          location.href = "/";
        }
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const onLogin = async (e: Event) => {
    e.preventDefault();
    loading.value = true;
    error.value = null;
    success.value = null;

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      });

      if (signInError) {
        throw new Error(signInError.message);
      }
      // The onAuthStateChange listener will handle the redirect
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  const onSignUp = async (e: Event) => {
    e.preventDefault();
    loading.value = true;
    error.value = null;
    success.value = null;

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }
      success.value = "Success! Please check your email for a confirmation link.";
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  return (
    <div class="w-full h-full flex justify-center items-center p-4">
      <div class="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-gray-900 dark:text-white">
        <h1 class="text-3xl font-bold text-center mb-6">Crafting World</h1>
        <form>
          <div class="mb-4">
            <label for="email" class="block text-sm font-bold mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email.value}
              onInput={(e) => email.value = e.currentTarget.value}
              class="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-indigo-500"
              required
              autocomplete="email"
            />
          </div>
          <div class="mb-6">
            <label for="password" class="block text-sm font-bold mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password.value}
              onInput={(e) => password.value = e.currentTarget.value}
              class="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-indigo-500"
              required
              autocomplete="current-password"
            />
          </div>
          <div class="flex items-center justify-between gap-4">
            <button
              type="submit"
              onClick={onLogin}
              disabled={loading.value}
              class="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-500 transition-colors"
            >
              {loading.value ? "..." : "Login"}
            </button>
            <button
              type="button"
              onClick={onSignUp}
              disabled={loading.value}
              class="w-full bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-500 transition-colors"
            >
              {loading.value ? "..." : "Sign Up"}
            </button>
          </div>
          {error.value && (
            <p class="mt-4 text-red-400 text-center">{error.value}</p>
          )}
          {success.value && (
            <p class="mt-4 text-green-400 text-center">{success.value}</p>
          )}
        </form>
      </div>
    </div>
  );
}
