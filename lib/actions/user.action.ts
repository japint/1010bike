"use server";
import { signInFormSchema } from "@/lib/validators";
import { signIn, signOut } from "@/auth";

// sign in user with credentials
export async function signInWWithCredentials(
  prevState: unknown,
  formData: FormData
) {
  try {
    const user = signInFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    await signIn("credentials", user);

    return { success: true, message: "Signed in successfully" };
  } catch (error) {
    // Check if it's a redirect error by checking the error properties
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    return { success: false, message: "Invalid email or password" };
  }
}

// sign out user
export async function signOutUser() {
  await signOut();
}
